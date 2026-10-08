const MAX_INPUT_SIZE = 10 * 1024 * 1024; // 10MB in bytes

export interface InputValidationResult {
  valid: boolean;
  error?: string;
  text?: string;
  title?: string;
  wordCount?: number;
}

export function validateTextInput(text: string): InputValidationResult {
  if (!text || text.trim().length === 0) {
    return {
      valid: false,
      error: 'Document cannot be empty',
    };
  }

  const sizeInBytes = Buffer.byteLength(text, 'utf8');
  if (sizeInBytes > MAX_INPUT_SIZE) {
    return {
      valid: false,
      error: `Document exceeds 10MB limit (current: ${(sizeInBytes / (1024 * 1024)).toFixed(2)}MB)`,
    };
  }

  const normalized = normalizeText(text);
  const wordCount = countWords(normalized);
  const title = detectDocumentTitle(text);

  return {
    valid: true,
    text: normalized,
    title,
    wordCount,
  };
}

export function normalizeText(text: string): string {
  // Remove extra whitespace, normalize line breaks
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\n\n+/g, '\n\n')
    .trim();
}

export function detectDocumentTitle(text: string): string {
  const lines = text.split('\n');

  // Look for first non-empty line (likely title or heading)
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length > 0) {
      // Remove markdown headers if present
      return trimmed.replace(/^#+\s*/, '').substring(0, 50);
    }
  }

  return 'Untitled Document';
}

function countWords(text: string): number {
  return text
    .split(/\s+/)
    .filter((word) => word.length > 0)
    .length;
}
