import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

  console.log('💬 callLLM wrapper called - forceGemini:', forceGemini, 'maxTokens:', maxTokens);

  if (forceGemini) {
    console.log('💬 Forcing Gemini...');
    return callGemini(systemPrompt, messages, maxTokens);
  }

  try {
    console.log('💬 Trying Groq...');
    return await callGroq(systemPrompt, messages, maxTokens, temperature);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error';
    if (!hasRealKey(process.env.GEMINI_API_KEY)) {
      console.warn('💬 Groq failed and Gemini fallback is not configured:', message);
      throw error;
    }
    console.warn('💬 Groq failed, falling back to Gemini:', message);
    return callGemini(systemPrompt, messages, maxTokens);
  }
}

function hasRealKey(value: string | undefined): value is string {
  return Boolean(value && !value.startsWith('your_') && !value.includes('xxxxxxxx') && !value.includes('your_gemini'));
}

async function callGroq(
  systemPrompt: string,
  messages: LLMMessage[],
  maxTokens: number,
  temperature: number
): Promise<string> {
  if (!hasRealKey(process.env.GROQ_API_KEY)) {
    throw new Error('GROQ_API_KEY is missing');
  }

  console.log('🌐 Calling Groq API with maxTokens:', maxTokens, 'temperature:', temperature);
  console.log('🌐 Messages count:', messages.length);
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  try {
    console.log('🌐 Groq request starting...');
    const response = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      max_tokens: maxTokens,
      temperature,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((message) => ({ role: message.role, content: message.content }))
      ]
    });
    console.log('🌐 Groq response received');
    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('🌐 Groq API error:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

async function callGemini(
  systemPrompt: string,
  messages: LLMMessage[],
  _maxTokens: number
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!hasRealKey(apiKey)) {
    throw new Error('GEMINI_API_KEY is missing');
  }

  const gemini = new GoogleGenerativeAI(apiKey);
  const model = gemini.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    systemInstruction: systemPrompt
  });

  const history = messages.slice(0, -1).map((message) => ({
    role: message.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: message.content }]
  }));

  const lastMessage = messages[messages.length - 1];
  const chat = model.startChat({ history });
  const result = await chat.sendMessage(lastMessage?.content || 'Commence.');
  return result.response.text();
}
