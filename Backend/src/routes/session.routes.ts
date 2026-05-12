import { randomUUID } from 'crypto';
import { Request, Response, Router } from 'express';
import { z } from 'zod';
import db from '../db/database';
import { isMemoryMode, setMemoryMode } from '../config/runtime';
import { memoryStore } from '../db/memoryStore';
import { optionalAuth } from '../middleware/auth.middleware';
import { analyzeCodeForEvaluation, extractCodeFromZip, fetchPublicGithubCode } from '../services/code.service';
import { extractTextFromFile, summarizeDocumentForEvaluation } from '../services/rag.service';
import { scoreFromSignal, updateIntegrityScore } from '../services/scoring.service';
import { generateFinalEvaluation, generateSocraticQuestion, QuestionType } from '../services/socratic.service';
import { LLMMessage } from '../services/llm.service';

const router = Router();
const useMemoryStore = () => isMemoryMode();

const getParamId = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const computeDurationSeconds = (createdAt: unknown) => {
  const start = createdAt instanceof Date ? createdAt : new Date(String(createdAt));
  const startMs = start.getTime();
  if (!Number.isFinite(startMs)) return 0;
  return Math.max(0, Math.round((Date.now() - startMs) / 1000));
};

const withTimeout = <T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    )
  ]);
};

const ensureMemoryUser = (userId?: string) => {
  const id = userId || randomUUID();
  if (!memoryStore.users.has(id)) {
    memoryStore.users.set(id, {
      id,
      name: 'Demo User',
      email: `${id}@local`,
      role: 'student',
      password_hash: 'not-used',
      created_at: new Date().toISOString()
    });
  }
  return id;
};

const addMemoryMessage = (sessionId: string, message: { role: 'user' | 'assistant'; content: string; confidence_bet?: number | null; is_paste_detected?: number }) => {
  const list = memoryStore.messagesBySession.get(sessionId) || [];
  list.push({
    id: randomUUID(),
    session_id: sessionId,
    role: message.role,
    content: message.content,
    confidence_bet: message.confidence_bet ?? null,
    is_paste_detected: message.is_paste_detected ?? 0,
    created_at: new Date().toISOString()
  });
  memoryStore.messagesBySession.set(sessionId, list);
};

const createSessionSchema = z.object({
  userId: z.string().optional(),
  concept: z.string().min(2),
  inputType: z.enum(['document', 'generic', 'code']).default('generic'),
  githubUrl: z.string().url().optional().or(z.literal('')),
  confidence: z.coerce.number().min(0).max(100).default(50),
  duration: z.coerce.number().min(5).max(120).default(15)
});

const buildContentIntro = (inputType: string, concept: string, documentContext: string) => {
  if (!documentContext.trim()) return null;
  const preview = documentContext
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 520);

  if (inputType === 'document') {
    return `J'ai parcouru le document autour de "${concept}". J'y repère notamment ceci: ${preview}${documentContext.length > 520 ? '...' : ''}`;
  }

  if (inputType === 'code') {
    return `J'ai parcouru le code soumis pour "${concept}". Ce que j'en retiens avant de te questionner: ${preview}${documentContext.length > 520 ? '...' : ''}`;
  }

  return null;
};

router.post('/', optionalAuth, async (req: Request, res: Response) => {
  try {
    console.log('📝 Creating session - req.body:', req.body);
    console.log('📝 req.file:', req.file);
    
    const parsed = createSessionSchema.safeParse(req.body);
    if (!parsed.success) {
      console.error('❌ Validation error:', parsed.error.flatten());
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const { concept, inputType, githubUrl, confidence, duration } = parsed.data;
    let userId = req.user?.id || parsed.data.userId;
    if (!userId && !useMemoryStore()) {
      setMemoryMode(true);
    }
    if (!userId && useMemoryStore()) userId = ensureMemoryUser();
    if (!userId) return res.status(400).json({ error: 'userId requis ou token Bearer requis' });
    if (useMemoryStore()) userId = ensureMemoryUser(userId);

    console.log('✅ Session params - concept:', concept, 'inputType:', inputType, 'confidence:', confidence, 'duration:', duration, 'userId:', userId);

    const file = req.file;
    let filePath = file?.path || null;
    let documentContext = '';

    if (inputType === 'document' && file) {
      const text = await extractTextFromFile(file.path, file.mimetype);
      documentContext = await summarizeDocumentForEvaluation(text, concept);
    }

    if (inputType === 'code') {
      let code = '';
      if (file && file.originalname.toLowerCase().endsWith('.zip')) {
        code = await extractCodeFromZip(file.path);
      } else if (githubUrl) {
        code = await fetchPublicGithubCode(githubUrl);
      }
      const analysis = await analyzeCodeForEvaluation(code);
      documentContext = analysis.context;
    }

    const sessionId = randomUUID();
    const contentIntro = buildContentIntro(inputType, concept, documentContext);
    
    let firstQuestion;
    try {
      firstQuestion = await withTimeout(
        generateSocraticQuestion(
          concept,
          [{ role: 'user', content: `Je veux être évalué sur: ${concept}. Ma confiance initiale: ${confidence}%.` }],
          { confidence, round: 1, inputType, documentContext }
        ),
        15000,
        'Question generation timeout'
      );
    } catch (questionError) {
      console.error('Erreur génération question socratique:', questionError);
      firstQuestion = {
        question: `Dis-moi ce que tu comprends vraiment sur "${concept}". Pas de phrases toutes faites ni de définitions du cours - tes propres mots.`,
        question_type: 'clarification' as QuestionType,
        feedback_type: 'clarifier' as const,
        concept_assessed: concept,
        understanding_signal: 'unknown' as const,
        score_delta: 0,
        is_paste_suspected: false,
        escalate_difficulty: false,
        internal_note: 'Fallback après erreur LLM'
      };
    }

    if (useMemoryStore()) {
      memoryStore.sessions.set(sessionId, {
        id: sessionId,
        user_id: userId,
        concept,
        input_type: inputType,
        file_path: filePath,
        github_url: githubUrl || null,
        document_context: documentContext || null,
        confidence_declared: confidence,
        duration_minutes: duration,
        status: 'active',
        integrity_score: 50,
        created_at: new Date().toISOString(),
        completed_at: null
      });
      if (contentIntro) addMemoryMessage(sessionId, { role: 'assistant', content: contentIntro });
      addMemoryMessage(sessionId, { role: 'assistant', content: firstQuestion.question });
    } else {
      await db.prepare(
        `INSERT INTO sessions
         (id, user_id, concept, input_type, file_path, github_url, document_context, confidence_declared)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(sessionId, userId, concept, inputType, filePath, githubUrl || null, documentContext || null, confidence);

      if (contentIntro) {
        await db.prepare('INSERT INTO messages (id, session_id, role, content) VALUES (?, ?, ?, ?)').run(
          randomUUID(),
          sessionId,
          'assistant',
          contentIntro
        );
      }

      await db.prepare('INSERT INTO messages (id, session_id, role, content) VALUES (?, ?, ?, ?)').run(
        randomUUID(),
        sessionId,
        'assistant',
        firstQuestion.question
      );
    }

    res.status(201).json({
      sessionId,
      firstQuestion: firstQuestion.question,
      intro: contentIntro,
      feedback_type: firstQuestion.feedback_type,
      question_type: firstQuestion.question_type,
      understanding_signal: firstQuestion.understanding_signal,
      documentContext: documentContext ? 'Contexte analysé avec succès' : null
    });
  } catch (error: any) {
    console.error('❌ Session creation error - Full stack:', error);
    console.error('Error message:', error.message);
    console.error('Error type:', error.constructor.name);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: error.message || 'Erreur lors de la création de la session' });
  }
});

router.post('/:id/message', async (req: Request, res: Response) => {
  try {
    const parsed = z
      .object({
        content: z.string().min(1),
        confidenceBet: z.coerce.number().min(0).max(100).optional(),
        isPasteSuspected: z.boolean().optional()
      })
      .safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    if (useMemoryStore()) {
      const sessionId = getParamId(req.params.id);
      if (!sessionId) return res.status(400).json({ error: 'sessionId manquant' });
      const session = memoryStore.sessions.get(sessionId);
      if (!session) return res.status(404).json({ error: 'Session introuvable' });
      if (session.status !== 'active') return res.status(409).json({ error: 'Session non active' });

      const dbMessages = (memoryStore.messagesBySession.get(sessionId) || []).map((message) => ({
        role: message.role,
        content: message.content
      })) as LLMMessage[];

      addMemoryMessage(sessionId, {
        role: 'user',
        content: parsed.data.content,
        confidence_bet: parsed.data.confidenceBet ?? null,
        is_paste_detected: parsed.data.isPasteSuspected ? 1 : 0
      });

      const messages: LLMMessage[] = [...dbMessages, { role: 'user', content: parsed.data.content }];
      const roundCount = Math.ceil(messages.length / 2) + 1;
      const previousSignals = (memoryStore.conceptScoresBySession.get(sessionId) || []).map((score) => score.status);
      const response = await generateSocraticQuestion(session.concept, messages, {
        confidence: session.confidence_declared,
        round: roundCount,
        inputType: session.input_type as 'document' | 'generic' | 'code',
        documentContext: session.document_context,
        previousSignals,
        isPasteDetected: parsed.data.isPasteSuspected
      });

      addMemoryMessage(sessionId, { role: 'assistant', content: response.question });

      const newScore = updateIntegrityScore(
        session.integrity_score,
        response.score_delta,
        Boolean(response.is_paste_suspected || parsed.data.isPasteSuspected)
      );
      session.integrity_score = newScore;
      memoryStore.sessions.set(session.id, session);

      const conceptScores = memoryStore.conceptScoresBySession.get(sessionId) || [];
      conceptScores.push({
        id: randomUUID(),
        session_id: sessionId,
        user_id: session.user_id,
        concept_name: response.concept_assessed,
        score: scoreFromSignal(response.understanding_signal, response.score_delta),
        status: response.understanding_signal,
        evaluated_at: new Date().toISOString()
      });
      memoryStore.conceptScoresBySession.set(sessionId, conceptScores);

      return res.json({
        question: response.question,
        feedback_type: response.feedback_type,
        question_type: response.question_type,
        understanding_signal: response.understanding_signal,
        integrity_score: newScore,
        is_paste_suspected: response.is_paste_suspected,
        escalate_difficulty: response.escalate_difficulty,
        round: roundCount
      });
    }

    const session = (await db.prepare('SELECT * FROM sessions WHERE id = ?').get(req.params.id)) as any;
    if (!session) return res.status(404).json({ error: 'Session introuvable' });
    if (session.status !== 'active') return res.status(409).json({ error: 'Session non active' });

    const dbMessages = (await db
      .prepare('SELECT role, content FROM messages WHERE session_id = ? ORDER BY created_at ASC')
      .all(req.params.id)) as LLMMessage[];

    await db.prepare(
      `INSERT INTO messages (id, session_id, role, content, confidence_bet, is_paste_detected)
       VALUES (?, ?, 'user', ?, ?, ?)`
    ).run(
      randomUUID(),
      req.params.id,
      parsed.data.content,
      parsed.data.confidenceBet ?? null,
      parsed.data.isPasteSuspected ? 1 : 0
    );

    const messages: LLMMessage[] = [...dbMessages, { role: 'user', content: parsed.data.content }];
    const roundCount = Math.ceil(messages.length / 2) + 1;
    const previousSignals = (await db
      .prepare('SELECT status FROM concept_scores WHERE session_id = ? ORDER BY evaluated_at ASC')
      .all(req.params.id)) as Array<{ status: string }>;
    const response = await generateSocraticQuestion(session.concept, messages, {
      confidence: session.confidence_declared,
      round: roundCount,
      inputType: session.input_type as 'document' | 'generic' | 'code',
      documentContext: session.document_context,
      previousSignals: previousSignals.map((score) => score.status),
      isPasteDetected: parsed.data.isPasteSuspected
    });

    await db.prepare('INSERT INTO messages (id, session_id, role, content) VALUES (?, ?, ?, ?)').run(
      randomUUID(),
      req.params.id,
      'assistant',
      response.question
    );

    const newScore = updateIntegrityScore(
      session.integrity_score,
      response.score_delta,
      Boolean(response.is_paste_suspected || parsed.data.isPasteSuspected)
    );
    await db.prepare('UPDATE sessions SET integrity_score = ? WHERE id = ?').run(newScore, req.params.id);

    await db.prepare(
      `INSERT INTO concept_scores (id, session_id, user_id, concept_name, score, status)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(
      randomUUID(),
      req.params.id,
      session.user_id,
      response.concept_assessed,
      scoreFromSignal(response.understanding_signal, response.score_delta),
      response.understanding_signal
    );

    res.json({
      question: response.question,
      feedback_type: response.feedback_type,
      question_type: response.question_type,
      understanding_signal: response.understanding_signal,
      integrity_score: newScore,
      is_paste_suspected: response.is_paste_suspected,
      escalate_difficulty: response.escalate_difficulty,
      round: roundCount
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/complete', async (req: Request, res: Response) => {
  try {
    console.log('🔴 POST /complete - sessionId:', req.params.id);
    if (useMemoryStore()) {
      const sessionId = getParamId(req.params.id);
      console.log('📝 Memory mode - sessionId:', sessionId);
      if (!sessionId) return res.status(400).json({ error: 'sessionId manquant' });
      const session = memoryStore.sessions.get(sessionId);
      console.log('📝 Session found:', !!session);
      if (!session) return res.status(404).json({ error: 'Session introuvable' });

      const dbMessages = (memoryStore.messagesBySession.get(sessionId) || []).map((message) => ({
        role: message.role,
        content: message.content
      })) as LLMMessage[];

      console.log('📝 Messages count:', dbMessages.length);
      console.log('📝 Calling generateFinalEvaluation with withTimeout wrapper...');
      let evaluation;
      try {
        evaluation = await withTimeout(
          generateFinalEvaluation(session.concept, dbMessages, session.confidence_declared),
          20000,
          'Evaluation generation timeout'
        );
        console.log('✅ Evaluation completed:', evaluation.integrity_score);
      } catch (error: any) {
        console.error('⏱️ TIMEOUT OR ERROR in evaluation:', error?.message || String(error));
        console.log('📝 Using fallback evaluation due to timeout/error');
        // Create a basic fallback evaluation
        evaluation = {
          integrity_score: 60,
          calibration_gap: 10,
          calibration_label: 'moderate',
          solid_concepts: [],
          partial_concepts: [session.concept],
          gap_concepts: [],
          strengths: ['Participation à la session'],
          weaknesses: ['Analyse détaillée indisponible - génération en timeout'],
          recommendations: [
            {
              concept: session.concept,
              why: 'L\'analyse était en cours de génération.',
              prerequisite_missing: null,
              resource_type: 'exercice',
              search_query: `${session.concept} exercices pratiques`
            }
          ],
          metacognition_note: 'Évaluation simplifiée due to timeout',
          cognitive_profile: 'intermédiaire',
          summary: 'Session terminée avec évaluation partielle.'
        };
      }
      const evalId = randomUUID();
      const durationSeconds = computeDurationSeconds(session.created_at);

      session.status = 'completed';
      session.integrity_score = evaluation.integrity_score;
      session.completed_at = new Date().toISOString();
      memoryStore.sessions.set(session.id, session);

      const evaluations = memoryStore.evaluationsByUser.get(session.user_id) || [];
      evaluations.push({
        id: evalId,
        session_id: sessionId,
        user_id: session.user_id,
        concept: session.concept,
        integrity_score: evaluation.integrity_score,
        confidence_declared: session.confidence_declared,
        calibration_gap: evaluation.calibration_gap,
        solid_concepts: evaluation.solid_concepts,
        partial_concepts: evaluation.partial_concepts,
        gap_concepts: evaluation.gap_concepts,
        recommendations: evaluation.recommendations,
        duration_seconds: durationSeconds,
        rounds_count: Math.floor(dbMessages.length / 2),
        created_at: new Date().toISOString()
      });
      memoryStore.evaluationsByUser.set(session.user_id, evaluations);

      return res.json({ evaluationId: evalId, ...evaluation, duration_seconds: durationSeconds });
    }

    const session = (await db.prepare('SELECT * FROM sessions WHERE id = ?').get(req.params.id)) as any;
    if (!session) return res.status(404).json({ error: 'Session introuvable' });

    const dbMessages = (await db
      .prepare('SELECT role, content FROM messages WHERE session_id = ? ORDER BY created_at ASC')
      .all(req.params.id)) as LLMMessage[];

    let evaluation;
    try {
      console.log('🔴 DB mode - calling generateFinalEvaluation');
      evaluation = await withTimeout(
        generateFinalEvaluation(session.concept, dbMessages, session.confidence_declared),
        20000,
        'Evaluation generation timeout'
      );
      console.log('✅ DB mode - evaluation completed:', evaluation.integrity_score);
    } catch (error: any) {
      console.error('⏱️ DB mode - TIMEOUT OR ERROR in evaluation:', error?.message || String(error));
      console.log('📝 Using fallback evaluation due to timeout/error');
      // Create a basic fallback evaluation
      evaluation = {
        integrity_score: 60,
        calibration_gap: 10,
        calibration_label: 'moderate',
        solid_concepts: [],
        partial_concepts: [session.concept],
        gap_concepts: [],
        strengths: ['Participation à la session'],
        weaknesses: ['Analyse détaillée indisponible - génération en timeout'],
        recommendations: [
          {
            concept: session.concept,
            why: 'L\'analyse était en cours de génération.',
            prerequisite_missing: null,
            resource_type: 'exercice',
            search_query: `${session.concept} exercices pratiques`
          }
        ],
        metacognition_note: 'Évaluation simplifiée due to timeout',
        cognitive_profile: 'intermédiaire',
        summary: 'Session terminée avec évaluation partielle.'
      };
    }
    const evalId = randomUUID();
    const durationSeconds = computeDurationSeconds(session.created_at);

    await db.prepare(
      `INSERT INTO evaluations (
        id, session_id, user_id, concept, integrity_score, confidence_declared,
        calibration_gap, solid_concepts, partial_concepts, gap_concepts,
        recommendations, duration_seconds, rounds_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      evalId,
      req.params.id,
      session.user_id,
      session.concept,
      evaluation.integrity_score,
      session.confidence_declared,
      evaluation.calibration_gap,
      JSON.stringify(evaluation.solid_concepts),
      JSON.stringify(evaluation.partial_concepts),
      JSON.stringify(evaluation.gap_concepts),
      JSON.stringify(evaluation.recommendations),
      durationSeconds,
      Math.floor(dbMessages.length / 2)
    );

    await db.prepare("UPDATE sessions SET status = 'completed', completed_at = CURRENT_TIMESTAMP, integrity_score = ? WHERE id = ?").run(
      evaluation.integrity_score,
      req.params.id
    );

    await logActivity(session.user_id, durationSeconds);
    res.json({ evaluationId: evalId, ...evaluation, duration_seconds: durationSeconds });
  } catch (error: any) {
    console.error('❌ Complete session error:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: error.message || 'Erreur lors de la terminaison de la session' });
  }
});

router.get('/:id/evaluation', async (req: Request, res: Response) => {
  if (useMemoryStore()) {
    const sessionId = getParamId(req.params.id);
    if (!sessionId) return res.status(400).json({ error: 'sessionId manquant' });
    const session = memoryStore.sessions.get(sessionId);
    if (!session) return res.status(404).json({ error: 'Session introuvable' });
    const evaluations = memoryStore.evaluationsByUser.get(session.user_id) || [];
    const evaluation = evaluations.find((item) => item.session_id === sessionId);
    if (!evaluation) return res.status(404).json({ error: 'Evaluation introuvable' });
    return res.json({ evaluation });
  }

  const evaluation = await db
    .prepare('SELECT * FROM evaluations WHERE session_id = ? ORDER BY created_at DESC LIMIT 1')
    .get(req.params.id);
  if (!evaluation) return res.status(404).json({ error: 'Evaluation introuvable' });
  res.json({ evaluation });
});

router.get('/', async (req: Request, res: Response) => {
  const userId = typeof req.query.userId === 'string' ? req.query.userId : undefined;

  if (useMemoryStore()) {
    const sessions = Array.from(memoryStore.sessions.values())
      .filter((session) => !userId || session.user_id === userId)
      .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
    return res.json(sessions);
  }

  const sessions = userId
    ? await db.prepare('SELECT * FROM sessions WHERE user_id = ? ORDER BY created_at DESC').all(userId)
    : await db.prepare('SELECT * FROM sessions ORDER BY created_at DESC LIMIT 50').all();
  res.json(sessions);
});

router.get('/:id', async (req: Request, res: Response) => {
  if (useMemoryStore()) {
    const sessionId = getParamId(req.params.id);
    if (!sessionId) return res.status(400).json({ error: 'sessionId manquant' });
    const session = memoryStore.sessions.get(sessionId);
    if (!session) return res.status(404).json({ error: 'Session introuvable' });
    const messages = memoryStore.messagesBySession.get(sessionId) || [];
    const conceptScores = memoryStore.conceptScoresBySession.get(sessionId) || [];
    return res.json({ session, messages, conceptScores });
  }

  const session = await db.prepare('SELECT * FROM sessions WHERE id = ?').get(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session introuvable' });

  const messages = await db.prepare('SELECT * FROM messages WHERE session_id = ? ORDER BY created_at ASC').all(req.params.id);
  const conceptScores = await db.prepare('SELECT * FROM concept_scores WHERE session_id = ?').all(req.params.id);
  res.json({ session, messages, conceptScores });
});

async function logActivity(userId: string, durationSeconds: number) {
  if (useMemoryStore()) return;
  const today = new Date().toISOString().slice(0, 10);
  const logId = randomUUID();
  
  // SQLite doesn't support ON DUPLICATE KEY UPDATE, so we check first
  const existing = await db.prepare(
    'SELECT id FROM activity_logs WHERE user_id = ? AND activity_date = ?'
  ).get(userId, today);
  
  if (existing) {
    // Update existing record
    await db.prepare(
      `UPDATE activity_logs 
       SET sessions_count = sessions_count + 1,
           total_duration_seconds = total_duration_seconds + ?
       WHERE user_id = ? AND activity_date = ?`
    ).run(durationSeconds, userId, today);
  } else {
    // Insert new record
    await db.prepare(
      `INSERT INTO activity_logs (id, user_id, activity_date, sessions_count, total_duration_seconds)
       VALUES (?, ?, ?, 1, ?)`
    ).run(logId, userId, today, durationSeconds);
  }
}

export default router;
