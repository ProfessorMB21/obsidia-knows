import { buildGraphFromAnalysis } from '../../src/graph/graphGenerator';
import { formatGraphOutput } from '../../src/output/outputFormatter';
import { validateTextInput } from '../../src/input/inputHandler';
import { AnalysisResult, AnalysisConfig } from '../../src/types';

// Mock LLM provider
class MockLLMProvider {
  name = 'Mock';

  isAvailable() {
    return true;
  }

  async analyze(): Promise<AnalysisResult> {
    return {
      mainNode: {
        id: 'main-1',
        title: 'Test Document',
        type: 'concept',
        depth: 'main',
        summary: 'A test document about heroes',
        content: {},
        metadata: {
          sourceDocument: 'Test Doc',
          createdAt: new Date().toISOString(),
        },
      },
      majorNodes: [
        {
          id: 'char-1',
          title: 'Hero',
          type: 'character',
          depth: 'major',
          summary: 'The main hero of the story',
          content: {
            quotes: ['Here is a heroic quote'],
            keyAttributes: { role: 'Protagonist', status: 'Alive' },
          },
          metadata: {
            sourceDocument: 'Test Doc',
            createdAt: new Date().toISOString(),
          },
        },
      ],
      minorNodes: [
        {
          id: 'detail-1',
          title: 'Hero Background',
          type: 'concept',
          depth: 'minor',
          summary: 'Hero is from a farm',
          content: {},
          metadata: {
            sourceDocument: 'Test Doc',
            createdAt: new Date().toISOString(),
            parent: 'char-1',
          },
        },
      ],
      relationships: [
        { from: 'main-1', to: 'char-1', type: 'contains' },
        { from: 'char-1', to: 'detail-1', type: 'contains' },
      ],
    };
  }
}

describe('End-to-End Flow', () => {
  test('input validation -> formatting -> output', async () => {
    // Step 1: Validate input
    const document = `
# The Hero's Journey

Once upon a time, there was a hero who lived on a farm.
The hero was destined for greatness.
`;

    const validation = validateTextInput(document);
    expect(validation.valid).toBe(true);
    expect(validation.wordCount).toBeGreaterThan(0);
    expect(validation.title).toBe("The Hero's Journey");

    // Step 2: Mock LLM analysis
    const config: AnalysisConfig = {
      depth: 'quick',
      nodeTypes: ['character', 'concept'],
    };

    const provider = new MockLLMProvider();
    const mockResult = await provider.analyze(validation.text!, config);

    // Step 3: Build graph
    const graph = buildGraphFromAnalysis(mockResult, 'test-graph', validation.title!, config);
    expect(graph.id).toBe('test-graph');
    expect(graph.majorNodes.length).toBe(1);
    expect(graph.minorNodes.length).toBe(1);

    // Step 4: Format output
    const { nodeFiles, errors } = formatGraphOutput(graph);
    expect(errors.length).toBe(0);
    expect(nodeFiles.size).toBeGreaterThan(0);

    // Verify markdown content
    const mainFile = Array.from(nodeFiles.values()).find((v) => v.includes("The Hero's Journey"));
    expect(mainFile).toBeDefined();
    expect(mainFile).toContain('---'); // YAML frontmatter
    expect(mainFile).toContain('title:');
  });

  test('handles large document gracefully', () => {
    const largeDoc = 'This is a paragraph.\n\n'.repeat(1000);
    const validation = validateTextInput(largeDoc);

    expect(validation.valid).toBe(true);
    expect(validation.wordCount).toBeGreaterThan(2000);
  });

  test('rejects oversized document', () => {
    const hugeDoc = 'a'.repeat(11 * 1024 * 1024);
    const validation = validateTextInput(hugeDoc);

    expect(validation.valid).toBe(false);
    expect(validation.error).toContain('exceeds 10MB');
  });
});
