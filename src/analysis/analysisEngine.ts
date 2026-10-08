import { LLMProvider, AnalysisConfig, AnalysisResult, KnowledgeGraphSettings, KnowledgeGraph } from '../types';
import { chunkDocumentByTokens } from '../utils/tokenCounter';
import { logger } from '../utils/logger';
import { generateGraphId } from '../utils/idGenerator';
import { saveCheckpoint, loadLatestCheckpoint } from '../checkpoint/checkpointManager';
import { buildGraphFromAnalysis } from '../graph/graphGenerator';
import { App } from 'obsidian';

export interface AnalysisProgress {
  currentChunk: number;
  totalChunks: number;
  onProgress?: (chunk: number, total: number) => void;
}

export async function analyzeDocument(
  app: App,
  document: string,
  provider: LLMProvider,
  config: AnalysisConfig,
  settings: KnowledgeGraphSettings,
  documentTitle: string,
  progress?: AnalysisProgress
): Promise<KnowledgeGraph> {
  const graphId = generateGraphId();

  logger.log(`Starting analysis of "${documentTitle}"`);
  logger.log(`Using provider: ${provider.name}`);
  logger.log(`Settings: depth=${config.depth}, types=${config.nodeTypes.join(',')}`);

  if (!provider.isAvailable()) {
    throw new Error('LLM provider is not available. Check your API key in settings.');
  }

  // Split document into chunks
  const chunks = chunkDocumentByTokens(document, settings.chunkSize);
  logger.log(`Document split into ${chunks.length} chunks`);

  const cumulativeResults: AnalysisResult = {
    mainNode: null as any,
    majorNodes: [],
    minorNodes: [],
    relationships: [],
  };

  // Process each chunk
  for (let i = 0; i < chunks.length; i++) {
    logger.log(`Processing chunk ${i + 1}/${chunks.length}`);
    progress?.onProgress?.(i + 1, chunks.length);

    try {
      const chunkConfig: AnalysisConfig = { ...config, chunkIndex: i };
      const result = await provider.analyze(chunks[i], chunkConfig);

      // Merge results
      if (i === 0) {
        // First chunk provides the main node
        cumulativeResults.mainNode = result.mainNode;
      }
      cumulativeResults.majorNodes.push(...result.majorNodes);
      cumulativeResults.minorNodes.push(...result.minorNodes);
      cumulativeResults.relationships.push(...result.relationships);

      // Save checkpoint after successful chunk
      if (settings.enableCheckpointing) {
        await saveCheckpoint(app, graphId, i, result);
      }
    } catch (error) {
      logger.error(`Error processing chunk ${i + 1}:`, error);
      throw error;
    }
  }

  logger.log('Analysis complete. Building graph...');
  const graph = buildGraphFromAnalysis(cumulativeResults, graphId, documentTitle, config);

  logger.log(
    `Graph built: ${graph.majorNodes.length} major nodes, ${graph.minorNodes.length} minor nodes`
  );

  return graph;
}

export async function resumeAnalysis(
  app: App,
  graphId: string,
  provider: LLMProvider,
  settings: KnowledgeGraphSettings,
  documentTitle: string
): Promise<KnowledgeGraph | null> {
  logger.log(`Attempting to resume analysis for graph: ${graphId}`);

  const checkpoint = await loadLatestCheckpoint(app, graphId);
  if (!checkpoint) {
    logger.log('No checkpoint found');
    return null;
  }

  logger.log(
    `Resuming from chunk ${checkpoint.chunkIndex} at ${checkpoint.timestamp}`
  );

  // In Phase 1, we'll return the checkpoint data
  // Phase 2 will implement full resumption logic
  const graph = buildGraphFromAnalysis(
    checkpoint.analysisResult,
    graphId,
    documentTitle,
    {
      depth: 'quick',
      nodeTypes: [],
    }
  );

  return graph;
}
