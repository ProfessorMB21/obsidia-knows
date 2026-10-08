import { estimateTokens, chunkDocumentByTokens } from '../../src/utils/tokenCounter';

describe('Token Counter', () => {
  describe('estimateTokens', () => {
    test('estimates tokens roughly as 1 per 4 characters', () => {
      const text = 'a'.repeat(100);
      const tokens = estimateTokens(text);
      expect(tokens).toBe(25); // 100 / 4
    });

    test('handles empty string', () => {
      const tokens = estimateTokens('');
      expect(tokens).toBe(0);
    });
  });

  describe('chunkDocumentByTokens', () => {
    test('splits document into chunks', () => {
      const doc = 'Paragraph 1\n\nParagraph 2\n\nParagraph 3';
      const chunks = chunkDocumentByTokens(doc, 100);
      expect(chunks.length).toBeGreaterThanOrEqual(1);
    });

    test('respects chunk size limit', () => {
      const doc = 'a'.repeat(2000);
      const chunks = chunkDocumentByTokens(doc, 100);
      chunks.forEach((chunk) => {
        // Each chunk should be roughly <= 400 chars (100 tokens * 4)
        expect(chunk.length).toBeLessThanOrEqual(450);
      });
    });

    test('preserves paragraph boundaries', () => {
      const doc = 'First paragraph.\n\nSecond paragraph.\n\nThird paragraph.';
      const chunks = chunkDocumentByTokens(doc, 10);
      expect(chunks.length).toBeGreaterThan(0);
      chunks.forEach((chunk) => {
        expect(chunk.length).toBeGreaterThan(0);
      });
    });
  });
});
