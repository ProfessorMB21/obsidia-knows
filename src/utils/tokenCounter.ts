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
    // If paragraph fits in current chunk, add it
    if ((currentChunk + (currentChunk ? '\n\n' : '') + paragraph).length <= chunkSizeChars) {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
    } else {
      // Paragraph doesn't fit; need to handle it
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }

      // If paragraph itself is larger than chunk size, split it into smaller pieces
      if (paragraph.length > chunkSizeChars) {
        // Try to split by sentences first
        const sentences = paragraph.split(/(?<=[.!?])\s+/);
        let sentenceChunk = '';

        for (const sentence of sentences) {
          const potentialChunk = sentenceChunk + (sentenceChunk ? ' ' : '') + sentence;
          if (potentialChunk.length <= chunkSizeChars) {
            sentenceChunk = potentialChunk;
          } else {
            if (sentenceChunk.length > 0) {
              chunks.push(sentenceChunk.trim());
            }
            // If single sentence is still too large, split by fixed size
            if (sentence.length > chunkSizeChars) {
              for (let i = 0; i < sentence.length; i += chunkSizeChars) {
                chunks.push(sentence.substring(i, i + chunkSizeChars).trim());
              }
              sentenceChunk = '';
            } else {
              sentenceChunk = sentence;
            }
          }
        }
        if (sentenceChunk.length > 0) {
          currentChunk = sentenceChunk;
        }
      } else {
        // Paragraph fits in next chunk
        currentChunk = paragraph;
      }
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

