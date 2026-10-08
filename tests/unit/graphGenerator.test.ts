import { buildGraphFromAnalysis, validateGraphIntegrity } from '../../src/graph/graphGenerator';
import { AnalysisResult, AnalysisConfig } from '../../src/types';

describe('Graph Generator', () => {
  const mockAnalysisResult: AnalysisResult = {
    mainNode: {
      id: 'main-1',
      title: 'Test Document',
      type: 'concept',
      depth: 'main',
      summary: 'A test document summary',
      content: {},
      metadata: {
        sourceDocument: 'test',
        createdAt: new Date().toISOString(),
      },
    },
    majorNodes: [
      {
        id: 'major-1',
        title: 'Character A',
        type: 'character',
        depth: 'major',
        summary: 'A test character',
        content: {},
        metadata: {
          sourceDocument: 'test',
          createdAt: new Date().toISOString(),
        },
      },
    ],
    minorNodes: [
      {
        id: 'minor-1',
        title: 'Detail A',
        type: 'event',
        depth: 'minor',
        summary: 'A test detail',
        content: {},
        metadata: {
          sourceDocument: 'test',
          createdAt: new Date().toISOString(),
          parent: 'major-1',
        },
      },
    ],
    relationships: [
      { from: 'main-1', to: 'major-1', type: 'contains' },
      { from: 'major-1', to: 'minor-1', type: 'contains' },
    ],
  };

  const mockConfig: AnalysisConfig = {
    depth: 'quick',
    nodeTypes: ['character', 'event'],
  };

  test('builds graph from analysis result', () => {
    const graph = buildGraphFromAnalysis(mockAnalysisResult, 'graph-1', 'Test Doc', mockConfig);

    expect(graph.id).toBe('graph-1');
    expect(graph.mainNode.title).toBe('Test Document');
    expect(graph.majorNodes.length).toBe(1);
    expect(graph.minorNodes.length).toBe(1);
  });

  test('validates graph integrity passes for valid graph', () => {
    const graph = buildGraphFromAnalysis(mockAnalysisResult, 'graph-1', 'Test Doc', mockConfig);
    const validation = validateGraphIntegrity(graph);

    expect(validation.valid).toBe(true);
    expect(validation.errors.length).toBe(0);
  });

  test('validates graph integrity fails when main node missing', () => {
    const invalidResult: AnalysisResult = {
      ...mockAnalysisResult,
      mainNode: null as any,
    };

    const graph = buildGraphFromAnalysis(invalidResult, 'graph-1', 'Test Doc', mockConfig);
    const validation = validateGraphIntegrity(graph);

    expect(validation.valid).toBe(false);
    expect(validation.errors.some((e) => e.includes('Main node'))).toBe(true);
  });
});
