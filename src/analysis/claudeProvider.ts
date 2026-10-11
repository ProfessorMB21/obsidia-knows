import { requestUrl } from 'obsidian';
import { BaseLLMProvider } from './llmProvider';
import { AnalysisConfig, AnalysisResult } from '../types';
import { generateAnalysisPrompt } from './analysisPrompt';
import { logger } from '../utils/logger';

export class ClaudeProvider extends BaseLLMProvider {
  name = 'Claude (Anthropic)';
  private apiKey: string;
  private apiEndpoint = 'https://api.anthropic.com/v1/messages';

  constructor(apiKey: string) {
    super();
    this.apiKey = apiKey;
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey);
  }

  async analyze(document: string, config: AnalysisConfig): Promise<AnalysisResult> {
    const prompt = generateAnalysisPrompt(document, config);

    logger.log(`Calling Claude API for analysis (chunk ${config.chunkIndex || 0})`);

    // Debug: log API key format (first/last chars only for security)
    const keyPreview = this.apiKey ? `${this.apiKey.substring(0, 7)}...${this.apiKey.substring(this.apiKey.length - 4)}` : 'MISSING';
    logger.log(`API key format: ${keyPreview} (length: ${this.apiKey?.length || 0})`);

    try {
      const response = await requestUrl({
        url: this.apiEndpoint,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 4096,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
      });

      if (response.status !== 200) {
        const errorText = response.text || JSON.stringify(response);
        logger.error(`Claude API returned status ${response.status}: ${errorText}`);

        if (response.status === 401 || response.status === 403) {
          throw new Error('Claude API key is invalid, expired, or lacks access. Check your settings and API key.');
        } else if (response.status === 429) {
          throw new Error('Claude API rate limit exceeded. Please try again later.');
        } else if (response.status >= 500) {
          throw new Error(`Claude API server error (${response.status}). Please try again later.`);
        } else {
          throw new Error(`Claude API error (${response.status}): ${errorText}`);
        }
      }

      const responseData = JSON.parse(response.text);

      if (!responseData.content || responseData.content.length === 0) {
        throw new Error('Claude API returned empty response');
      }

      const responseText = responseData.content
        .filter((block: any) => block.type === 'text')
        .map((block: any) => block.text)
        .join('');

      logger.debug(`Raw Claude response: ${responseText.substring(0, 200)}...`);

      const result = this.parseResponse(responseText);
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(`Claude API error: ${errorMsg}`, error);
      throw error instanceof Error ? error : new Error(`Claude API error: ${errorMsg}`);
    }
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
