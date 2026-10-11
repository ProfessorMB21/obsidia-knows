export type NodeType = 'character' | 'event' | 'concept' | 'location' | 'timeline' | 'theme';
export type NodeDepth = 'main' | 'major' | 'minor';
export type RelationshipType = 'contains' | 'relates_to' | 'causes' | 'occurs_before' | 'conflicts_with';
export type VisualizationStyle = 'tree' | 'flowchart' | 'reading_order' | 'combo';
export type AnalysisDepth = 'quick' | 'deep';

export interface KnowledgeNode {
  id: string;
  title: string;
  type: NodeType;
  depth: NodeDepth;
  summary: string;
  content: {
    quotes?: string[];
    keyAttributes?: Record<string, string>;
    connections?: Array<{
      nodeId: string;
      reason: string;
    }>;
    tags?: string[];
    customFields?: Record<string, any>;
  };
  metadata: {
    sourceDocument: string;
    createdAt: string;
    parent?: string;
    children?: string[];
    siblings?: string[];
    depth?: number;
  };
}

export interface Relationship {
  from: string;
  to: string;
  type: RelationshipType;
}

export interface KnowledgeGraph {
  id: string;
  title: string;
  mainNode: KnowledgeNode;
  majorNodes: KnowledgeNode[];
  minorNodes: KnowledgeNode[];
  relationships: Relationship[];
  metadata: {
    sourceDocument: string;
    analysisTimestamp: string;
    depth: AnalysisDepth;
    selectedNodeTypes: NodeType[];
    visualizationStyle: VisualizationStyle;
  };
}

export interface AnalysisConfig {
  depth: AnalysisDepth;
  nodeTypes: NodeType[];
  chunkIndex?: number;
}

export interface AnalysisResult {
  mainNode: KnowledgeNode;
  majorNodes: KnowledgeNode[];
  minorNodes: KnowledgeNode[];
  relationships: Relationship[];
}

export interface LLMProvider {
  name: string;
  isAvailable(): boolean;
  analyze(document: string, config: AnalysisConfig): Promise<AnalysisResult>;
}

export interface KnowledgeGraphSettings {
  apiProvider: 'claude' | 'deepseek' | 'openrouter' | 'omniroute' | 'gpt' | 'local';
  claudeApiKey: string;
  deepseekApiKey: string;
  openrouterApiKey: string;
  openrouterModel: string;
  omnirouteApiKey: string;
  omnirouteModel: string;
  gptApiKey?: string;
  defaultDepth: AnalysisDepth;
  defaultNodeTypes: NodeType[];
  defaultVisualizationStyle: VisualizationStyle;
  outputFolderTemplate: string;
  chunkSize: number;
  maxTokensPerRequest: number;
  enableCheckpointing: boolean;
}

export interface CheckpointData {
  graphId: string;
  chunkIndex: number;
  analysisResult: AnalysisResult;
  timestamp: string;
  cumulativeNodes: {
    major: KnowledgeNode[];
    minor: KnowledgeNode[];
  };
}
