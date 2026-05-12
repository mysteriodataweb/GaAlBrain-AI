import { FINAL_EVALUATION_PROMPT, SOCRATIC_SYSTEM_PROMPT } from '../lib/prompts';
import { extractJsonObject } from './json.service';
import { callLLM, LLMMessage } from './llm.service';

export type QuestionType =
  | 'clarification'
  | 'justification'
  | 'application'
  | 'contre_exemple'
  | 'prerequis'
  | 'transfert';

export interface SocraticTurn {
  question: string;
  question_type: QuestionType;
  feedback_type: 'approfondir' | 'guider' | 'clarifier' | 'valider_partiel';
  concept_assessed: string;
  understanding_signal: 'solid' | 'partial' | 'gap' | 'unknown';
  score_delta: number;
  is_paste_suspected: boolean;
  escalate_difficulty: boolean;
  internal_note: string;
}

export interface FinalEvaluation {
  integrity_score: number;
  calibration_gap: number;
  calibration_label: string;
  solid_concepts: string[];
  partial_concepts: string[];
  gap_concepts: string[];
  strengths: string[];
  weaknesses: string[];
  recommendations: Array<{
    concept: string;
    why: string;
    prerequisite_missing?: string | null;
    resource_type: string;
    search_query: string;
  }>;
  metacognition_note: string;
  cognitive_profile: string;
  summary: string;
}

export async function generateSocraticQuestion(
  concept: string,
  messages: LLMMessage[],
  options: {
    confidence: number;
    round: number;
    inputType?: 'document' | 'generic' | 'code';
    documentContext?: string | null;
    previousSignals?: string[];
    isPasteDetected?: boolean;
  }
): Promise<SocraticTurn> {
  const systemPrompt = SOCRATIC_SYSTEM_PROMPT
    .replace('{{CONCEPT}}', concept)
    .replace('{{INPUT_TYPE}}', options.inputType || 'generic')
    .replace('{{DOCUMENT_CONTEXT}}', options.documentContext || 'Aucun document, sujet générique')
    .replace('{{CONFIDENCE}}', String(options.confidence))
    .replace('{{ROUND}}', String(options.round))
    .replace('{{PREVIOUS_SIGNALS}}', options.previousSignals?.join(', ') || 'Aucun')
    .replace('{{IS_PASTE_DETECTED}}', String(Boolean(options.isPasteDetected)));

  try {
    const raw = await callLLM(systemPrompt, messages, { maxTokens: 900, temperature: 0.65 });
    return normalizeSocraticTurn(extractJsonObject<SocraticTurn>(raw), concept);
  } catch (error) {
    const note = error instanceof Error ? error.message : 'Erreur inconnue';
    return buildLocalSocraticFallback(concept, options.confidence, options.round, note);
  }
}

export async function generateFinalEvaluation(
  concept: string,
  messages: LLMMessage[],
  confidence: number
): Promise<FinalEvaluation> {
  const conversation = messages.map((message) => `${message.role.toUpperCase()}: ${message.content}`).join('\n\n');
  const prompt = FINAL_EVALUATION_PROMPT
    .replace('{{CONCEPT}}', concept)
    .replace('{{CONFIDENCE}}', String(confidence))
    .replace('{{CONVERSATION}}', conversation);

  try {
    console.log('📊 generateFinalEvaluation starting - concept:', concept, 'confidence:', confidence);
    console.log('📊 Prompt length:', prompt.length, 'characters');
    console.log('📊 About to call LLM...');
    const raw = await callLLM(
      'Tu es GaAlBrain. Réponds uniquement en JSON strict valide, sans markdown.',
      [{ role: 'user', content: prompt }],
      { maxTokens: 1600, temperature: 0.3 }
    );
    console.log('📊 LLM response received, length:', raw.length);
    return normalizeFinalEvaluation(extractJsonObject<FinalEvaluation>(raw), confidence);
  } catch (error) {
    console.error('📊 generateFinalEvaluation error:', error instanceof Error ? error.message : String(error));
    console.error('📊 Using fallback evaluation');
    const estimatedScore = estimateLocalScore(messages, confidence);
    const delta = estimatedScore - confidence;
    return {
      integrity_score: estimatedScore,
      calibration_gap: delta,
      calibration_label: buildCalibrationLabel(delta),
      solid_concepts: estimatedScore >= 75 ? [concept] : [],
      partial_concepts: estimatedScore >= 45 && estimatedScore < 75 ? [concept] : [],
      gap_concepts: estimatedScore < 45 ? [concept] : [],
      strengths: ['Participation à la session'],
      weaknesses: ['Analyse IA indisponible: bilan généré en mode local'],
      recommendations: [
        {
          concept,
          why: 'Le bilan détaillé nécessite une réponse IA exploitable pour identifier précisément la lacune.',
          prerequisite_missing: null,
          resource_type: 'exercice',
          search_query: `${concept} exercices corrigés en français`
        }
      ],
      metacognition_note: 'Impossible à déterminer précisément en mode local.',
      cognitive_profile: estimatedScore >= 75 ? 'avancé' : estimatedScore >= 45 ? 'intermédiaire' : 'débutant',
      summary: 'La session a été terminée. Le bilan local reste approximatif tant que l’analyse IA n’est pas disponible.'
    };
  }
}

function normalizeSocraticTurn(turn: Partial<SocraticTurn>, fallbackConcept: string): SocraticTurn {
  const signal = normalizeSignal(turn.understanding_signal);
  return {
    question: turn.question || `Peux-tu préciser ton raisonnement sur ${fallbackConcept} avec un exemple concret ?`,
    question_type: normalizeQuestionType(turn.question_type, signal),
    feedback_type: turn.feedback_type || feedbackFromSignal(signal),
    concept_assessed: turn.concept_assessed || fallbackConcept,
    understanding_signal: signal,
    score_delta: Math.max(-15, Math.min(15, Number(turn.score_delta) || 0)),
    is_paste_suspected: Boolean(turn.is_paste_suspected),
    escalate_difficulty: Boolean(turn.escalate_difficulty),
    internal_note: turn.internal_note || ''
  };
}

function normalizeFinalEvaluation(evaluation: Partial<FinalEvaluation>, confidence: number): FinalEvaluation {
  const score = Math.max(0, Math.min(100, Number(evaluation.integrity_score) || 0));
  const delta = Number.isFinite(evaluation.calibration_gap) ? Number(evaluation.calibration_gap) : score - confidence;

  return {
    integrity_score: score,
    calibration_gap: delta,
    calibration_label: evaluation.calibration_label || buildCalibrationLabel(delta),
    solid_concepts: evaluation.solid_concepts || [],
    partial_concepts: evaluation.partial_concepts || [],
    gap_concepts: evaluation.gap_concepts || [],
    strengths: evaluation.strengths || [],
    weaknesses: evaluation.weaknesses || [],
    recommendations: evaluation.recommendations || [],
    metacognition_note: evaluation.metacognition_note || '',
    cognitive_profile: evaluation.cognitive_profile || 'intermédiaire',
    summary: evaluation.summary || ''
  };
}

function buildLocalSocraticFallback(
  concept: string,
  confidence: number,
  round: number,
  note: string
): SocraticTurn {
  const highConfidence = confidence >= 67;
  const question = highConfidence
    ? `Dans quel cas limite ton explication de ${concept} cesserait-elle d'être valable ?`
    : round <= 1
      ? `Comment définirais-tu ${concept} avec tes propres mots, sans reprendre une définition apprise ?`
      : `Peux-tu donner un exemple concret qui montre comment tu raisonnes sur ${concept} ?`;

  return {
    question,
    question_type: highConfidence ? 'contre_exemple' : 'clarification',
    feedback_type: 'clarifier',
    concept_assessed: concept,
    understanding_signal: 'unknown',
    score_delta: 0,
    is_paste_suspected: false,
    escalate_difficulty: false,
    internal_note: `Fallback local: ${note}`
  };
}

function normalizeSignal(value: unknown): SocraticTurn['understanding_signal'] {
  return value === 'solid' || value === 'partial' || value === 'gap' || value === 'unknown' ? value : 'unknown';
}

function normalizeQuestionType(value: unknown, signal: SocraticTurn['understanding_signal']): QuestionType {
  const allowed: QuestionType[] = ['clarification', 'justification', 'application', 'contre_exemple', 'prerequis', 'transfert'];
  if (allowed.includes(value as QuestionType)) return value as QuestionType;
  if (signal === 'solid') return 'contre_exemple';
  if (signal === 'gap') return 'application';
  if (signal === 'partial') return 'justification';
  return 'clarification';
}

function feedbackFromSignal(signal: SocraticTurn['understanding_signal']): SocraticTurn['feedback_type'] {
  if (signal === 'solid') return 'approfondir';
  if (signal === 'gap') return 'guider';
  if (signal === 'partial') return 'valider_partiel';
  return 'clarifier';
}

function buildCalibrationLabel(delta: number) {
  if (delta < -20) return 'Très surestimé';
  if (delta < -8) return 'Légèrement surestimé';
  if (delta > 8) return 'Sous-estimé';
  return 'Bien calibré';
}

function estimateLocalScore(messages: LLMMessage[], confidence: number) {
  const userMessages = messages.filter((message) => message.role === 'user');
  const avgLength = userMessages.length
    ? userMessages.reduce((sum, message) => sum + message.content.length, 0) / userMessages.length
    : 0;
  const signal = Math.min(30, Math.round(avgLength / 12));
  return Math.max(20, Math.min(85, Math.round(confidence * 0.5 + signal + 20)));
}
