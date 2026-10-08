import { KnowledgeNode, KnowledgeGraph } from '../types';

export function generateMarkdownForNode(node: KnowledgeNode, graph: KnowledgeGraph): string {
  // Generate YAML frontmatter
  const frontmatter = generateFrontmatter(node, graph);

  // Generate content
  const content = generateNodeContent(node, graph);

  return `${frontmatter}\n\n${content}`;
}

function generateFrontmatter(node: KnowledgeNode, graph: KnowledgeGraph): string {
  const metadata = node.metadata;
  const frontmatterLines = [
    '---',
    `title: ${escapeYaml(node.title)}`,
    `type: ${node.type}`,
    `depth: ${node.depth}`,
    `source: ${escapeYaml(graph.title)}`,
    `created: ${metadata.createdAt}`,
  ];

  if (metadata.parent) {
    frontmatterLines.push(`parent: ${escapeYaml(metadata.parent)}`);
  }

  if (metadata.children && metadata.children.length > 0) {
    frontmatterLines.push(`children: [${metadata.children.map(escapeYaml).join(', ')}]`);
  }

  if (node.content.tags && node.content.tags.length > 0) {
    frontmatterLines.push(`tags: [${node.content.tags.map(escapeYaml).join(', ')}]`);
  }

  frontmatterLines.push('---');

  return frontmatterLines.join('\n');
}

function generateNodeContent(node: KnowledgeNode, graph: KnowledgeGraph): string {
  const sections: string[] = [];

  // Title
  sections.push(`# ${node.title}`);
  sections.push('');

  // Summary
  sections.push('## Summary');
  sections.push(node.summary);
  sections.push('');

  // Type-specific attributes
  if (node.content.keyAttributes && Object.keys(node.content.keyAttributes).length > 0) {
    sections.push('## Attributes');
    Object.entries(node.content.keyAttributes).forEach(([key, value]) => {
      sections.push(`- **${key}:** ${value}`);
    });
    sections.push('');
  }

  // Quotes
  if (node.content.quotes && node.content.quotes.length > 0) {
    sections.push('## Key Quotes');
    node.content.quotes.forEach((quote) => {
      sections.push(`> ${quote}`);
      sections.push('');
    });
  }

  // Connections
  if (node.content.connections && node.content.connections.length > 0) {
    sections.push('## Related Nodes');
    node.content.connections.forEach((conn) => {
      const relatedNode = findNodeById(graph, conn.nodeId);
      if (relatedNode) {
        sections.push(`- [[${relatedNode.title}]] - ${conn.reason}`);
      }
    });
    sections.push('');
  }

  // Children (minor nodes)
  if (node.metadata.children && node.metadata.children.length > 0) {
    sections.push('## Details');
    node.metadata.children.forEach((childId) => {
      const childNode = findNodeById(graph, childId);
      if (childNode) {
        sections.push(`- [[${childNode.title}]]`);
      }
    });
    sections.push('');
  }

  // Parent link
  if (node.metadata.parent && node.depth !== 'main') {
    sections.push('## Related To');
    const parentNode = findNodeById(graph, node.metadata.parent);
    if (parentNode) {
      sections.push(`- [[${parentNode.title}]]`);
    }
    sections.push('');
  }

  return sections.join('\n');
}

function findNodeById(graph: KnowledgeGraph, nodeId: string): KnowledgeNode | undefined {
  if (graph.mainNode.id === nodeId) return graph.mainNode;
  const major = graph.majorNodes.find((n) => n.id === nodeId);
  if (major) return major;
  return graph.minorNodes.find((n) => n.id === nodeId);
}

function escapeYaml(value: string): string {
  if (value.includes(':') || value.includes('"') || value.includes("'")) {
    return `"${value.replace(/"/g, '\\"')}"`;
  }
  return value;
}
