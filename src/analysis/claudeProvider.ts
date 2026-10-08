import Anthropic from '@anthropic-ai/sdk';
import { BaseLLMProvider } from './llmProvider';
import { AnalysisConfig, AnalysisResult } from '../types';
import { generateAnalysisPrompt } from './analysisPrompt';
import { logger } from '../utils/logger';

export class ClaudeProvider extends BaseLLMProvider {
  name = 'Claude (Anthropic)';
  private client: Anthropic;

  constructor(apiKey: string) {
    super();
    this.client = new Anthropic({
      apiKey: apiKey,
    });
  }

  isAvailable(): boolean {
    return Boolean(this.client);
  }

  async analyze(document: string, config: AnalysisConfig): Promise<AnalysisResult> {
    const prompt = generateAnalysisPrompt(document, config);

    logger.log(`Calling Claude API for analysis (chunk ${config.chunkIndex || 0})`);

    const message = await this.client.messages.create({
      model: 'claude-opus-4-1',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText = message.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as any).text)
      .join('');

    logger.debug(`Raw Claude response: ${responseText.substring(0, 200)}...`);

    const result = this.parseResponse(responseText);
    return result;
  }

  private parseResponse(responseText: string): AnalysisResult {
    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = responseText;

    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    try {
      const parsed = JSON.parse(jsonStr);

      // Validate structure
      if (!parsed.mainNode || !Array.isArray(parsed.majorNodes) || !Array.isArray(parsed.minorNodes)) {
        throw new Error('Invalid response structure: missing mainNode, majorNodes, or minorNodes');
      }

      return {
        mainNode: parsed.mainNode,
        majorNodes: parsed.majorNodes,
        minorNodes: parsed.minorNodes,
        relationships: parsed.relationships || [],
      };
    } catch (error) {
      logger.error('Failed to parse Claude response as JSON', error);
      throw new Error(`Failed to parse LLM response: ${(error as Error).message}`);
    }
  }
}
