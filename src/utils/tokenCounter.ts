// Simple approximation: ~4 characters per token on average
// This is used for document chunking; actual usage varies by LLM
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function chunkDocumentByTokens(
  document: string,
  chunkSizeTokens: number
): string[] {
  const estimatedTokensPerChar = 4;
  const chunkSizeChars = chunkSizeTokens * estimatedTokensPerChar;

  const chunks: string[] = [];
  let currentChunk = '';

  const paragraphs = document.split('\n\n');

  for (const paragraph of paragraphs) {
    if ((currentChunk + paragraph).length > chunkSizeChars && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = paragraph;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}
