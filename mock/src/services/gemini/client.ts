import {
  GEMINI_API_BASE,
  GEMINI_MODEL_FALLBACKS,
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
  responseSchema?: Record<string, unknown>;
  temperature?: number;
};

type GeminiResponsePart = {
  text?: string;
  thought?: string;
  thoughtSignature?: string;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: GeminiResponsePart[];
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
  const models = uniqueModels([options.model, ...GEMINI_MODEL_FALLBACKS]);
  let lastError: GeminiApiError | null = null;

  for (const model of models) {
    try {
      return await requestGeminiContent(model, options);
    } catch (error) {
      if (!(error instanceof GeminiApiError)) throw error;
      lastError = error;
      if (error.status !== 404) throw error;
    }
  }

  throw lastError ?? new GeminiApiError(404, 'No available Gemini model');
}

function uniqueModels(models: string[]): string[] {
  const seen = new Set<string>();
  return models.filter((model) => {
    const trimmed = model.trim();
    if (!trimmed || seen.has(trimmed)) return false;
    seen.add(trimmed);
    return true;
  });
}

async function requestGeminiContent(
  model: string,
  options: GenerateContentOptions,
): Promise<string> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) throw new GeminiNotConfiguredError();

  const url = `${GEMINI_API_BASE}/models/${model}:generateContent`;
  const body = {
    contents: [{ role: 'user', parts: options.parts.map(toApiPart) }],
    generationConfig: {
      temperature: options.temperature ?? 0.2,
      ...(options.jsonMode
        ? {
            responseMimeType: 'application/json',
            ...(options.responseSchema
              ? { responseSchema: options.responseSchema }
              : {}),
          }
        : {}),
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
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
