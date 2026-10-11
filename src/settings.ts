import { App, PluginSettingTab, Setting, Notice } from 'obsidian';
import { KnowledgeGraphSettings, NodeType } from './types';
import { ClaudeProvider } from './analysis/claudeProvider';
import { DeepSeekProvider } from './analysis/deepseekProvider';
import { OpenRouterProvider } from './analysis/openrouterProvider';
import { OmniRouteProvider } from './analysis/omnirouteProvider';
import { logger } from './utils/logger';

const DEFAULT_SETTINGS: KnowledgeGraphSettings = {
  apiProvider: 'claude',
  claudeApiKey: '',
  deepseekApiKey: '',
  openrouterApiKey: '',
  openrouterModel: 'openai/gpt-4-turbo',
  omnirouteApiKey: '',
  omnirouteModel: 'gpt-4-turbo',
  gptApiKey: '',
  defaultDepth: 'quick',
  defaultNodeTypes: ['character', 'event', 'concept'],
  defaultVisualizationStyle: 'tree',
  outputFolderTemplate: 'Knowledge Graphs',
  chunkSize: 2000,
  maxTokensPerRequest: 4000,
  enableCheckpointing: true,
};

export class ObsidiaKnowsSettings {
  data: KnowledgeGraphSettings;

  constructor() {
    this.data = { ...DEFAULT_SETTINGS };
  }

  async load(data: any) {
    if (data) {
      this.data = Object.assign({}, DEFAULT_SETTINGS, data);
    }
  }

  async save(): Promise<KnowledgeGraphSettings> {
    return this.data;
  }

  reset() {
    this.data = { ...DEFAULT_SETTINGS };
  }
}

export class ObsidiaKnowsSettingTab extends PluginSettingTab {
  plugin: any;

  constructor(app: App, plugin: any) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    // LLM Provider Section
    containerEl.createEl('h2', { text: 'LLM Provider' });

    let apiKeyField: Setting;

    new Setting(containerEl)
      .setName('API Provider')
      .setDesc('Choose which LLM API to use')
      .addDropdown((dropdown) =>
        dropdown
          .addOption('claude', 'Claude (Anthropic)')
          .addOption('deepseek', 'DeepSeek')
          .addOption('openrouter', 'OpenRouter')
          .addOption('omniroute', 'OmniRoute')
          .addOption('gpt', 'GPT (OpenAI) - Coming Soon')
          .addOption('local', 'Local LLM - Coming Soon')
          .setValue(this.plugin.settings.data.apiProvider)
          .onChange(async (value) => {
            this.plugin.settings.data.apiProvider = value as any;
            await this.plugin.saveSettings();
            // Redisplay settings to update API key field
            this.display();
          })
      );

    // Dynamic API key field based on selected provider
    const provider = this.plugin.settings.data.apiProvider;

    if (provider === 'claude') {
      new Setting(containerEl)
        .setName('Claude API Key')
        .setDesc('Enter your Anthropic API key (stored locally). Get it from https://console.anthropic.com/account/keys')
        .addText((text) => {
          text
            .setPlaceholder('sk-ant-...')
            .setValue(this.plugin.settings.data.claudeApiKey)
            .onChange(async (value) => {
              this.plugin.settings.data.claudeApiKey = value;
              await this.plugin.saveSettings();
            });
          (text as any).inputEl.type = 'password';
          return text;
        });
    } else if (provider === 'deepseek') {
      new Setting(containerEl)
        .setName('DeepSeek API Key')
        .setDesc('Enter your DeepSeek API key (stored locally). Get it from https://platform.deepseek.com/api_keys')
        .addText((text) => {
          text
            .setPlaceholder('sk-...')
            .setValue(this.plugin.settings.data.deepseekApiKey)
            .onChange(async (value) => {
              this.plugin.settings.data.deepseekApiKey = value;
              await this.plugin.saveSettings();
            });
          (text as any).inputEl.type = 'password';
          return text;
        });
    } else if (provider === 'openrouter') {
      new Setting(containerEl)
        .setName('OpenRouter API Key')
        .setDesc('Enter your OpenRouter API key (stored locally). Get it from https://openrouter.ai/settings/keys')
        .addText((text) => {
          text
            .setPlaceholder('sk-or-...')
            .setValue(this.plugin.settings.data.openrouterApiKey)
            .onChange(async (value) => {
              this.plugin.settings.data.openrouterApiKey = value;
              await this.plugin.saveSettings();
            });
          (text as any).inputEl.type = 'password';
          return text;
        });

      new Setting(containerEl)
        .setName('OpenRouter Model')
        .setDesc('Choose which model to use. Popular options: openai/gpt-4-turbo, anthropic/claude-3-opus, mistralai/mistral-large')
        .addDropdown((dropdown) =>
          dropdown
            .addOption('openai/gpt-4-turbo', 'GPT-4 Turbo')
            .addOption('openai/gpt-4o', 'GPT-4o')
            .addOption('anthropic/claude-3-opus', 'Claude 3 Opus')
            .addOption('anthropic/claude-3-sonnet', 'Claude 3 Sonnet')
            .addOption('mistralai/mistral-large', 'Mistral Large')
            .addOption('meta-llama/llama-2-70b', 'Llama 2 70B')
            .setValue(this.plugin.settings.data.openrouterModel)
            .onChange(async (value) => {
              this.plugin.settings.data.openrouterModel = value;
              await this.plugin.saveSettings();
            })
        );
    } else if (provider === 'omniroute') {
      new Setting(containerEl)
        .setName('OmniRoute API Key')
        .setDesc('Enter your OmniRoute API key (stored locally). Get it from https://omniroute.ai/dashboard/api-keys')
        .addText((text) => {
          text
            .setPlaceholder('sk-om-...')
            .setValue(this.plugin.settings.data.omnirouteApiKey)
            .onChange(async (value) => {
              this.plugin.settings.data.omnirouteApiKey = value;
              await this.plugin.saveSettings();
            });
          (text as any).inputEl.type = 'password';
          return text;
        });

      new Setting(containerEl)
        .setName('OmniRoute Model')
        .setDesc('Choose which model to use. OmniRoute supports multiple providers.')
        .addDropdown((dropdown) =>
          dropdown
            .addOption('gpt-4-turbo', 'GPT-4 Turbo')
            .addOption('gpt-4o', 'GPT-4o')
            .addOption('claude-3-opus', 'Claude 3 Opus')
            .addOption('claude-3-sonnet', 'Claude 3 Sonnet')
            .addOption('claude-3-5-sonnet', 'Claude 3.5 Sonnet')
            .addOption('claude-4-sonnet', 'Claude 4 Sonnet')
            .addOption('claude-4-5-sonnet', 'Claude 4.5 Sonnet')
            .addOption('claude-haiku-4-5', 'Claude Haiku 4.5')
            .addOption('glm-5', 'GLM-5')
            .addOption('deepseek-3-2', 'DeepSeek 3.2')
            .addOption('mistral-large', 'Mistral Large')
            .addOption('llama-3-70b', 'Llama 3 70B')
            .addOption('gemini-pro', 'Gemini Pro')
            .setValue(this.plugin.settings.data.omnirouteModel)
            .onChange(async (value) => {
              this.plugin.settings.data.omnirouteModel = value;
              await this.plugin.saveSettings();
            })
        );
    } else if (provider === 'gpt') {
      new Setting(containerEl)
        .setName('OpenAI API Key')
        .setDesc('Enter your OpenAI API key (stored locally). Coming soon...')
        .addText((text) => {
          text
            .setPlaceholder('sk-...')
            .setValue(this.plugin.settings.data.gptApiKey || '')
            .onChange(async (value) => {
              this.plugin.settings.data.gptApiKey = value;
              await this.plugin.saveSettings();
            });
          (text as any).inputEl.type = 'password';
          text.setDisabled(true);
          return text;
        });
    }

    new Setting(containerEl)
      .setName('Test Connection')
      .setDesc('Verify API key is valid')
      .addButton((button) =>
        button
          .setButtonText('Test')
          .onClick(async () => {
            button.setDisabled(true);
            button.setButtonText('Testing...');

            try {
              const provider = this.plugin.settings.data.apiProvider;
              let testProvider;

              if (provider === 'claude') {
                const key = this.plugin.settings.data.claudeApiKey;
                if (!key) {
                  new Notice('❌ Claude API key is empty');
                  button.setDisabled(false);
                  button.setButtonText('Test');
                  return;
                }
                testProvider = new ClaudeProvider(key);
              } else if (provider === 'deepseek') {
                const key = this.plugin.settings.data.deepseekApiKey;
                if (!key) {
                  new Notice('❌ DeepSeek API key is empty');
                  button.setDisabled(false);
                  button.setButtonText('Test');
                  return;
                }
                testProvider = new DeepSeekProvider(key);
              } else if (provider === 'openrouter') {
                const key = this.plugin.settings.data.openrouterApiKey;
                if (!key) {
                  new Notice('❌ OpenRouter API key is empty');
                  button.setDisabled(false);
                  button.setButtonText('Test');
                  return;
                }
                testProvider = new OpenRouterProvider(key, this.plugin.settings.data.openrouterModel);
              } else if (provider === 'omniroute') {
                const key = this.plugin.settings.data.omnirouteApiKey;
                if (!key) {
                  new Notice('❌ OmniRoute API key is empty');
                  button.setDisabled(false);
                  button.setButtonText('Test');
                  return;
                }
                testProvider = new OmniRouteProvider(key, this.plugin.settings.data.omnirouteModel);
              } else {
                new Notice('❌ Provider not supported yet');
                button.setDisabled(false);
                button.setButtonText('Test');
                return;
              }

              // Test with a simple prompt
              const testPrompt = 'Return valid JSON: {"mainNode":{"id":"test","title":"Test","type":"concept","depth":"main","summary":"Test","content":{},"metadata":{"sourceDocument":"test","createdAt":"2026-10-10T00:00:00Z"}},"majorNodes":[],"minorNodes":[],"relationships":[]}';

              const result = await testProvider.analyze(testPrompt, {
                depth: 'quick',
                nodeTypes: ['concept'],
              });

              if (result && result.mainNode) {
                new Notice('✅ API connection successful!');
                logger.log('API test passed');
              } else {
                new Notice('❌ API returned invalid response');
              }
            } catch (error) {
              const errorMsg = error instanceof Error ? error.message : String(error);
              new Notice(`❌ Connection failed: ${errorMsg}`);
              logger.error('API test failed:', error);
            } finally {
              button.setDisabled(false);
              button.setButtonText('Test');
            }
          })
      );

    // Default Analysis Settings
    containerEl.createEl('h2', { text: 'Default Analysis Settings' });

    new Setting(containerEl)
      .setName('Analysis Depth')
      .setDesc('Quick overview (shallow) or Deep dive (comprehensive)')
      .addDropdown((dropdown) =>
        dropdown
          .addOption('quick', 'Quick Overview')
          .addOption('deep', 'Deep Dive')
          .setValue(this.plugin.settings.data.defaultDepth)
          .onChange(async (value) => {
            this.plugin.settings.data.defaultDepth = value as any;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Node Types')
      .setDesc('Which information types to extract');

    const nodeTypes: NodeType[] = ['character', 'event', 'concept', 'location', 'timeline', 'theme'];
    nodeTypes.forEach((type) => {
      new Setting(containerEl)
        .setName(type.charAt(0).toUpperCase() + type.slice(1))
        .addToggle((toggle) =>
          toggle
            .setValue(this.plugin.settings.data.defaultNodeTypes.includes(type))
            .onChange(async (value) => {
              if (value) {
                if (!this.plugin.settings.data.defaultNodeTypes.includes(type)) {
                  this.plugin.settings.data.defaultNodeTypes.push(type);
                }
              } else {
                this.plugin.settings.data.defaultNodeTypes = this.plugin.settings.data.defaultNodeTypes.filter(
                  (t: NodeType) => t !== type
                );
              }
              await this.plugin.saveSettings();
            })
        );
    });

    // Output & Storage
    containerEl.createEl('h2', { text: 'Output & Storage' });

    new Setting(containerEl)
      .setName('Output Folder')
      .setDesc('Where to create knowledge graph folders. Default: "Knowledge Graphs"')
      .addText((text) =>
        text
          .setValue(this.plugin.settings.data.outputFolderTemplate)
          .onChange(async (value) => {
            this.plugin.settings.data.outputFolderTemplate = value || 'Knowledge Graphs';
            await this.plugin.saveSettings();
          })
      );

    // Advanced
    containerEl.createEl('h2', { text: 'Advanced' });

    new Setting(containerEl)
      .setName('Document Chunk Size')
      .setDesc('Size of each document chunk in tokens (default: 2000)')
      .addText((text) =>
        text
          .setValue(String(this.plugin.settings.data.chunkSize))
          .onChange(async (value) => {
            const num = parseInt(value);
            if (!isNaN(num) && num > 0) {
              this.plugin.settings.data.chunkSize = num;
              await this.plugin.saveSettings();
            }
          })
      );

    new Setting(containerEl)
      .setName('Max Tokens Per Request')
      .setDesc('Maximum tokens per LLM request (default: 4000)')
      .addText((text) =>
        text
          .setValue(String(this.plugin.settings.data.maxTokensPerRequest))
          .onChange(async (value) => {
            const num = parseInt(value);
            if (!isNaN(num) && num > 0) {
              this.plugin.settings.data.maxTokensPerRequest = num;
              await this.plugin.saveSettings();
            }
          })
      );

    new Setting(containerEl)
      .setName('Enable Checkpointing')
      .setDesc('Save progress during analysis to resume on interruption')
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.data.enableCheckpointing)
          .onChange(async (value) => {
            this.plugin.settings.data.enableCheckpointing = value;
            await this.plugin.saveSettings();
          })
      );
  }
}
