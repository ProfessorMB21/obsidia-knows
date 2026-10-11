/**
 * PDFAdapter
 * Handles PDF (.pdf) files using pdfjs-dist library loaded from CDN
 * Extracts text content from all pages (browser-compatible)
 */

import { FileAdapter } from './fileAdapter';

// Type stubs for pdfjs loaded from CDN
declare global {
  interface Window {
    pdfjsLib?: any;
  }
}

export class PDFAdapter implements FileAdapter {
  private static pdfLoadPromise: Promise<void> | null = null;

  canHandle(file: File): boolean {
    return file.type === 'application/pdf' || file.name.endsWith('.pdf');
  }

  private static async loadPdfJs(): Promise<void> {
    if (this.pdfLoadPromise) {
      return this.pdfLoadPromise;
    }

    this.pdfLoadPromise = new Promise((resolve, reject) => {
      // Check if already loaded
      if (window.pdfjsLib) {
        resolve();
        return;
      }

      // Load pdf.js from CDN
      const scriptUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      const script = document.createElement('script');
      script.src = scriptUrl;
      script.async = true;

      script.onload = () => {
        if (window.pdfjsLib) {
          // Set worker URL
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
          resolve();
        } else {
          reject(new Error('Failed to load pdf.js library'));
        }
      };

      script.onerror = () => {
        reject(new Error('Failed to load pdf.js from CDN'));
      };

      document.head.appendChild(script);
    });

    return this.pdfLoadPromise;
  }

  async parse(file: File): Promise<string> {
    try {
      // Load pdfjs library if not already loaded
      await PDFAdapter.loadPdfJs();

      const pdfjsLib = window.pdfjsLib;
      if (!pdfjsLib) {
        throw new Error('pdf.js library failed to load');
      }

      // Convert File to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();

      // Parse PDF
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      // Extract text from all pages
      let fullText = '';
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join('');
        fullText += pageText + '\n';
      }

      const text = fullText.trim();

      if (!text || text.length === 0) {
        throw new Error('No text content found in PDF');
      }

      return text;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);

      // Provide helpful error messages
      if (errorMsg.includes('corrupted') || errorMsg.includes('Unexpected end') || errorMsg.includes('Invalid PDF')) {
        throw new Error('PDF file appears to be corrupted. Try another file.');
      }
      if (errorMsg.includes('encrypted') || errorMsg.includes('password')) {
        throw new Error('PDF is password-protected. Please use an unencrypted PDF.');
      }

      throw new Error(`Failed to parse PDF: ${errorMsg}`);
    }
  }

  getMimeTypes(): string[] {
    return ['application/pdf'];
  }

  getName(): string {
    return 'PDF Adapter';
  }
}

