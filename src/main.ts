import { Plugin, App, Notice } from 'obsidian';
import { ObsidiaKnowsSettings, ObsidiaKnowsSettingTab } from './settings';
import { showCreateGraphModal } from './ui/createModal';
import { showProgressNotification, showErrorNotification, showSuccessNotification, hideProgressNotification } from './ui/progressNotification';
import { validateTextInput } from './input/inputHandler';
import { ClaudeProvider } from './analysis/claudeProvider';
import { DeepSeekProvider } from './analysis/deepseekProvider';
import { OpenRouterProvider } from './analysis/openrouterProvider';
import { OmniRouteProvider } from './analysis/omnirouteProvider';
import { analyzeDocument } from './analysis/analysisEngine';
import { formatGraphOutput } from './output/outputFormatter';
import { createGraphInVault } from './vault/vaultIntegration';
import { logger } from './utils/logger';

export default class ObsidiaKnowsPlugin extends Plugin {
  settings: ObsidiaKnowsSettings = new ObsidiaKnowsSettings();

  async onload() {
    logger.log('Loading ObsidiaKnows plugin');

    // Load settings
    const data = await this.loadData();
    await this.settings.load(data);

    // Add settings tab
    this.addSettingTab(new ObsidiaKnowsSettingTab(this.app, this));

    // Register commands
    this.registerCommands();

    logger.log('ObsidiaKnows plugin loaded');
  }

  onunload() {
    logger.log('Unloading ObsidiaKnows plugin');
  }

  async saveSettings() {
    const data = await this.settings.save();
    await this.saveData(data);
  }

  private registerCommands() {
    // Create Knowledge Graph command
    this.addCommand({
      id: 'create',
      name: 'Create Knowledge Graph',
      callback: () => this.handleCreateCommand(),
    });

    // Open Latest Graph command (Phase 2)
    this.addCommand({
      id: 'open-latest',
      name: 'Open Latest Knowledge Graph',
      callback: () => {
        logger.log('Open latest command (Phase 2)');
      },
    });
  }

  private handleCreateCommand() {
    logger.log('Create Knowledge Graph command triggered');

    const defaultConfig = {
      depth: this.settings.data.defaultDepth,
      nodeTypes: this.settings.data.defaultNodeTypes,
    };

    showCreateGraphModal(this.app, defaultConfig, async (result) => {
      if (result.canceled) {
        logger.log('Create modal canceled');
        return;
      }

      try {
        // Validate input
        const validation = validateTextInput(result.document!);
        if (!validation.valid) {
          showErrorNotification(this.app, validation.error!);
          return;
        }

        logger.log(`Input validated: ${validation.wordCount} words`);

        // Get provider based on settings
        let provider;
        const apiProvider = this.settings.data.apiProvider;

        if (apiProvider === 'deepseek') {
          if (!this.settings.data.deepseekApiKey) {
            showErrorNotification(this.app, 'DeepSeek API key not configured. Check plugin settings.');
            return;
          }
          provider = new DeepSeekProvider(this.settings.data.deepseekApiKey);
        } else if (apiProvider === 'openrouter') {
          if (!this.settings.data.openrouterApiKey) {
            showErrorNotification(this.app, 'OpenRouter API key not configured. Check plugin settings.');
            return;
          }
          provider = new OpenRouterProvider(this.settings.data.openrouterApiKey, this.settings.data.openrouterModel);
        } else if (apiProvider === 'omniroute') {
          if (!this.settings.data.omnirouteApiKey) {
            showErrorNotification(this.app, 'OmniRoute API key not configured. Check plugin settings.');
            return;
          }
          provider = new OmniRouteProvider(this.settings.data.omnirouteApiKey, this.settings.data.omnirouteModel);
        } else if (apiProvider === 'claude') {
          if (!this.settings.data.claudeApiKey) {
            showErrorNotification(this.app, 'Claude API key not configured. Check plugin settings.');
            return;
          }
          provider = new ClaudeProvider(this.settings.data.claudeApiKey);
        } else {
          showErrorNotification(this.app, `API provider "${apiProvider}" not supported yet.`);
          return;
        }

        if (!provider.isAvailable()) {
          showErrorNotification(this.app, 'LLM provider is not available');
          return;
        }

        // Show progress
        showProgressNotification(this.app, 'Starting analysis...');

        // Analyze document
        const graph = await analyzeDocument(
          this.app,
          validation.text!,
          provider,
          result.config!,
          this.settings.data,
          validation.title!,
          {
            currentChunk: 0,
            totalChunks: 1,
            onProgress: (chunk, total) => {
              showProgressNotification(this.app, `Analyzing chunk ${chunk} of ${total}...`);
            },
          }
        );

        logger.log('Analysis complete, formatting output');

        // Format output
        const { nodeFiles, errors } = formatGraphOutput(graph);
        if (errors.length > 0) {
          logger.warn(`Formatting errors: ${errors.join('; ')}`);
        }

        // Create in vault
        await createGraphInVault(
          this.app,
          graph,
          nodeFiles,
          this.settings.data.outputFolderTemplate
        );

        hideProgressNotification();
        showSuccessNotification(
          this.app,
          `Knowledge graph created: ${validation.title!}`,
          5000
        );

        logger.log('Graph creation complete');
      } catch (error) {
        hideProgressNotification();
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.error('Graph creation failed:', error);
        showErrorNotification(this.app, errorMsg);
      }
    });
  }
}

