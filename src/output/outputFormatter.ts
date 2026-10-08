import { KnowledgeGraph, KnowledgeNode } from '../types';
import { generateMarkdownForNode } from './markdownGenerator';

export interface FormattedOutput {
  nodeFiles: Map<string, string>; // filename -> markdown content
  errors: string[];
}

export function formatGraphOutput(graph: KnowledgeGraph): FormattedOutput {
  const nodeFiles = new Map<string, string>();
  const errors: string[] = [];

  try {
    // Format main node
    const mainMarkdown = generateMarkdownForNode(graph.mainNode, graph);
    const mainFilename = `Main - ${graph.title}.md`;
    nodeFiles.set(mainFilename, mainMarkdown);

    // Format major nodes
    graph.majorNodes.forEach((node) => {
      try {
        const markdown = generateMarkdownForNode(node, graph);
        const filename = `${capitalize(node.type)} - ${node.title}.md`;
        nodeFiles.set(filename, markdown);
      } catch (error) {
        errors.push(`Failed to format major node "${node.title}": ${(error as Error).message}`);
      }
    });

    // Format minor nodes
    graph.minorNodes.forEach((node) => {
      try {
        const markdown = generateMarkdownForNode(node, graph);
        const filename = `${capitalize(node.type)} - ${node.title}.md`;
        nodeFiles.set(filename, markdown);
      } catch (error) {
        errors.push(`Failed to format minor node "${node.title}": ${(error as Error).message}`);
      }
    });
  } catch (error) {
    errors.push(`Critical error formatting graph: ${(error as Error).message}`);
  }

  return { nodeFiles, errors };
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
