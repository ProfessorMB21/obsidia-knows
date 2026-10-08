import { App, Modal, Setting, Notice } from 'obsidian';
import { AnalysisConfig, NodeType } from '../types';

export interface ModalResult {
  canceled: boolean;
  document?: string;
  config?: AnalysisConfig;
}

export class CreateGraphModal extends Modal {
  result: ModalResult = { canceled: true };
  onSubmit?: (result: ModalResult) => void;
  defaultConfig: AnalysisConfig;

  constructor(app: App, defaultConfig: AnalysisConfig) {
    super(app);
    this.defaultConfig = defaultConfig;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl('h1', { text: 'Create Knowledge Graph' });

    // Document input section
    contentEl.createEl('h2', { text: 'Document Source' });

    let documentText = '';
    const textArea = contentEl.createEl('textarea', {
      attr: {
        placeholder: 'Paste your document here...',
        style: 'width: 100%; height: 200px; padding: 8px; border: 1px solid #ccc;',
      },
    });

    textArea.addEventListener('change', (e) => {
      documentText = (e.target as HTMLTextAreaElement).value;
    });

    // Settings section
    contentEl.createEl('h2', { text: 'Analysis Settings' });

    const config: AnalysisConfig = { ...this.defaultConfig };

    new Setting(contentEl)
      .setName('Analysis Depth')
      .addDropdown((dropdown) =>
        dropdown
          .addOption('quick', 'Quick Overview')
          .addOption('deep', 'Deep Dive')
          .setValue(config.depth)
          .onChange((value) => {
            config.depth = value as any;
          })
      );

    new Setting(contentEl).setName('Node Types');
    const nodeTypeCheckboxes: Record<NodeType, boolean> = {} as any;
    const nodeTypes: NodeType[] = ['character', 'event', 'concept', 'location', 'timeline', 'theme'];

    nodeTypes.forEach((type) => {
      nodeTypeCheckboxes[type] = config.nodeTypes.includes(type);
      new Setting(contentEl)
        .setName(type.charAt(0).toUpperCase() + type.slice(1))
        .addToggle((toggle) =>
          toggle
            .setValue(nodeTypeCheckboxes[type])
            .onChange((value) => {
              nodeTypeCheckboxes[type] = value;
            })
        );
    });

    // Buttons
    contentEl.createEl('hr');
    const buttonContainer = contentEl.createDiv({
      attr: { style: 'display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px;' },
    });

    buttonContainer.createEl('button', { text: 'Cancel' }).addEventListener('click', () => {
      this.result.canceled = true;
      this.close();
    });

    buttonContainer
      .createEl('button', {
        text: 'Analyze',
        attr: { style: 'background: #0ea5e9; color: white; padding: 8px 16px; border-radius: 4px;' },
      })
      .addEventListener('click', () => {
        if (!documentText.trim()) {
          new Notice('Please enter a document');
          return;
        }

        config.nodeTypes = nodeTypes.filter((type) => nodeTypeCheckboxes[type]);

        this.result = {
          canceled: false,
          document: documentText,
          config,
        };

        this.onSubmit?.(this.result);
        this.close();
      });
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}

export function showCreateGraphModal(
  app: App,
  defaultConfig: AnalysisConfig,
  onSubmit: (result: ModalResult) => void
): void {
  const modal = new CreateGraphModal(app, defaultConfig);
  modal.onSubmit = onSubmit;
  modal.open();
}
