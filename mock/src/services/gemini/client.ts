import {
  GEMINI_API_BASE,
  getGeminiApiKey,
} from '../../config/gemini';
import { GeminiApiError, GeminiNotConfiguredError } from './errors';

export type GeminiPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

export type GenerateContentOptions = {
  model: string;
  parts: GeminiPart[];
  jsonMode?: boolean;
  temperature?: number;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
    finishReason?: string;
  }>;
  error?: { message?: string; code?: number };
};

function toApiPart(part: GeminiPart): Record<string, unknown> {
  if ('text' in part) return { text: part.text };
  return {
    inline_data: {
      mime_type: part.inlineData.mimeType,
      data: part.inlineData.data,
    },
  };
}

export async function generateGeminiContent(
  options: GenerateContentOptions,
): Promise<string> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) throw new GeminiNotConfiguredError();

  const url = `${GEMINI_API_BASE}/models/${options.model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const body = {
    contents: [{ role: 'user', parts: options.parts.map(toApiPart) }],
    generationConfig: {
      temperature: options.temperature ?? 0.2,
      ...(options.jsonMode ? { responseMimeType: 'application/json' } : {}),
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const payload = (await response.json()) as GeminiResponse;
  if (!response.ok) {
    const detail =
      payload.error?.message ??
      payload.candidates?.[0]?.finishReason ??
      response.statusText;
    throw new GeminiApiError(response.status, detail);
  }

  const text = payload.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? '')
    .join('')
    .trim();

  if (!text) {
    throw new GeminiApiError(
      response.status,
      payload.candidates?.[0]?.finishReason ?? 'Empty response',
    );
  }

  return text;
}
