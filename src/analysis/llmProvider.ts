import { LLMProvider, AnalysisConfig, AnalysisResult } from '../types';

export abstract class BaseLLMProvider implements LLMProvider {
  abstract name: string;

  abstract isAvailable(): boolean;

  abstract analyze(document: string, config: AnalysisConfig): Promise<AnalysisResult>;
}
