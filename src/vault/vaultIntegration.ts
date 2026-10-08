import { App, normalizePath, TFolder } from 'obsidian';
import { KnowledgeGraph } from '../types';
import { logger } from '../utils/logger';

export async function createGraphInVault(
  app: App,
  graph: KnowledgeGraph,
  nodeFiles: Map<string, string>,
  outputFolderTemplate: string
): Promise<void> {
  const graphFolder = normalizePath(
    `${outputFolderTemplate}/${sanitizeFolderName(graph.title)}`
  );

  // Ensure folder exists
  await ensureFolderExists(app, graphFolder);

  // Create note files
  for (const [filename, content] of nodeFiles) {
    const filePath = normalizePath(`${graphFolder}/${filename}`);

    try {
      const file = app.vault.getAbstractFileByPath(filePath);
      if (file && file.name.endsWith('.md')) {
        // File exists, overwrite
        await app.vault.modify(file as any, content);
        logger.log(`Updated: ${filePath}`);
      } else {
        // Create new file
        await app.vault.create(filePath, content);
        logger.log(`Created: ${filePath}`);
      }
    } catch (error) {
      logger.error(`Failed to create file ${filePath}:`, error);
      throw new Error(`Failed to create vault file: ${filePath}`);
    }
  }

  logger.log(`Graph created in folder: ${graphFolder}`);
}

export async function ensureFolderExists(app: App, folderPath: string): Promise<void> {
  const normalized = normalizePath(folderPath);

  try {
    const existing = app.vault.getAbstractFileByPath(normalized);
    if (existing && existing instanceof TFolder) {
      // Folder exists
      return;
    }

    // Create folder
    await app.vault.createFolder(normalized);
    logger.log(`Created folder: ${normalized}`);
  } catch (error) {
    // Folder might already exist, ignore
    logger.debug(`Ensured folder exists: ${normalized}`);
  }
}

export function sanitizeFolderName(name: string): string {
  // Remove or replace invalid folder name characters
  return name
    .replace(/[<>:"|?*\/\\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 255);
}

export async function openGraphFolder(app: App, graphTitle: string, outputFolder: string): Promise<void> {
  const folderPath = normalizePath(
    `${outputFolder}/${sanitizeFolderName(graphTitle)}`
  );

  const folder = app.vault.getAbstractFileByPath(folderPath);
  if (folder && folder instanceof TFolder) {
    // Open folder in sidebar (Obsidian's built-in navigation)
    // Note: In Phase 1, we'll just log; Phase 2 can improve this
    logger.log(`Graph folder ready: ${folderPath}`);
  }
}
