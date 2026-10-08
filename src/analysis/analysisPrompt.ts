import { AnalysisConfig } from '../types';

export function generateAnalysisPrompt(
  document: string,
  config: AnalysisConfig
): string {
  const nodeTypesStr = config.nodeTypes.join(', ');
  const depthStr = config.depth === 'quick' ? 'QUICK' : 'DEEP';

  return `You are a knowledge extraction expert. Analyze the following document and extract a hierarchical knowledge graph.

Document:
---
${document}
---

Tasks:
1. Identify the MAIN concept/title (1-2 sentences summary of the entire document)
2. Extract MAJOR nodes (key topics, characters, events depending on node types):
   - For each: title, type, 1-2 sentence summary, key attributes, 1-2 relevant quotes
3. Extract MINOR nodes (specific details under major nodes):
   - For each: title, type, 1-sentence summary, how it relates to major nodes
4. Map relationships between major nodes

Node Types to Extract: ${nodeTypesStr}
Analysis Depth: ${depthStr}
${depthStr === 'QUICK' ? '(Extract only the most important concepts; limit 10-15 major nodes)' : '(Extract comprehensive concepts; aim for 20-40 major nodes)'}

Output as valid JSON with this structure (and ONLY JSON, no other text):
{
  "mainNode": {
    "id": "string (unique hash)",
    "title": "string",
    "type": "concept",
    "depth": "main",
    "summary": "string (2-3 sentences)",
    "content": {
      "quotes": ["string"],
      "tags": ["string"]
    },
    "metadata": {
      "sourceDocument": "string",
      "createdAt": "ISO timestamp"
    }
  },
  "majorNodes": [
    {
      "id": "string",
      "title": "string",
      "type": "character|event|concept|location|timeline|theme",
      "depth": "major",
      "summary": "string",
      "content": {
        "quotes": ["string"],
        "keyAttributes": {"key": "value"},
        "connections": [{"nodeId": "string", "reason": "string"}],
        "tags": ["string"]
      },
      "metadata": {
        "sourceDocument": "string",
        "createdAt": "ISO timestamp",
        "children": []
      }
    }
  ],
  "minorNodes": [
    {
      "id": "string",
      "title": "string",
      "type": "character|event|concept|location|timeline|theme",
      "depth": "minor",
      "summary": "string",
      "content": {
        "tags": ["string"]
      },
      "metadata": {
        "sourceDocument": "string",
        "createdAt": "ISO timestamp",
        "parent": "string (parent major node ID)"
      }
    }
  ],
  "relationships": [
    {
      "from": "string (node ID)",
      "to": "string (node ID)",
      "type": "contains|relates_to|causes|occurs_before|conflicts_with"
    }
  ]
}`;
}
