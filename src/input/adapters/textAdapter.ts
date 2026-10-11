/**
 * TextAdapter
 * Handles plain text (.txt) files
 * Uses browser File API to read text content
 */

import { FileAdapter } from './fileAdapter';

export class TextAdapter implements FileAdapter {
  canHandle(file: File): boolean {
    return file.type === 'text/plain' || file.name.endsWith('.txt');
  }

  async parse(file: File): Promise<string> {
    try {
      // Use browser File API to read as text
      const text = await file.text();

      if (!text || text.trim().length === 0) {
        throw new Error('Text file is empty');
      }

      return text;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to read text file: ${errorMsg}`);
    }
  }

  getMimeTypes(): string[] {
    return ['text/plain'];
  }

  getName(): string {
    return 'Text Adapter';
  }
}
