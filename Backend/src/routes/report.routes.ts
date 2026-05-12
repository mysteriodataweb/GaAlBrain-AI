import { Request, Response, Router } from 'express';
import db from '../db/database';
import { isMemoryMode } from '../config/runtime';

const router = Router();
const useMemoryStore = () => isMemoryMode();

router.get('/teacher/:teacherId', async (req: Request, res: Response) => {
  if (useMemoryStore()) return res.json({ teacherId: req.params.teacherId, classes: [] });
  const classes = (await db.prepare('SELECT * FROM classes WHERE teacher_id = ?').all(req.params.teacherId)) as any[];

  const classReports = await Promise.all(classes.map(async (cls) => {
    const students = (await db
      .prepare(
        `SELECT u.id, u.name, u.email
         FROM users u
         JOIN class_members cm ON u.id = cm.student_id
         WHERE cm.class_id = ?`
      )
      .all(cls.id)) as any[];

    const studentStats = await Promise.all(students.map(async (student) => {
      const evaluations = (await db
        .prepare('SELECT integrity_score, concept, created_at FROM evaluations WHERE user_id = ? ORDER BY created_at DESC LIMIT 10')
        .all(student.id)) as any[];

      const averageScore = evaluations.length
        ? Math.round(evaluations.reduce((sum, evaluation) => sum + evaluation.integrity_score, 0) / evaluations.length)
        : 0;

      const conceptMap = await db
        .prepare(
          `SELECT concept_name, AVG(score) as avg_score, COUNT(*) as times_evaluated,
           (SELECT status FROM concept_scores WHERE user_id = ? AND concept_name = cs.concept_name ORDER BY evaluated_at DESC LIMIT 1) as latest_status
           FROM concept_scores cs WHERE user_id = ?
           GROUP BY concept_name`
        )
        .all(student.id, student.id);

      return {
        student,
        evaluationsCount: evaluations.length,
        averageScore,
        recentEvals: evaluations.slice(0, 3),
        conceptMap
      };
    }));

    const gapCounts: Record<string, number> = {};
    for (const stat of studentStats) {
      for (const concept of stat.conceptMap as any[]) {
        if (concept.latest_status === 'gap') {
          gapCounts[concept.concept_name] = (gapCounts[concept.concept_name] || 0) + 1;
        }
      }
    }

    const commonBlockingConcepts = Object.entries(gapCounts)
      .filter(([, count]) => count > students.length * 0.5)
      .map(([concept, affectedStudents]) => ({ concept, affectedStudents }));

    const classAverageScore = studentStats.length
      ? Math.round(studentStats.reduce((sum, stat) => sum + stat.averageScore, 0) / studentStats.length)
      : 0;

    return {
      class: cls,
      classAverageScore,
      studentCount: students.length,
      commonBlockingConcepts,
      students: studentStats
    };
  }));

  res.json({ teacherId: req.params.teacherId, classes: classReports });
});

router.get('/student/:studentId', async (req: Request, res: Response) => {
  if (useMemoryStore()) {
    return res.json({
      studentId: req.params.studentId,
      totalEvaluations: 0,
      progressCurve: [],
      activityHeatmap: [],
      globalConceptMap: [],
      recentEvaluations: []
    });
  }
  const evaluations = (await db
    .prepare('SELECT * FROM evaluations WHERE user_id = ? ORDER BY created_at DESC')
    .all(req.params.studentId)) as any[];

  const progressCurve = evaluations
    .map((evaluation) => ({
      date: evaluation.created_at,
      score: evaluation.integrity_score,
      concept: evaluation.concept
    }))
    .reverse();

  const activity = await db
    .prepare(
      `SELECT activity_date, sessions_count, total_duration_seconds
       FROM activity_logs
       WHERE user_id = ? AND activity_date >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
       ORDER BY activity_date ASC`
    )
    .all(req.params.studentId);

  const globalConceptMap = await db
    .prepare(
      `SELECT concept_name, AVG(score) as avg_score, COUNT(*) as times_evaluated,
       (SELECT status FROM concept_scores WHERE user_id = ? AND concept_name = cs.concept_name ORDER BY evaluated_at DESC LIMIT 1) as latest_status
       FROM concept_scores cs WHERE user_id = ?
       GROUP BY concept_name ORDER BY avg_score DESC`
    )
    .all(req.params.studentId, req.params.studentId);

  res.json({
    studentId: req.params.studentId,
    totalEvaluations: evaluations.length,
    progressCurve,
    activityHeatmap: activity,
    globalConceptMap,
    recentEvaluations: evaluations.slice(0, 5).map((evaluation) => ({
      ...evaluation,
      solid_concepts: safeJson(evaluation.solid_concepts),
      partial_concepts: safeJson(evaluation.partial_concepts),
      gap_concepts: safeJson(evaluation.gap_concepts),
      recommendations: safeJson(evaluation.recommendations)
    }))
  });
});

function safeJson(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}

export default router;
