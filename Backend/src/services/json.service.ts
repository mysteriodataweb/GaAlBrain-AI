export function extractJsonObject<T>(raw: string): T {
  const cleaned = raw.replace(/```json|```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');

  if (start === -1 || end === -1 || end <= start) {
    throw new Error('No JSON object found in LLM response');
  }

  return JSON.parse(cleaned.slice(start, end + 1)) as T;
}
