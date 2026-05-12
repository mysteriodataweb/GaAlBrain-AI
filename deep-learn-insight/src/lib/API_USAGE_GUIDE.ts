/**
 * GUIDE D'UTILISATION - Services API & Hooks
 * 
 * Ce fichier montre comment utiliser les services API et hooks personnalisés
 * pour communiquer avec le backend dans vos composants React.
 */

// ===== EXEMPLE 1 : AUTHENTIFICATION =====
import { useLogin, useRegister } from '@/hooks/useApi';

export function LoginExample() {
  const loginMutation = useLogin();

  const handleLogin = async (email: string, password: string) => {
    try {
      const response = await loginMutation.mutateAsync({ email, password });
      const { token, user } = response.data;

      // Sauvegarder le token et l'utilisateur
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));

      console.log('Utilisateur connecté:', user);
      // Rediriger vers le dashboard
    } catch (error) {
      console.error('Erreur de connexion:', error);
    }
  };

  return (
    <button
      onClick={() => handleLogin('user@example.com', 'password123')}
      disabled={loginMutation.isPending}
    >
      {loginMutation.isPending ? 'Connexion...' : 'Se connecter'}
    </button>
  );
}

// ===== EXEMPLE 2 : CRÉER UNE SESSION =====
import { useCreateSession, useSendMessage, useCurrentUser } from '@/hooks/useApi';

export function SessionExample() {
  const { data: userResponse } = useCurrentUser();
  const createSessionMutation = useCreateSession();
  const sendMessageMutation = useSendMessage();

  const startSession = async () => {
    try {
      const response = await createSessionMutation.mutateAsync({
        userId: userResponse?.data.user.id,
        concept: 'JavaScript Promises',
        inputType: 'generic',
        confidence: 65,
      });

      console.log('Session créée:', response.data.sessionId);
      console.log('Première question:', response.data.firstQuestion);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const sendResponse = async (sessionId: string, userAnswer: string) => {
    try {
      const response = await sendMessageMutation.mutateAsync({
        sessionId,
        data: {
          content: userAnswer,
          confidenceBet: 70,
        },
      });

      console.log('Réponse reçue:', response.data.question);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  return (
    <div>
      <button onClick={startSession} disabled={createSessionMutation.isPending}>
        Démarrer une évaluation
      </button>
    </div>
  );
}

// ===== EXEMPLE 3 : CRÉER UNE SESSION AVEC FICHIER =====
import { useCreateSessionWithFile } from '@/hooks/useApi';

export function SessionWithFileExample() {
  const createSessionMutation = useCreateSessionWithFile();

  const handleFileUpload = async (file: File) => {
    try {
      const response = await createSessionMutation.mutateAsync({
        concept: 'Python Data Analysis',
        inputType: 'document',
        file,
        confidence: 50,
      });

      console.log('Session créée avec fichier:', response.data);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  return (
    <input
      type="file"
      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
    />
  );
}

// ===== EXEMPLE 4 : RAPPORTS TEACHER =====
import { useTeacherReport } from '@/hooks/useApi';

export function TeacherReportExample({ teacherId }: { teacherId: string }) {
  const { data: reportResponse, isLoading } = useTeacherReport(teacherId);

  if (isLoading) return <div>Chargement du rapport...</div>;

  const report = reportResponse?.data;

  return (
    <div>
      {report?.classes.map((classReport) => (
        <div key={classReport.class.id}>
          <h3>{classReport.class.name}</h3>
          <p>Score moyen: {classReport.classAverageScore}%</p>
          <p>Nombre d'élèves: {classReport.studentCount}</p>
          {classReport.commonBlockingConcepts.map((concept) => (
            <div key={concept.concept}>
              {concept.concept} - {concept.affectedStudents} élèves affectés
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ===== EXEMPLE 5 : RAPPORTS STUDENT =====
import { useStudentReport } from '@/hooks/useApi';

export function StudentReportExample({ studentId }: { studentId: string }) {
  const { data: reportResponse, isLoading } = useStudentReport(studentId);

  if (isLoading) return <div>Chargement du rapport...</div>;

  const report = reportResponse?.data;

  return (
    <div>
      <h3>Progression</h3>
      {report?.progressCurve.map((point) => (
        <div key={point.date}>
          {point.concept}: {point.score}% le {point.date}
        </div>
      ))}

      <h3>Concepts maîtrisés</h3>
      {report?.conceptMap.map((concept) => (
        <div key={concept.concept_name}>
          {concept.concept_name}: {concept.avg_score.toFixed(1)}% (x{concept.times_evaluated})
        </div>
      ))}

      <h3>Activité</h3>
      {report?.activity.map((log) => (
        <div key={log.activity_date}>
          {log.activity_date}: {log.sessions_count} sessions ({log.total_duration_seconds}s)
        </div>
      ))}
    </div>
  );
}

// ===== UTILISATION DIRECTE DES SERVICES (Alternative sans hooks) =====
import userService from '@/lib/services/userService';
import sessionService from '@/lib/services/sessionService';

export async function directServiceExample() {
  // Authentification
  const authResponse = await userService.login({
    email: 'user@example.com',
    password: 'password123',
  });

  const token = authResponse.data.token;
  localStorage.setItem('authToken', token);

  // Créer une session
  const sessionResponse = await sessionService.createSession({
    concept: 'React Hooks',
    inputType: 'generic',
    confidence: 60,
  });

  console.log('Session créée:', sessionResponse.data);

  // Envoyer un message
  const messageResponse = await sessionService.sendMessage(
    sessionResponse.data.sessionId,
    {
      content: 'Un Hook est une fonction spéciale...',
      confidenceBet: 75,
    }
  );

  console.log('Message reçu:', messageResponse.data);
}

export default {
  LoginExample,
  SessionExample,
  SessionWithFileExample,
  TeacherReportExample,
  StudentReportExample,
  directServiceExample,
};
