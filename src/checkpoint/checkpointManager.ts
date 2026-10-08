import { App, TFolder } from 'obsidian';
import { CheckpointData, AnalysisResult } from '../types';
import { normalizePath } from 'obsidian';
import { logger } from '../utils/logger';

const CHECKPOINT_FOLDER = '.obsidian/plugins/obsidiknows/checkpoints';

export async function saveCheckpoint(
  app: App,
  graphId: string,
  chunkIndex: number,
  analysisResult: AnalysisResult
): Promise<void> {
  try {
    // Ensure checkpoint folder exists
    const folder = normalizePath(CHECKPOINT_FOLDER);
    try {
      await app.vault.createFolder(folder);
    } catch {
      // Folder might exist, ignore
    }

    const checkpoint: CheckpointData = {
      graphId,
      chunkIndex,
      analysisResult,
      timestamp: new Date().toISOString(),
      cumulativeNodes: {
        major: analysisResult.majorNodes,
        minor: analysisResult.minorNodes,
      },
    };

    const filename = normalizePath(
      `${CHECKPOINT_FOLDER}/${graphId}-chunk-${chunkIndex}.json`
    );
    const content = JSON.stringify(checkpoint, null, 2);

    try {
      const file = app.vault.getAbstractFileByPath(filename);
      if (file) {
        await app.vault.modify(file as any, content);
      } else {
        await app.vault.create(filename, content);
      }
      logger.log(`Checkpoint saved: ${filename}`);
    } catch (error) {
      logger.warn(`Failed to save checkpoint: ${(error as Error).message}`);
    }
  } catch (error) {
    logger.error('Checkpoint save failed:', error);
  }
}

export async function loadLatestCheckpoint(
  app: App,
  graphId: string
): Promise<CheckpointData | null> {
  try {
    const folder = app.vault.getAbstractFileByPath(normalizePath(CHECKPOINT_FOLDER));
    if (!folder || !(folder instanceof TFolder)) {
      return null;
    }

    // Find all checkpoint files for this graph
    const checkpoints = folder.children
      .filter((file) => file.name.startsWith(graphId))
      .map((file) => {
        const match = file.name.match(/chunk-(\d+)/);
        return {
          file,
          chunkIndex: match ? parseInt(match[1]) : -1,
        };
      })
      .sort((a, b) => b.chunkIndex - a.chunkIndex);

    if (checkpoints.length === 0) {
      return null;
    }

    // Load the latest checkpoint
    const latestFile = checkpoints[0].file;
    const content = await app.vault.read(latestFile as any);
    const checkpoint = JSON.parse(content) as CheckpointData;

    logger.log(`Loaded checkpoint: ${latestFile.name}`);
    return checkpoint;
  } catch (error) {
    logger.error('Checkpoint load failed:', error);
    return null;
  }
}

export async function deleteCheckpoints(app: App, graphId: string): Promise<void> {
  try {
    const folder = app.vault.getAbstractFileByPath(normalizePath(CHECKPOINT_FOLDER));
    if (!folder || !(folder instanceof TFolder)) {
      return;
    }

    const toDelete = folder.children.filter((file) =>
      file.name.startsWith(graphId)
    );

    for (const file of toDelete) {
      await app.vault.delete(file);
      logger.log(`Deleted checkpoint: ${file.name}`);
    }
  } catch (error) {
    logger.error('Checkpoint delete failed:', error);
  }
}

export async function listIncompleteGraphs(app: App): Promise<string[]> {
  try {
    const folder = app.vault.getAbstractFileByPath(normalizePath(CHECKPOINT_FOLDER));
    if (!folder || !(folder instanceof TFolder)) {
      return [];
    }

    const graphIds = new Set<string>();
    folder.children.forEach((file) => {
      const match = file.name.match(/^(.+?)-chunk-/);
      if (match) {
        graphIds.add(match[1]);
      }
    });

    return Array.from(graphIds);
  } catch (error) {
    logger.error('List incomplete graphs failed:', error);
    return [];
  }
}
