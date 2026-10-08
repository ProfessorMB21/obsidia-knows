import { AnalysisResult, KnowledgeGraph, KnowledgeNode, AnalysisConfig } from '../types';
import { generateTimestamp } from '../utils/idGenerator';
import { logger } from '../utils/logger';

export function buildGraphFromAnalysis(
  analysisResult: AnalysisResult,
  graphId: string,
  documentTitle: string,
  config: AnalysisConfig
): KnowledgeGraph {
  const { mainNode, majorNodes, minorNodes, relationships } = analysisResult;

  // Build hierarchy
  const allNodes = [mainNode, ...majorNodes, ...minorNodes];
  enrichNodeMetadata(allNodes, majorNodes, minorNodes);

  const graph: KnowledgeGraph = {
    id: graphId,
    title: documentTitle,
    mainNode,
    majorNodes,
    minorNodes,
    relationships,
    metadata: {
      sourceDocument: documentTitle,
      analysisTimestamp: generateTimestamp(),
      depth: config.depth,
      selectedNodeTypes: config.nodeTypes,
      visualizationStyle: 'tree', // Phase 1: only tree
    },
  };

  const validation = validateGraphIntegrity(graph);
  if (!validation.valid) {
    logger.warn(`Graph validation issues: ${validation.errors.join('; ')}`);
  }

  return graph;
}

function enrichNodeMetadata(allNodes: KnowledgeNode[], majorNodes: KnowledgeNode[], minorNodes: KnowledgeNode[]): void {
  // Set parent-child relationships
  minorNodes.forEach((minorNode) => {
    // Find parent major node
    if (minorNode.metadata.parent) {
      const parentNode = majorNodes.find((n) => n.id === minorNode.metadata.parent);
      if (parentNode) {
        if (!parentNode.metadata.children) {
          parentNode.metadata.children = [];
        }
        parentNode.metadata.children.push(minorNode.id);
      }
    }
  });

  // Set siblings
  majorNodes.forEach((majorNode) => {
    majorNode.metadata.siblings = majorNodes
      .filter((n) => n.id !== majorNode.id && n.type === majorNode.type)
      .map((n) => n.id);
  });

  minorNodes.forEach((minorNode) => {
    const siblings = minorNodes.filter(
      (n) => n.id !== minorNode.id && n.metadata.parent === minorNode.metadata.parent
    );
    minorNode.metadata.siblings = siblings.map((n) => n.id);
  });
}

export interface GraphValidation {
  valid: boolean;
  errors: string[];
}

export function validateGraphIntegrity(graph: KnowledgeGraph): GraphValidation {
  const errors: string[] = [];

  // Check: main node exists
  if (!graph.mainNode) {
    errors.push('Main node is missing');
  }

  // Check: major nodes exist
  if (!graph.majorNodes || graph.majorNodes.length === 0) {
    errors.push('No major nodes found');
  }

  // Check: all nodes are reachable from main
  const nodeIds = new Set([
    graph.mainNode?.id,
    ...graph.majorNodes.map((n) => n.id),
    ...graph.minorNodes.map((n) => n.id),
  ]);

  graph.relationships.forEach((rel) => {
    if (!nodeIds.has(rel.from)) {
      errors.push(`Relationship references unknown node: ${rel.from}`);
    }
    if (!nodeIds.has(rel.to)) {
      errors.push(`Relationship references unknown node: ${rel.to}`);
    }
  });

  // Check: no duplicate node IDs
  const allNodeIds = [
    graph.mainNode?.id,
    ...graph.majorNodes.map((n) => n.id),
    ...graph.minorNodes.map((n) => n.id),
  ];
  const uniqueIds = new Set(allNodeIds);
  if (uniqueIds.size !== allNodeIds.length) {
    errors.push('Duplicate node IDs detected');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
