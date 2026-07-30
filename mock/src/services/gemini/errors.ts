export class GeminiNotConfiguredError extends Error {
  constructor(message = 'Gemini API key is not configured') {
    super(message);
    this.name = 'GeminiNotConfiguredError';
  }
}

export class GeminiApiError extends Error {
  readonly status: number;
  readonly detail: string;

  constructor(status: number, detail: string) {
    super(`Gemini API error (${status}): ${detail}`);
    this.name = 'GeminiApiError';
    this.status = status;
    this.detail = detail;
  }
}

export class GeminiImageReadError extends Error {
  constructor(message = 'Could not read image for Gemini analysis') {
    super(message);
    this.name = 'GeminiImageReadError';
  }
}

export class GeminiParseError extends Error {
  constructor(message = 'Could not parse Gemini response') {
    super(message);
    this.name = 'GeminiParseError';
  }
}
