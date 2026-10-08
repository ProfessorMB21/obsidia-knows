import crypto from 'crypto';
import { NodeType } from '../types';

export function generateNodeId(title: string, type: NodeType): string {
  // Create a deterministic ID from title + type hash
  const input = `${title}-${type}`;
  const hash = crypto.createHash('md5').update(input).digest('hex');
  return hash.substring(0, 12); // Use first 12 chars for brevity
}

export function generateGraphId(): string {
  // Generate a unique ID for each graph
  return crypto.randomUUID();
}

export function generateTimestamp(): string {
  return new Date().toISOString();
}
