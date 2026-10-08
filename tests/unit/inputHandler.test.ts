import { validateTextInput, normalizeText, detectDocumentTitle } from '../../src/input/inputHandler';

describe('Input Handler', () => {
  describe('validateTextInput', () => {
    test('accepts valid text', () => {
      const result = validateTextInput('This is a valid document.');
      expect(result.valid).toBe(true);
      expect(result.text).toBeDefined();
      expect(result.wordCount).toBeGreaterThan(0);
    });

    test('rejects empty text', () => {
      const result = validateTextInput('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('cannot be empty');
    });

    test('rejects whitespace-only text', () => {
      const result = validateTextInput('   \n\n  ');
      expect(result.valid).toBe(false);
    });

    test('rejects oversized text', () => {
      const hugeText = 'a'.repeat(11 * 1024 * 1024); // 11MB
      const result = validateTextInput(hugeText);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds 10MB');
    });
  });

  describe('normalizeText', () => {
    test('removes extra whitespace', () => {
      const text = 'Line 1\n\n\n\nLine 2';
      const normalized = normalizeText(text);
      expect(normalized).toBe('Line 1\n\nLine 2');
    });

    test('normalizes line breaks', () => {
      const text = 'Line 1\r\nLine 2\r\nLine 3';
      const normalized = normalizeText(text);
      expect(normalized).toBe('Line 1\nLine 2\nLine 3');
    });
  });

  describe('detectDocumentTitle', () => {
    test('extracts title from first non-empty line', () => {
      const text = 'My Document Title\nContent here...';
      const title = detectDocumentTitle(text);
      expect(title).toBe('My Document Title');
    });

    test('removes markdown headers', () => {
      const text = '# Main Title\nContent...';
      const title = detectDocumentTitle(text);
      expect(title).toBe('Main Title');
    });
  });
});
