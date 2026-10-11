/**
 * AdapterFactory
 * Routes file objects to appropriate parser adapters
 * Maintains registry of available adapters
 */

import { FileAdapter } from './fileAdapter';
import { TextAdapter } from './textAdapter';
import { PDFAdapter } from './pdfAdapter';
import { DOCXAdapter } from './docxAdapter';

export class AdapterFactory {
  private adapters: FileAdapter[] = [
    new PDFAdapter(),
    new DOCXAdapter(),
    new TextAdapter(),
  ];

  /**
   * Get appropriate adapter for file
   * @param file File to process
   * @returns Adapter capable of handling this file
   * @throws Error if no adapter can handle the file
   */
  getAdapter(file: File): FileAdapter {
    // Find first adapter that can handle this file
    const matching = this.adapters.find(adapter => adapter.canHandle(file));

    if (!matching) {
      const supportedFormats = this.adapters
        .map(a => `${a.getName()} (${a.getMimeTypes().join(', ')})`)
        .join('; ');
      throw new Error(
        `File format not supported. Supported formats: ${supportedFormats}`
      );
    }

    return matching;
  }

  /**
   * Get all supported MIME types
   * @returns Array of MIME type strings
   */
  getSupportedMimeTypes(): string[] {
    const mimeTypes = new Set<string>();
    this.adapters.forEach(adapter => {
      adapter.getMimeTypes().forEach(mime => mimeTypes.add(mime));
    });
    return Array.from(mimeTypes);
  }

  /**
   * Get all supported file extensions
   * @returns Array of file extension strings (e.g., ['.txt', '.pdf', '.docx'])
   */
  getSupportedExtensions(): string[] {
    return ['.txt', '.pdf', '.docx'];
  }

  /**
   * Register custom adapter
   * Useful for extending plugin with new formats
   * @param adapter FileAdapter implementation
   */
  registerAdapter(adapter: FileAdapter): void {
    this.adapters.unshift(adapter); // Add to front for priority
  }
}
