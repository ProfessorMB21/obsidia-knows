import { App, PluginSettingTab, Setting } from 'obsidian';
import { KnowledgeGraphSettings, NodeType } from './types';

const DEFAULT_SETTINGS: KnowledgeGraphSettings = {
  apiProvider: 'claude',
  claudeApiKey: '',
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

    new Setting(containerEl)
      .setName('API Provider')
      .setDesc('Choose which LLM API to use')
      .addDropdown((dropdown) =>
        dropdown
          .addOption('claude', 'Claude (Anthropic)')
          .addOption('gpt', 'GPT (OpenAI) - Coming Soon')
          .addOption('local', 'Local LLM - Coming Soon')
          .setValue(this.plugin.settings.data.apiProvider)
          .onChange(async (value) => {
            this.plugin.settings.data.apiProvider = value as any;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Claude API Key')
      .setDesc('Enter your Anthropic API key (stored locally)')
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

    new Setting(containerEl)
      .setName('Test Connection')
      .setDesc('Verify API key is valid')
      .addButton((button) =>
        button
          .setButtonText('Test')
          .onClick(async () => {
            button.setDisabled(true);
            button.setButtonText('Testing...');
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
