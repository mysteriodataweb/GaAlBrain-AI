import AdmZip from 'adm-zip';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { CODE_ANALYSIS_PROMPT } from '../lib/prompts';
import { extractJsonObject } from './json.service';
import { callLLM } from './llm.service';

const codeExtensions = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.py',
  '.java',
  '.cs',
  '.go',
  '.rs',
  '.php',
  '.rb',
  '.html',
  '.css',
  '.sql',
  '.md'
]);

export async function extractCodeFromZip(filePath: string): Promise<string> {
  const zip = new AdmZip(filePath);
  const snippets: string[] = [];

  for (const entry of zip.getEntries()) {
    if (entry.isDirectory) continue;
    const ext = path.extname(entry.entryName).toLowerCase();
    if (!codeExtensions.has(ext)) continue;
    if (entry.header.size > 100_000) continue;

    snippets.push(`// FILE: ${entry.entryName}\n${entry.getData().toString('utf-8')}`);
    if (snippets.join('\n\n').length > 25000) break;
  }

  return snippets.join('\n\n');
}

export async function fetchPublicGithubCode(githubUrl: string): Promise<string> {
  const match = githubUrl.match(/github\.com\/([^/]+)\/([^/#?]+)/i);
  if (!match) {
    throw new Error('URL GitHub invalide');
  }

  const [, owner, repoRaw] = match;
  const repo = repoRaw.replace(/\.git$/, '');
  let repoResponse;
  try {
    repoResponse = await axios.get(`https://api.github.com/repos/${owner}/${repo}`);
  } catch (error: any) {
    if (error?.response?.status === 404) {
      throw new Error('Repo GitHub introuvable ou privé. Vérifie que le lien pointe vers un dépôt public.');
    }
    throw error;
  }

  const defaultBranch = repoResponse.data.default_branch || 'main';
  const treeResponse = await axios.get(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${encodeURIComponent(defaultBranch)}?recursive=1`
  );
  const files = (treeResponse.data.tree || [])
    .filter((item: any) => item.type === 'blob' && codeExtensions.has(path.extname(item.path).toLowerCase()))
    .slice(0, 20);

  const snippets: string[] = [];
  for (const file of files) {
    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${file.path}`;
    const response = await axios.get(rawUrl, { responseType: 'text' });
    snippets.push(`// FILE: ${file.path}\n${String(response.data).slice(0, 4000)}`);
  }

  return snippets.join('\n\n').slice(0, 25000);
}

export async function extractCodeFromDirectory(directory: string): Promise<string> {
  const snippets: string[] = [];
  const walk = (current: string) => {
    for (const item of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, item.name);
      if (item.isDirectory()) {
        if (!['node_modules', '.git', 'dist', 'build'].includes(item.name)) walk(fullPath);
        continue;
      }

      const ext = path.extname(item.name).toLowerCase();
      if (!codeExtensions.has(ext) || fs.statSync(fullPath).size > 100_000) continue;
      snippets.push(`// FILE: ${path.relative(directory, fullPath)}\n${fs.readFileSync(fullPath, 'utf-8')}`);
      if (snippets.join('\n\n').length > 25000) return;
    }
  };

  walk(directory);
  return snippets.join('\n\n').slice(0, 25000);
}

export async function analyzeCodeForEvaluation(code: string): Promise<{ context: string }> {
  if (!code.trim()) {
    return { context: 'Aucun code exploitable trouvé.' };
  }

  try {
    const prompt = CODE_ANALYSIS_PROMPT.replace('{{CODE_CONTENT}}', code.slice(0, 25000));
    const raw = await callLLM(
      'Tu analyses du code pour préparer une évaluation socratique. Réponds uniquement en JSON strict valide, sans markdown.',
      [{ role: 'user', content: prompt }],
      { maxTokens: 1200, temperature: 0.2 }
    );
    const parsed = extractJsonObject<{
      context: string;
      key_concepts?: string[];
      suspicious_patterns?: string[];
      comprehension_probes?: Array<{ target: string; question: string; why: string }>;
      edge_cases_to_test?: string[];
      complexity_assessment?: string;
    }>(raw);

    const context = [
      parsed.context,
      parsed.key_concepts?.length ? `Concepts clés: ${parsed.key_concepts.join(', ')}` : '',
      parsed.suspicious_patterns?.length ? `Patterns suspects: ${parsed.suspicious_patterns.join(' | ')}` : '',
      parsed.comprehension_probes?.length
        ? `Questions de sonde: ${parsed.comprehension_probes
            .map((probe) => `${probe.target}: ${probe.question} (${probe.why})`)
            .join(' | ')}`
        : '',
      parsed.edge_cases_to_test?.length ? `Cas limites: ${parsed.edge_cases_to_test.join(' | ')}` : '',
      parsed.complexity_assessment ? `Complexité: ${parsed.complexity_assessment}` : ''
    ]
      .filter(Boolean)
      .join('\n');

    return { context };
  } catch {
    return { context: code.slice(0, 3000) };
  }
}
