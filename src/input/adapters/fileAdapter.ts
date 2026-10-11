/**
 * FileAdapter Interface
 * Base interface for all file format parsers
 * Enables pluggable support for .txt, .pdf, .docx formats
 */

export interface FileAdapter {
  /**
   * Check if this adapter can handle the given file
   * @param file File object with name and type properties
   * @returns true if this adapter should process this file
   */
  canHandle(file: File): boolean;

  /**
   * Parse file and extract plain text content
   * @param file File object to parse
   * @returns Promise resolving to plain text string
   * @throws Error if parsing fails (file corrupted, unsupported format, etc.)
   */
  parse(file: File): Promise<string>;

  /**
   * Get MIME types this adapter handles
   * @returns Array of MIME type strings
   */
  getMimeTypes(): string[];

  /**
   * Get human-readable name of this adapter
   * @returns Adapter name for logging/debugging
   */
  getName(): string;
}
