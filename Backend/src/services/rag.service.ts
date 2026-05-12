import fs from 'fs';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';
import { DOCUMENT_EXTRACTION_PROMPT } from '../lib/prompts';
import { extractJsonObject } from './json.service';
import { callLLM } from './llm.service';

export async function extractTextFromFile(filePath: string, mimeType: string): Promise<string> {
  if (mimeType === 'application/pdf' || filePath.toLowerCase().endsWith('.pdf')) {
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text.slice(0, 15000);
  }

  if (mimeType.includes('wordprocessingml') || filePath.toLowerCase().endsWith('.docx')) {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value.slice(0, 15000);
  }

  if (mimeType.startsWith('text/') || filePath.toLowerCase().endsWith('.txt')) {
    return fs.readFileSync(filePath, 'utf-8').slice(0, 15000);
  }

  return '';
}

export async function summarizeDocumentForEvaluation(text: string, concept: string): Promise<string> {
  const trimmed = text.slice(0, 15000);
  if (!trimmed.trim()) {
    return '';
  }

  try {
    const prompt = DOCUMENT_EXTRACTION_PROMPT
      .replace('{{CONCEPT}}', concept)
      .replace('{{DOCUMENT_TEXT}}', trimmed);
    const raw = await callLLM(
      'Tu extrais des concepts pédagogiques. Réponds uniquement en JSON strict valide, sans markdown.',
      [{ role: 'user', content: prompt }],
      { maxTokens: 1000, temperature: 0.2 }
    );
    const parsed = extractJsonObject<{
      context: string;
      key_concepts?: string[];
      prerequisite_concepts?: string[];
      potential_confusion_points?: string[];
      evaluation_angle?: string;
    }>(raw);

    return [
      parsed.context,
      parsed.key_concepts?.length ? `Concepts clés: ${parsed.key_concepts.join(', ')}` : '',
      parsed.prerequisite_concepts?.length ? `Prérequis: ${parsed.prerequisite_concepts.join(', ')}` : '',
      parsed.potential_confusion_points?.length ? `Points de confusion: ${parsed.potential_confusion_points.join(', ')}` : '',
      parsed.evaluation_angle ? `Angle d'évaluation: ${parsed.evaluation_angle}` : ''
    ]
      .filter(Boolean)
      .join('\n');
  } catch {
    return trimmed.slice(0, 3000);
  }
}
