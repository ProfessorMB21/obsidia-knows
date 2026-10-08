import { formatGraphOutput } from '../../src/output/outputFormatter';
import { KnowledgeGraph } from '../../src/types';

describe('Output Formatter', () => {
  const mockGraph: KnowledgeGraph = {
    id: 'graph-1',
    title: 'Test Book',
    mainNode: {
      id: 'main-1',
      title: 'Test Book',
      type: 'concept',
      depth: 'main',
      summary: 'A great book about stuff',
      content: {},
      metadata: {
        sourceDocument: 'Test Book',
        createdAt: '2026-10-08T12:00:00Z',
      },
    },
    majorNodes: [
      {
        id: 'major-1',
        title: 'Hero',
        type: 'character',
        depth: 'major',
        summary: 'The main character',
        content: {
          quotes: ['Famous quote here'],
          keyAttributes: { role: 'Protagonist' },
        },
        metadata: {
          sourceDocument: 'Test Book',
          createdAt: '2026-10-08T12:00:00Z',
          children: ['minor-1'],
        },
      },
    ],
    minorNodes: [
      {
        id: 'minor-1',
        title: 'Hero Background',
        type: 'concept',
        depth: 'minor',
        summary: 'Hero comes from humble origins',
        content: {},
        metadata: {
          sourceDocument: 'Test Book',
          createdAt: '2026-10-08T12:00:00Z',
          parent: 'major-1',
        },
      },
    ],
    relationships: [
      { from: 'main-1', to: 'major-1', type: 'contains' },
    ],
    metadata: {
      sourceDocument: 'Test Book',
      analysisTimestamp: '2026-10-08T12:00:00Z',
      depth: 'quick',
      selectedNodeTypes: ['character', 'event', 'concept'],
      visualizationStyle: 'tree',
    },
  };

  test('formats graph to markdown files', () => {
    const output = formatGraphOutput(mockGraph);

    expect(output.nodeFiles.size).toBeGreaterThan(0);
    expect(output.errors.length).toBe(0);
  });

  test('creates main node file', () => {
    const output = formatGraphOutput(mockGraph);
    const mainFile = Array.from(output.nodeFiles.keys()).find((k) => k.startsWith('Main'));

    expect(mainFile).toBeDefined();
    const content = output.nodeFiles.get(mainFile!);
    expect(content).toContain('Test Book');
    expect(content).toContain('---');
  });

  test('includes frontmatter in output', () => {
    const output = formatGraphOutput(mockGraph);
    const content = Array.from(output.nodeFiles.values())[0];

    expect(content).toContain('---');
    expect(content).toContain('title:');
    expect(content).toContain('type:');
    expect(content).toContain('depth:');
  });
});
