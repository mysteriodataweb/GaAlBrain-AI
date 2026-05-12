════════════════════════════════════════════════════════════════
PROMPT BACKEND — GaAlBrain IA (MVP)
MODÈLES GRATUITS — GROQ API (primary) + GEMINI FLASH (fallback)
════════════════════════════════════════════════════════════════

Construis le backend complet de GaAlBrain IA — un système d'évaluation
cognitive basé sur l'IA socratique. Le backend doit être entièrement
fonctionnel pour un MVP avec des modèles LLM GRATUITS.

════════════════════════════════════════════
STACK TECHNIQUE — MVP GRATUIT
════════════════════════════════════════════

- Runtime : Node.js 18+
- Framework : Express.js
- Language : TypeScript
- LLM PRIMARY : Groq API (GRATUIT) — modèle : llama-3.1-70b-versatile
- LLM FALLBACK : Google Gemini 1.5 Flash (GRATUIT)
- Base de données : SQLite (via better-sqlite3) — zéro infrastructure
- Upload fichiers : Multer
- Parsing PDF : pdf-parse
- Parsing DOCX : mammoth
- Analyse code GitHub : Axios (appel API GitHub public)
- Extraction ZIP : adm-zip
- Variables d'env : dotenv
- Validation : zod
- CORS : cors

PACKAGES À INSTALLER :
npm install express groq-sdk @google/generative-ai better-sqlite3
multer pdf-parse mammoth adm-zip axios dotenv zod cors typescript
ts-node @types/express @types/node @types/multer @types/better-sqlite3

POURQUOI GROQ EST GRATUIT ET BON POUR LE MVP :

- 14 400 requêtes/jour gratuites
- 30 requêtes/minute gratuites
- llama-3.1-70b-versatile : excellent pour le raisonnement socratique
- Inférence ultra-rapide (< 1 seconde)
- Aucune carte bancaire requise : https://console.groq.com

POURQUOI GEMINI FLASH EN FALLBACK :

- 15 RPM gratuits, 1 million tokens/jour gratuits
- Très bon pour analyser de longs documents (contexte 1M tokens)
- Aucune carte requise : https://aistudio.google.com/app/apikey

════════════════════════════════════════════
STRUCTURE DES FICHIERS
════════════════════════════════════════════

/src
/server.ts ← Entry point Express
/db
/database.ts ← Init SQLite + création des tables
/schema.sql ← Schéma complet
/routes
/session.routes.ts ← Routes évaluation (le coeur)
/upload.routes.ts ← Upload PDF, DOCX, ZIP, GitHub
/user.routes.ts ← Gestion utilisateurs
/report.routes.ts ← Rapports prof
/services
/llm.service.ts ← Wrapper Groq + fallback Gemini
/socratic.service.ts ← Moteur socratique (prompts)
/rag.service.ts ← RAG simplifié sur document uploadé
/code.service.ts ← Analyse code ZIP / GitHub
/scoring.service.ts ← Calcul scores + knowledge map
/recommendation.service.ts ← Recommandations par concept
/middleware
/upload.middleware.ts ← Config Multer
/auth.middleware.ts ← JWT simple
/types
/index.ts ← Types TypeScript
/uploads ← Fichiers uploadés (gitignore)
/.env
/tsconfig.json

════════════════════════════════════════════
FICHIER .env
════════════════════════════════════════════

GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxx # Gratuit sur console.groq.com
GEMINI_API_KEY=AIzaxxxxxxxxxxxxxxxx # Gratuit sur aistudio.google.com
JWT_SECRET=gaalbrainmvpsecret2024
PORT=3001
NODE_ENV=development
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=10

════════════════════════════════════════════
BASE DE DONNÉES — SQLITE (schema.sql)
════════════════════════════════════════════

Crée le fichier src/db/schema.sql avec ce schéma exact :

-- USERS (étudiants + profs)
CREATE TABLE IF NOT EXISTS users (
id TEXT PRIMARY KEY,
name TEXT NOT NULL,
email TEXT UNIQUE NOT NULL,
role TEXT NOT NULL CHECK(role IN ('student', 'teacher', 'professional')),
password_hash TEXT NOT NULL,
created_at TEXT DEFAULT (datetime('now'))
);

-- SESSIONS D'ÉVALUATION
CREATE TABLE IF NOT EXISTS sessions (
id TEXT PRIMARY KEY,
user_id TEXT NOT NULL REFERENCES users(id),
concept TEXT NOT NULL,
input_type TEXT NOT NULL CHECK(input_type IN ('document', 'generic', 'code')),
file_path TEXT,
github_url TEXT,
confidence_declared INTEGER NOT NULL DEFAULT 50,
status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'completed', 'abandoned')),
integrity_score REAL DEFAULT 0,
created_at TEXT DEFAULT (datetime('now')),
completed_at TEXT
);

-- MESSAGES D'UNE SESSION
CREATE TABLE IF NOT EXISTS messages (
id TEXT PRIMARY KEY,
session_id TEXT NOT NULL REFERENCES sessions(id),
role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
content TEXT NOT NULL,
confidence_bet INTEGER,
is_paste_detected INTEGER DEFAULT 0,
created_at TEXT DEFAULT (datetime('now'))
);

-- SCORES PAR CONCEPT (knowledge map)
CREATE TABLE IF NOT EXISTS concept_scores (
id TEXT PRIMARY KEY,
session_id TEXT NOT NULL REFERENCES sessions(id),
user_id TEXT NOT NULL REFERENCES users(id),
concept_name TEXT NOT NULL,
score REAL NOT NULL CHECK(score BETWEEN 0 AND 100),
status TEXT NOT NULL CHECK(status IN ('solid', 'partial', 'gap', 'unknown')),
evaluated_at TEXT DEFAULT (datetime('now'))
);

-- ÉVALUATIONS COMPLÈTES (résultat final d'une session)
CREATE TABLE IF NOT EXISTS evaluations (
id TEXT PRIMARY KEY,
session_id TEXT NOT NULL REFERENCES sessions(id),
user_id TEXT NOT NULL REFERENCES users(id),
concept TEXT NOT NULL,
integrity_score REAL NOT NULL,
confidence_declared INTEGER NOT NULL,
calibration_gap REAL NOT NULL,
solid_concepts TEXT NOT NULL DEFAULT '[]',
partial_concepts TEXT NOT NULL DEFAULT '[]',
gap_concepts TEXT NOT NULL DEFAULT '[]',
recommendations TEXT NOT NULL DEFAULT '[]',
duration_seconds INTEGER,
rounds_count INTEGER DEFAULT 0,
created_at TEXT DEFAULT (datetime('now'))
);

-- ACTIVITÉ (pour la heatmap style GitHub)
CREATE TABLE IF NOT EXISTS activity_logs (
id TEXT PRIMARY KEY,
user_id TEXT NOT NULL REFERENCES users(id),
activity_date TEXT NOT NULL,
sessions_count INTEGER DEFAULT 0,
total_duration_seconds INTEGER DEFAULT 0
);

-- CLASSES (lien prof → étudiants)
CREATE TABLE IF NOT EXISTS classes (
id TEXT PRIMARY KEY,
teacher_id TEXT NOT NULL REFERENCES users(id),
name TEXT NOT NULL,
created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS class_members (
class_id TEXT REFERENCES classes(id),
student_id TEXT REFERENCES users(id),
joined_at TEXT DEFAULT (datetime('now')),
PRIMARY KEY (class_id, student_id)
);

-- INDEX POUR LES PERFORMANCES
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);
CREATE INDEX IF NOT EXISTS idx_concept_scores_user ON concept_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_user ON evaluations(user_id);

════════════════════════════════════════════
SERVICE LLM — src/services/llm.service.ts
════════════════════════════════════════════

import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface LLMMessage {
role: 'user' | 'assistant';
content: string;
}

export async function callLLM(
systemPrompt: string,
messages: LLMMessage[],
options: {
maxTokens?: number;
temperature?: number;
forceGemini?: boolean;
} = {}
): Promise<string> {
const { maxTokens = 800, temperature = 0.7, forceGemini = false } = options;

// Utiliser Gemini pour les longs documents (RAG), Groq pour le socratique
if (forceGemini) {
return callGemini(systemPrompt, messages, maxTokens);
}

try {
return await callGroq(systemPrompt, messages, maxTokens, temperature);
} catch (error: any) {
// Si Groq rate limit ou erreur → fallback Gemini
console.warn('Groq failed, falling back to Gemini:', error.message);
return callGemini(systemPrompt, messages, maxTokens);
}
}

async function callGroq(
systemPrompt: string,
messages: LLMMessage[],
maxTokens: number,
temperature: number
): Promise<string> {
const response = await groq.chat.completions.create({
model: 'llama-3.1-70b-versatile', // GRATUIT
max_tokens: maxTokens,
temperature,
messages: [
{ role: 'system', content: systemPrompt },
...messages.map(m => ({ role: m.role, content: m.content }))
]
});
return response.choices[0]?.message?.content || '';
}

async function callGemini(
systemPrompt: string,
messages: LLMMessage[],
maxTokens: number
): Promise<string> {
const model = gemini.getGenerativeModel({
model: 'gemini-1.5-flash', // GRATUIT
systemInstruction: systemPrompt
});

// Convertir les messages au format Gemini
const history = messages.slice(0, -1).map(m => ({
role: m.role === 'assistant' ? 'model' : 'user',
parts: [{ text: m.content }]
}));

const lastMessage = messages[messages.length - 1];
const chat = model.startChat({ history });
const result = await chat.sendMessage(lastMessage.content);
return result.response.text();
}

════════════════════════════════════════════
SERVICE SOCRATIQUE — src/services/socratic.service.ts
════════════════════════════════════════════

C'est le cœur de GaAlBrain IA. Implémente ce service exactement :

import { callLLM, LLMMessage } from './llm.service';

// PROMPT SYSTÈME PRINCIPAL — LE PLUS IMPORTANT
// L'IA ne donne JAMAIS les réponses. Elle questionne seulement.
const SOCRATIC_SYSTEM_PROMPT = `
Tu es GaAlBrain, un évaluateur cognitif socratique expert.

TON RÔLE FONDAMENTAL :

- Tu évalues la COMPRÉHENSION RÉELLE de l'apprenant, jamais tu ne lui donnes les réponses
- Tu poses des questions ciblées pour révéler ce qu'il comprend vraiment
- Tu détectes les compréhensions superficielles (récitation) vs profondes (raisonnement)
- Tu adaptes la difficulté selon les réponses reçues

RÈGLES ABSOLUES :

1. NE JAMAIS donner la réponse correcte directement
2. NE JAMAIS valider une réponse incomplète comme correcte
3. TOUJOURS poser UNE seule question de suivi par réponse
4. Si la réponse est correcte → approfondir avec un cas limite
5. Si la réponse est incorrecte → guider vers la découverte sans corriger
6. Si la réponse est vague → demander de préciser avec un exemple concret

TYPES DE QUESTIONS QUE TU POSES :

- Clarification : "Peux-tu expliquer ce que tu veux dire par...?"
- Application : "Que se passerait-il si...?"
- Contre-exemple : "Comment expliques-tu que...?"
- Prérequis : "Pour que cela soit vrai, il faut que... — est-ce toujours le cas?"
- Transfert : "Comment ce principe s'applique-t-il dans le contexte de...?"

ÉVALUATION EN CONTINU :
Après chaque réponse de l'apprenant, tu dois évaluer internement (non visible) :

- Solidité du raisonnement (0-100)
- Concept maîtrisé ou lacune détectée
- Profondeur de compréhension

FORMAT DE RÉPONSE (JSON strict, toujours) :
{
"question": "Ta question socratique ici",
"feedback_type": "approfondir | guider | clarifier | valider_partiel",
"concept_assessed": "nom du concept évalué dans cette échange",
"understanding_signal": "solid | partial | gap | unknown",
"score_delta": number entre -10 et +15,
"is_paste_suspected": boolean,
"internal_note": "observation interne sur la compréhension (non affichée)"
}

CONTEXTE DU CONCEPT : {{CONCEPT}}
CONTEXTE DU DOCUMENT (si uploadé) : {{DOCUMENT_CONTEXT}}
CONFIANCE DÉCLARÉE PAR L'APPRENANT : {{CONFIDENCE}}%
ROUND ACTUEL : {{ROUND}}
`;

// PROMPT POUR L'ÉVALUATION FINALE
const FINAL_EVALUATION_PROMPT = `
Tu es GaAlBrain. Une session d'évaluation vient de se terminer.
Analyse l'intégralité de la conversation et génère un bilan cognitif précis.

Conversation complète : {{CONVERSATION}}
Concept évalué : {{CONCEPT}}
Confiance déclarée initialement : {{CONFIDENCE}}%

Génère un JSON avec cette structure exacte :
{
"integrity_score": number (0-100),
"calibration_gap": number (différence entre confiance déclarée et score réel),
"solid_concepts": ["concept1", "concept2"],
"partial_concepts": ["concept3"],
"gap_concepts": ["concept4", "concept5"],
"strengths": ["point fort 1", "point fort 2"],
"weaknesses": ["lacune 1", "lacune 2"],
"recommendations": [
{
"concept": "nom du concept lacunaire",
"why": "pourquoi c'est une lacune",
"resource_type": "article | vidéo | exercice | cours",
"search_query": "requête de recherche suggérée pour trouver la ressource"
}
],
"cognitive_profile": "débutant | intermédiaire | avancé | expert",
"summary": "Résumé en 2 phrases de la session"
}
`;

export interface SocraticTurn {
question: string;
feedback_type: string;
concept_assessed: string;
understanding_signal: 'solid' | 'partial' | 'gap' | 'unknown';
score_delta: number;
is_paste_suspected: boolean;
internal_note: string;
}

export async function generateSocraticQuestion(
concept: string,
messages: LLMMessage[],
options: {
confidence: number;
round: number;
documentContext?: string;
}
): Promise<SocraticTurn> {
const systemPrompt = SOCRATIC_SYSTEM_PROMPT
.replace('{{CONCEPT}}', concept)
.replace('{{DOCUMENT_CONTEXT}}', options.documentContext || 'Aucun document — sujet générique')
.replace('{{CONFIDENCE}}', options.confidence.toString())
.replace('{{ROUND}}', options.round.toString());

const raw = await callLLM(systemPrompt, messages, {
maxTokens: 600,
temperature: 0.6
});

const jsonMatch = raw.match(/\{[\s\S]\*\}/);
if (!jsonMatch) {
return {
question: "Peux-tu reformuler ce concept dans tes propres mots ?",
feedback_type: "clarifier",
concept_assessed: concept,
understanding_signal: "unknown",
score_delta: 0,
is_paste_suspected: false,
internal_note: "Parse error"
};
}
return JSON.parse(jsonMatch[0]) as SocraticTurn;
}

export async function generateFinalEvaluation(
concept: string,
messages: LLMMessage[],
confidence: number
) {
const conversation = messages
.map(m => `${m.role.toUpperCase()}: ${m.content}`)
.join('\n\n');

const prompt = FINAL_EVALUATION_PROMPT
.replace('{{CONVERSATION}}', conversation)
.replace('{{CONCEPT}}', concept)
.replace('{{CONFIDENCE}}', confidence.toString());

const raw = await callLLM('Tu es un évaluateur expert. Réponds uniquement en JSON.',
[{ role: 'user', content: prompt }],
{ maxTokens: 1200, temperature: 0.3 }
);

const jsonMatch = raw.match(/\{[\s\S]\*\}/);
if (!jsonMatch) throw new Error('Evaluation parse error');
return JSON.parse(jsonMatch[0]);
}

════════════════════════════════════════════
SERVICE RAG — src/services/rag.service.ts
════════════════════════════════════════════

RAG simplifié pour MVP (pas de vector DB — chunking simple + Gemini contexte long)

import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import fs from 'fs';
import { callLLM } from './llm.service';

// Extrait le texte brut selon le type de fichier
export async function extractTextFromFile(
filePath: string,
mimeType: string
): Promise<string> {
if (mimeType === 'application/pdf') {
const buffer = fs.readFileSync(filePath);
const data = await pdfParse(buffer);
return data.text.slice(0, 15000); // Limite MVP
}

if (mimeType.includes('wordprocessingml') || filePath.endsWith('.docx')) {
const result = await mammoth.extractRawText({ path: filePath });
return result.value.slice(0, 15000);
}

if (mimeType === 'text/plain') {
return fs.readFileSync(filePath, 'utf-8').slice(0, 15000);
}

throw new Error('Format non supporté. Acceptés : PDF, DOCX, TXT');
}

// Génère un résumé des concepts clés du document pour alimenter le socratique
export async function extractConceptsFromDocument(
documentText: string,
userConcept: string
): Promise<{ context: string; key_concepts: string[] }> {
const prompt = `
Voici un document pédagogique. L'étudiant veut être évalué sur : "${userConcept}"

DOCUMENT :
${documentText}

Génère un JSON avec :
{
"context": "Résumé des points clés du document en 300 mots max, focalisé sur le concept demandé",
"key_concepts": ["concept1", "concept2", "concept3", "concept4", "concept5"]
}

Réponds UNIQUEMENT en JSON.`;

const raw = await callLLM(
'Tu es un expert en extraction de connaissances pédagogiques.',
[{ role: 'user', content: prompt }],
{ maxTokens: 600, temperature: 0.2, forceGemini: true }
);

const jsonMatch = raw.match(/\{[\s\S]\*\}/);
if (!jsonMatch) return { context: documentText.slice(0, 500), key_concepts: [userConcept] };
return JSON.parse(jsonMatch[0]);
}

════════════════════════════════════════════
SERVICE CODE — src/services/code.service.ts
════════════════════════════════════════════

import AdmZip from 'adm-zip';
import axios from 'axios';
import { callLLM } from './llm.service';

// Extrait le code d'un ZIP
export function extractCodeFromZip(zipPath: string): string {
const zip = new AdmZip(zipPath);
const entries = zip.getEntries();
const codeExtensions = ['.js', '.ts', '.py', '.java', '.c', '.cpp', '.cs', '.go', '.rs'];

let codeContent = '';
let fileCount = 0;

for (const entry of entries) {
if (fileCount >= 10) break; // Limite MVP
const ext = '.' + entry.entryName.split('.').pop();
if (codeExtensions.includes(ext) && !entry.isDirectory) {
const content = entry.getData().toString('utf-8').slice(0, 2000);
codeContent += `\n\n// === FICHIER: ${entry.entryName} ===\n${content}`;
fileCount++;
}
}

return codeContent.slice(0, 12000);
}

// Récupère le code depuis GitHub (repos publics uniquement)
export async function fetchCodeFromGithub(githubUrl: string): Promise<string> {
// Transformer l'URL en appel API GitHub
// Ex: https://github.com/user/repo → https://api.github.com/repos/user/repo/contents
const match = githubUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
if (!match) throw new Error('URL GitHub invalide');

const [, owner, repo] = match;
const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents`;

const { data: files } = await axios.get(apiUrl, {
headers: { Accept: 'application/vnd.github.v3+json' }
});

const codeExtensions = ['.js', '.ts', '.py', '.java', '.c', '.cpp'];
let codeContent = '';
let fetched = 0;

for (const file of files) {
if (fetched >= 5) break;
const ext = '.' + file.name.split('.').pop();
if (codeExtensions.includes(ext) && file.download_url) {
const { data: content } = await axios.get(file.download_url);
codeContent += `\n\n// === ${file.name} ===\n${content.toString().slice(0, 2000)}`;
fetched++;
}
}

return codeContent;
}

// Analyse le code et génère un contexte pour l'évaluation socratique
export async function analyzeCodeForEvaluation(codeContent: string): Promise<{
context: string;
key_concepts: string[];
detected_patterns: string[];
}> {
const prompt = `
Analyse ce code et prépare une évaluation cognitive pour l'auteur.
L'objectif est de savoir s'il comprend vraiment ce qu'il a écrit.

CODE :
${codeContent}

Génère un JSON avec :
{
"context": "Description technique du code en 200 mots : ce qu'il fait, comment, les choix techniques",
"key_concepts": ["concept algorithmique 1", "concept 2", "concept 3"],
"detected_patterns": ["pattern ou choix de design à questionner 1", "pattern 2"],
"potential_weaknesses": ["point qui trahit souvent une incompréhension 1", "point 2"]
}

Réponds UNIQUEMENT en JSON.`;

const raw = await callLLM(
'Tu es un expert en revue de code et en évaluation pédagogique.',
[{ role: 'user', content: prompt }],
{ maxTokens: 600, temperature: 0.2 }
);

const jsonMatch = raw.match(/\{[\s\S]\*\}/);
if (!jsonMatch) return { context: 'Code soumis', key_concepts: [], detected_patterns: [] };
return JSON.parse(jsonMatch[0]);
}

════════════════════════════════════════════
ROUTES — src/routes/session.routes.ts
════════════════════════════════════════════

import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../db/database';
import { generateSocraticQuestion, generateFinalEvaluation } from '../services/socratic.service';
import { extractTextFromFile, extractConceptsFromDocument } from '../services/rag.service';
import { extractCodeFromZip, fetchCodeFromGithub, analyzeCodeForEvaluation } from '../services/code.service';

const router = Router();

// POST /api/sessions — Créer une nouvelle session
router.post('/', async (req: Request, res: Response) => {
try {
const { userId, concept, inputType, confidence, githubUrl } = req.body;
const file = req.file;

    const sessionId = uuid();
    let documentContext = '';
    let filePath = '';

    // Traitement selon le type d'input
    if (inputType === 'document' && file) {
      filePath = file.path;
      const text = await extractTextFromFile(file.path, file.mimetype);
      const extracted = await extractConceptsFromDocument(text, concept);
      documentContext = extracted.context;
    }

    if (inputType === 'code') {
      if (githubUrl) {
        const code = await fetchCodeFromGithub(githubUrl);
        const analysis = await analyzeCodeForEvaluation(code);
        documentContext = analysis.context;
      } else if (file) {
        filePath = file.path;
        const code = extractCodeFromZip(file.path);
        const analysis = await analyzeCodeForEvaluation(code);
        documentContext = analysis.context;
      }
    }

    // Insérer la session en base
    db.prepare(`
      INSERT INTO sessions (id, user_id, concept, input_type, file_path, github_url, confidence_declared)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(sessionId, userId, concept, inputType, filePath, githubUrl || null, confidence);

    // Générer la première question socratique
    const firstQuestion = await generateSocraticQuestion(
      concept,
      [{
        role: 'user',
        content: `Je veux être évalué sur : ${concept}. Ma confiance initiale : ${confidence}%`
      }],
      { confidence, round: 1, documentContext }
    );

    // Sauvegarder le premier message assistant
    db.prepare(`
      INSERT INTO messages (id, session_id, role, content)
      VALUES (?, ?, 'assistant', ?)
    `).run(uuid(), sessionId, firstQuestion.question);

    res.json({
      sessionId,
      firstQuestion: firstQuestion.question,
      documentContext: documentContext ? 'Document analysé avec succès' : null
    });

} catch (error: any) {
res.status(500).json({ error: error.message });
}
});

// POST /api/sessions/:id/message — Envoyer un message dans une session
router.post('/:id/message', async (req: Request, res: Response) => {
try {
const { id: sessionId } = req.params;
const { content, confidenceBet, isPasteSuspected } = req.body;

    // Récupérer la session
    const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId) as any;
    if (!session) return res.status(404).json({ error: 'Session introuvable' });

    // Récupérer l'historique des messages
    const dbMessages = db.prepare(
      'SELECT role, content FROM messages WHERE session_id = ? ORDER BY created_at ASC'
    ).all(sessionId) as any[];

    // Sauvegarder le message utilisateur
    const userMsgId = uuid();
    db.prepare(`
      INSERT INTO messages (id, session_id, role, content, confidence_bet, is_paste_detected)
      VALUES (?, ?, 'user', ?, ?, ?)
    `).run(userMsgId, sessionId, content, confidenceBet || null, isPasteSuspected ? 1 : 0);

    // Compter le round actuel
    const roundCount = Math.ceil(dbMessages.length / 2) + 1;

    // Générer la réponse socratique
    const messages = [
      ...dbMessages.map((m: any) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user' as const, content }
    ];

    const response = await generateSocraticQuestion(
      session.concept,
      messages,
      {
        confidence: session.confidence_declared,
        round: roundCount,
        documentContext: session.file_path ? 'Document disponible' : undefined
      }
    );

    // Sauvegarder le message IA
    db.prepare(`
      INSERT INTO messages (id, session_id, role, content)
      VALUES (?, ?, 'assistant', ?)
    `).run(uuid(), sessionId, response.question);

    // Mettre à jour le score d'intégrité
    const currentSession = db.prepare('SELECT integrity_score FROM sessions WHERE id = ?').get(sessionId) as any;
    const newScore = Math.min(100, Math.max(0, (currentSession.integrity_score || 50) + response.score_delta));
    db.prepare('UPDATE sessions SET integrity_score = ? WHERE id = ?').run(newScore, sessionId);

    // Sauvegarder le score du concept évalué
    db.prepare(`
      INSERT INTO concept_scores (id, session_id, user_id, concept_name, score, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(uuid(), sessionId, session.user_id, response.concept_assessed,
       Math.max(0, 50 + response.score_delta * 3),
       response.understanding_signal);

    res.json({
      question: response.question,
      feedback_type: response.feedback_type,
      understanding_signal: response.understanding_signal,
      integrity_score: newScore,
      is_paste_suspected: response.is_paste_suspected,
      round: roundCount
    });

} catch (error: any) {
res.status(500).json({ error: error.message });
}
});

// POST /api/sessions/:id/complete — Terminer une session et générer le bilan
router.post('/:id/complete', async (req: Request, res: Response) => {
try {
const { id: sessionId } = req.params;

    const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId) as any;
    if (!session) return res.status(404).json({ error: 'Session introuvable' });

    const dbMessages = db.prepare(
      'SELECT role, content FROM messages WHERE session_id = ? ORDER BY created_at ASC'
    ).all(sessionId) as any[];

    const messages = dbMessages.map((m: any) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    }));

    // Générer l'évaluation finale
    const evaluation = await generateFinalEvaluation(
      session.concept,
      messages,
      session.confidence_declared
    );

    // Sauvegarder l'évaluation
    const evalId = uuid();
    db.prepare(`
      INSERT INTO evaluations (
        id, session_id, user_id, concept, integrity_score, confidence_declared,
        calibration_gap, solid_concepts, partial_concepts, gap_concepts,
        recommendations, rounds_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      evalId, sessionId, session.user_id, session.concept,
      evaluation.integrity_score, session.confidence_declared,
      evaluation.calibration_gap,
      JSON.stringify(evaluation.solid_concepts),
      JSON.stringify(evaluation.partial_concepts),
      JSON.stringify(evaluation.gap_concepts),
      JSON.stringify(evaluation.recommendations),
      Math.ceil(dbMessages.length / 2)
    );

    // Clôturer la session
    db.prepare(`
      UPDATE sessions SET status = 'completed', completed_at = datetime('now'),
      integrity_score = ? WHERE id = ?
    `).run(evaluation.integrity_score, sessionId);

    // Logger l'activité (heatmap)
    const today = new Date().toISOString().split('T')[0];
    const existing = db.prepare(
      'SELECT id FROM activity_logs WHERE user_id = ? AND activity_date = ?'
    ).get(session.user_id, today);

    if (existing) {
      db.prepare(
        'UPDATE activity_logs SET sessions_count = sessions_count + 1 WHERE user_id = ? AND activity_date = ?'
      ).run(session.user_id, today);
    } else {
      db.prepare(
        'INSERT INTO activity_logs (id, user_id, activity_date, sessions_count) VALUES (?, ?, ?, 1)'
      ).run(uuid(), session.user_id, today);
    }

    res.json({ evaluationId: evalId, ...evaluation });

} catch (error: any) {
res.status(500).json({ error: error.message });
}
});

// GET /api/sessions/:id — Détails d'une session
router.get('/:id', (req: Request, res: Response) => {
const session = db.prepare('SELECT \* FROM sessions WHERE id = ?').get(req.params.id);
if (!session) return res.status(404).json({ error: 'Session introuvable' });

const messages = db.prepare(
'SELECT \* FROM messages WHERE session_id = ? ORDER BY created_at ASC'
).all(req.params.id);

const conceptScores = db.prepare(
'SELECT \* FROM concept_scores WHERE session_id = ?'
).all(req.params.id);

res.json({ session, messages, conceptScores });
});

export default router;

════════════════════════════════════════════
ROUTES — src/routes/upload.routes.ts
════════════════════════════════════════════

import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuid } from 'uuid';

const router = Router();

const storage = multer.diskStorage({
destination: process.env.UPLOAD_DIR || './uploads',
filename: (req, file, cb) => {
cb(null, `${uuid()}-${file.originalname}`);
}
});

export const upload = multer({
storage,
limits: { fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB || '10')) _ 1024 _ 1024 },
fileFilter: (req, file, cb) => {
const allowed = ['.pdf', '.docx', '.txt', '.zip'];
const ext = path.extname(file.originalname).toLowerCase();
if (allowed.includes(ext)) cb(null, true);
else cb(new Error(`Type non supporté. Acceptés : ${allowed.join(', ')}`));
}
});

export default router;

════════════════════════════════════════════
ROUTES — src/routes/report.routes.ts (DASHBOARD PROF)
════════════════════════════════════════════

import { Router, Request, Response } from 'express';
import db from '../db/database';

const router = Router();

// GET /api/reports/teacher/:teacherId — Vue prof complète
router.get('/teacher/:teacherId', (req: Request, res: Response) => {
const { teacherId } = req.params;

// Récupérer toutes les classes du prof
const classes = db.prepare(
'SELECT \* FROM classes WHERE teacher_id = ?'
).all(teacherId) as any[];

const classReports = classes.map((cls: any) => {
// Étudiants de la classe
const students = db.prepare(`       SELECT u.id, u.name, u.email FROM users u
      JOIN class_members cm ON u.id = cm.student_id
      WHERE cm.class_id = ?
    `).all(cls.id) as any[];

    // Stats par étudiant
    const studentStats = students.map((student: any) => {
      const evals = db.prepare(`
        SELECT integrity_score, concept, created_at
        FROM evaluations WHERE user_id = ? ORDER BY created_at DESC LIMIT 10
      `).all(student.id) as any[];

      const avgScore = evals.length
        ? evals.reduce((sum: number, e: any) => sum + e.integrity_score, 0) / evals.length
        : 0;

      const conceptMap = db.prepare(`
        SELECT concept_name, AVG(score) as avg_score,
        (SELECT status FROM concept_scores WHERE user_id = ? AND concept_name = cs.concept_name ORDER BY evaluated_at DESC LIMIT 1) as latest_status
        FROM concept_scores cs WHERE user_id = ?
        GROUP BY concept_name
      `).all(student.id, student.id) as any[];

      return {
        student,
        evaluationsCount: evals.length,
        averageScore: Math.round(avgScore),
        recentEvals: evals.slice(0, 3),
        conceptMap
      };
    });

    // Concepts bloquants en commun (gap pour > 50% des étudiants)
    const allGapConcepts: Record<string, number> = {};
    studentStats.forEach(({ conceptMap }) => {
      conceptMap.filter((c: any) => c.latest_status === 'gap').forEach((c: any) => {
        allGapConcepts[c.concept_name] = (allGapConcepts[c.concept_name] || 0) + 1;
      });
    });

    const commonBlockingConcepts = Object.entries(allGapConcepts)
      .filter(([, count]) => count > students.length * 0.5)
      .map(([concept, count]) => ({ concept, affectedStudents: count }));

    const classAvgScore = studentStats.length
      ? studentStats.reduce((sum, s) => sum + s.averageScore, 0) / studentStats.length
      : 0;

    return {
      class: cls,
      classAverageScore: Math.round(classAvgScore),
      studentCount: students.length,
      commonBlockingConcepts,
      students: studentStats
    };

});

res.json({ teacherId, classes: classReports });
});

// GET /api/reports/student/:studentId — Rapport complet étudiant
router.get('/student/:studentId', (req: Request, res: Response) => {
const { studentId } = req.params;

const evaluations = db.prepare(`     SELECT * FROM evaluations WHERE user_id = ? ORDER BY created_at DESC
  `).all(studentId) as any[];

// Courbe d'évolution (score par évaluation dans le temps)
const progressCurve = evaluations.map((e: any) => ({
date: e.created_at,
score: e.integrity_score,
concept: e.concept
})).reverse();

// Heatmap d'activité (90 derniers jours)
const activity = db.prepare(`     SELECT activity_date, sessions_count FROM activity_logs
    WHERE user_id = ? AND activity_date >= date('now', '-90 days')
    ORDER BY activity_date ASC
  `).all(studentId);

// Carte globale des concepts
const globalConceptMap = db.prepare(`     SELECT concept_name, AVG(score) as avg_score,
    COUNT(*) as times_evaluated,
    (SELECT status FROM concept_scores WHERE user_id = ? 
     AND concept_name = cs.concept_name ORDER BY evaluated_at DESC LIMIT 1) as latest_status
    FROM concept_scores cs WHERE user_id = ?
    GROUP BY concept_name ORDER BY avg_score DESC
  `).all(studentId, studentId);

res.json({
studentId,
totalEvaluations: evaluations.length,
progressCurve,
activityHeatmap: activity,
globalConceptMap,
recentEvaluations: evaluations.slice(0, 5).map((e: any) => ({
...e,
solid_concepts: JSON.parse(e.solid_concepts),
partial_concepts: JSON.parse(e.partial_concepts),
gap_concepts: JSON.parse(e.gap_concepts),
recommendations: JSON.parse(e.recommendations)
}))
});
});

export default router;

════════════════════════════════════════════
ENTRY POINT — src/server.ts
════════════════════════════════════════════

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { upload } from './routes/upload.routes';
import sessionRoutes from './routes/session.routes';
import reportRoutes from './routes/report.routes';
import userRoutes from './routes/user.routes';
import { initDatabase } from './db/database';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json({ limit: '10mb' }));

// Init DB
initDatabase();

// Routes
app.use('/api/sessions', upload.single('file'), sessionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/api/health', (req, res) => {
res.json({
status: 'ok',
llm: 'Groq (llama-3.1-70b-versatile) + Gemini 1.5 Flash fallback',
db: 'SQLite'
});
});

app.listen(PORT, () => {
console.log(`GaAlBrain IA Backend running on port ${PORT}`);
console.log(`LLM: Groq FREE (llama-3.1-70b) + Gemini Flash fallback`);
});

export default app;

════════════════════════════════════════════
DATABASE INIT — src/db/database.ts
════════════════════════════════════════════

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const DB_PATH = './gaalbrainia.db';

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
const schema = fs.readFileSync(
path.join(\_\_dirname, 'schema.sql'),
'utf-8'
);
db.exec(schema);
console.log('SQLite database initialized');
}

export default db;

════════════════════════════════════════════
API ENDPOINTS — RÉSUMÉ COMPLET
════════════════════════════════════════════

AUTH :
POST /api/users/register
POST /api/users/login
GET /api/users/:id

SESSIONS :
POST /api/sessions ← Créer session (upload optionnel)
POST /api/sessions/:id/message ← Envoyer réponse + recevoir question IA
POST /api/sessions/:id/complete ← Terminer + bilan cognitif
GET /api/sessions/:id ← Détails session

RAPPORTS :
GET /api/reports/student/:studentId ← Dashboard étudiant
GET /api/reports/teacher/:teacherId ← Dashboard prof (toutes classes)

SANTÉ :
GET /api/health

════════════════════════════════════════════
NOTES IMPORTANTES POUR LE MVP
════════════════════════════════════════════

1. CLÉS API GRATUITES À OBTENIR :
   - Groq (PRIMARY) : https://console.groq.com — S'inscrire, API Keys → créer
     Modèle utilisé : llama-3.1-70b-versatile (gratuit, 14400 req/jour)
   - Gemini (FALLBACK) : https://aistudio.google.com/app/apikey — S'inscrire
     Modèle utilisé : gemini-1.5-flash (gratuit, 15 req/min, 1M tokens/jour)

2. LIMITES GRATUITES À SURVEILLER :
   - Groq : 30 req/min → espacer les appels si usage intensif
   - Gemini : 15 req/min → utilisé seulement pour RAG (documents longs)
   - SQLite : illimité pour MVP

3. POUR PASSER EN PRODUCTION PLUS TARD :
   - Remplacer SQLite par PostgreSQL (même interface better-sqlite3 → pg)
   - Ajouter pgvector pour RAG avancé
   - Ajouter Redis pour cache des sessions actives
   - Passer à Anthropic Claude quand budget disponible
     (juste changer le service LLM, rien d'autre)

4. HÉBERGEMENT GRATUIT DU BACKEND MVP :
   - Railway.app (plan gratuit 500h/mois)
   - Render.com (plan gratuit, spin-up lent)
   - Fly.io (plan gratuit limité)
   - En local pour commencer : node src/server.ts

5. DÉMARRAGE LOCAL :
   npm install
   cp .env.example .env # Remplir GROQ_API_KEY et GEMINI_API_KEY
   npx ts-node src/server.ts
