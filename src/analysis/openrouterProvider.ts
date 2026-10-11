import { requestUrl } from 'obsidian';
import { BaseLLMProvider } from './llmProvider';
import { AnalysisConfig, AnalysisResult } from '../types';
import { generateAnalysisPrompt } from './analysisPrompt';
import { logger } from '../utils/logger';

export class OpenRouterProvider extends BaseLLMProvider {
  name = 'OpenRouter';
  private apiKey: string;
  private model: string;
  private apiEndpoint = 'https://openrouter.ai/api/v1/chat/completions';

  constructor(apiKey: string, model: string = 'openai/gpt-4-turbo') {
    super();
    this.apiKey = apiKey;
    this.model = model;
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey);
  }

  async analyze(document: string, config: AnalysisConfig): Promise<AnalysisResult> {
    const prompt = generateAnalysisPrompt(document, config);

    logger.log(`Calling OpenRouter API for analysis (chunk ${config.chunkIndex || 0})`);
    logger.log(`Using model: ${this.model}`);

    // Debug: log API key format (first/last chars only for security)
    const keyPreview = this.apiKey ? `${this.apiKey.substring(0, 7)}...${this.apiKey.substring(this.apiKey.length - 4)}` : 'MISSING';
    logger.log(`API key format: ${keyPreview} (length: ${this.apiKey?.length || 0})`);

    try {
      const response = await requestUrl({
        url: this.apiEndpoint,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': 'app://obsidian.md',
          'X-Title': 'ObsidiaKnows',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: 4096,
          temperature: 1,
        }),
      });

      if (response.status !== 200) {
        const errorText = response.text || JSON.stringify(response);
        logger.error(`OpenRouter API returned status ${response.status}: ${errorText}`);

        // Try to parse error response for better messaging
        let errorDetail = '';
        try {
          const errorData = JSON.parse(response.text);
          errorDetail = errorData.error?.message || errorData.message || '';
        } catch {
          errorDetail = errorText;
        }

        if (response.status === 401 || response.status === 403) {
          throw new Error(`OpenRouter: Unauthorized (403). Check your API key and account credits. Details: ${errorDetail}`);
        } else if (response.status === 429) {
          throw new Error('OpenRouter API rate limit exceeded. Please try again later.');
        } else if (response.status === 400) {
          throw new Error(`OpenRouter: Bad request (400). Model may not exist or be invalid. Tried: ${this.model}. Details: ${errorDetail}`);
        } else if (response.status >= 500) {
          throw new Error(`OpenRouter server error (${response.status}). Please try again later.`);
        } else {
          throw new Error(`OpenRouter API error (${response.status}): ${errorDetail || errorText}`);
        }
      }

      const responseData = JSON.parse(response.text);

      if (!responseData.choices || responseData.choices.length === 0) {
        throw new Error('OpenRouter API returned empty response');
      }

      const responseText = responseData.choices[0].message.content;

      logger.debug(`Raw OpenRouter response: ${responseText.substring(0, 200)}...`);

      const result = this.parseResponse(responseText);
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(`OpenRouter API error: ${errorMsg}`, error);
      throw error instanceof Error ? error : new Error(`OpenRouter API error: ${errorMsg}`);
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
      logger.error('Failed to parse OpenRouter response as JSON', error);
      throw new Error(`Failed to parse LLM response: ${(error as Error).message}`);
    }
  }
}
