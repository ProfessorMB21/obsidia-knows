/**
 * FileValidator
 * Orchestrates file validation and parsing
 * Bridges file upload input with existing text validation pipeline
 */

import { AdapterFactory } from './adapters/adapterFactory';
import { FileAdapter } from './adapters/fileAdapter';
import { logger } from '../utils/logger';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB, same as text limit

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  text?: string;
  fileName?: string;
  fileSizeBytes?: number;
}

export class FileValidator {
  private factory: AdapterFactory;

  constructor() {
    this.factory = new AdapterFactory();
  }

  /**
   * Validate and parse file
   * @param file File object from file input
   * @returns FileValidationResult with extracted text or error
   */
  async validateFile(file: File): Promise<FileValidationResult> {
    try {
      // Validate file exists
      if (!file) {
        return {
          valid: false,
          error: 'No file provided',
        };
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        return {
          valid: false,
          error: `File too large (${sizeMB}MB). Maximum size is 10MB.`,
          fileSizeBytes: file.size,
        };
      }

      logger.log(`[FileValidator] Validating file: ${file.name} (${file.size} bytes, type: ${file.type})`);

      // Get appropriate adapter
      let adapter: FileAdapter;
      try {
        adapter = this.factory.getAdapter(file);
      } catch (error) {
        return {
          valid: false,
          error: error instanceof Error ? error.message : 'File format not supported',
          fileName: file.name,
        };
      }

      logger.log(`[FileValidator] Using adapter: ${adapter.getName()}`);

      // Parse file
      const text = await adapter.parse(file);

      logger.log(`[FileValidator] File parsed successfully. Extracted ${text.length} characters.`);

      return {
        valid: true,
        text,
        fileName: file.name,
        fileSizeBytes: file.size,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(`[FileValidator] Error validating file: ${errorMsg}`, error);

      return {
        valid: false,
        error: errorMsg || 'Unknown error parsing file',
        fileName: file?.name,
      };
    }
  }

  /**
   * Get supported file extensions for UI accept attribute
   * @returns Comma-separated list of extensions
   */
  getSupportedExtensionsString(): string {
    return this.factory.getSupportedExtensions().join(',');
  }

  /**
   * Get supported MIME types for UI accept attribute
   * @returns Comma-separated list of MIME types
   */
  getSupportedMimeTypesString(): string {
    return this.factory.getSupportedMimeTypes().join(',');
  }

  /**
   * Get user-friendly list of supported formats
   * @returns String describing supported formats
   */
  getSupportedFormatsDescription(): string {
    return 'PDF, Word (.docx), or Text (.txt) files';
  }
}
