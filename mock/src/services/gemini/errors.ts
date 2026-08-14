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

/** 応答自体は正常だが対象が0件。再試行しても結果は変わらない */
export class GeminiEmptyResultError extends GeminiParseError {
  constructor(message = 'Gemini returned no items') {
    super(message);
    this.name = 'GeminiEmptyResultError';
  }
}

/** 通信到達前の失敗（オフライン・DNS 失敗など）。再試行する価値がある */
export class GeminiNetworkError extends Error {
  constructor(message = 'Could not reach Gemini API') {
    super(message);
    this.name = 'GeminiNetworkError';
  }
}
