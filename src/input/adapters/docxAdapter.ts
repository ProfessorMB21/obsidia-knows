/**
 * DOCXAdapter
 * Handles Word documents (.docx) using jszip library
 * Extracts text content while preserving paragraph structure (browser-compatible)
 */

import JSZip from 'jszip';
import { FileAdapter } from './fileAdapter';

export class DOCXAdapter implements FileAdapter {
  canHandle(file: File): boolean {
    const mimeType = file.type;
    const fileName = file.name.toLowerCase();

    return (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileName.endsWith('.docx')
    );
  }

  async parse(file: File): Promise<string> {
    try {
      // Load DOCX file as ZIP
      const arrayBuffer = await file.arrayBuffer();
      const zip = new JSZip();
      await zip.loadAsync(arrayBuffer);

      // Read document.xml which contains the text content
      const documentXml = zip.file('word/document.xml');
      if (!documentXml) {
        throw new Error('Invalid DOCX file: document.xml not found');
      }

      const xmlContent = await documentXml.async('string');

      // Parse XML and extract text from paragraphs and runs
      const text = this.extractTextFromXml(xmlContent);

      if (!text || text.trim().length === 0) {
        throw new Error('No text content found in DOCX');
      }

      return text;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);

      // Provide helpful error messages
      if (errorMsg.includes('not a valid zip') || errorMsg.includes('Invalid DOCX')) {
        throw new Error('DOCX file is corrupted or not a valid Word document.');
      }

      throw new Error(`Failed to parse DOCX: ${errorMsg}`);
    }
  }

  /**
   * Extract text from DOCX XML structure
   * DOCX format: <w:p> = paragraph, <w:r> = run, <w:t> = text
   */
  private extractTextFromXml(xmlContent: string): string {
    const paragraphs: string[] = [];

    // Simple XML parsing: find all <w:t> tags and group by paragraphs
    // This is a simplified approach that works for most DOCX files
    const paragraphRegex = /<w:p[^>]*>[\s\S]*?<\/w:p>/g;
    const textRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;

    const paragraphMatches = xmlContent.match(paragraphRegex) || [];

    for (const paragraph of paragraphMatches) {
      const texts: string[] = [];
      let textMatch;

      // Reset regex lastIndex
      textRegex.lastIndex = 0;

      while ((textMatch = textRegex.exec(paragraph)) !== null) {
        texts.push(textMatch[1]);
      }

      if (texts.length > 0) {
        paragraphs.push(texts.join(''));
      }
    }

    // Join paragraphs with newlines
    return paragraphs.join('\n').trim();
  }

  getMimeTypes(): string[] {
    return ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  }

  getName(): string {
    return 'DOCX Adapter';
  }
}
