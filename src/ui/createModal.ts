import { App, Modal, Setting, Notice } from 'obsidian';
import { AnalysisConfig, NodeType } from '../types';

export interface ModalResult {
  canceled: boolean;
  document?: string;
  file?: File;
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

    // Document input section with tabs
    contentEl.createEl('h2', { text: 'Document Source' });

    let documentText = '';
    let selectedFile: File | null = null;
    let activeTab = 'paste'; // 'paste' or 'upload'

    // Tab buttons
    const tabContainer = contentEl.createDiv({
      attr: { style: 'display: flex; gap: 8px; margin-bottom: 12px; border-bottom: 1px solid #ccc;' },
    });

    const pasteTabBtn = tabContainer.createEl('button', {
      text: 'Paste Text',
      attr: {
        style: 'padding: 8px 16px; border: none; border-bottom: 2px solid #0ea5e9; background: transparent; cursor: pointer; font-weight: bold;',
      },
    });

    const uploadTabBtn = tabContainer.createEl('button', {
      text: 'Upload File',
      attr: {
        style: 'padding: 8px 16px; border: none; border-bottom: 2px solid transparent; background: transparent; cursor: pointer; color: #666;',
      },
    });

    // Paste tab content
    const pasteTabContent = contentEl.createDiv();
    const textArea = pasteTabContent.createEl('textarea', {
      attr: {
        placeholder: 'Paste your document here (max 10MB)...',
        style: 'width: 100%; height: 200px; padding: 8px; border: 1px solid #ccc; font-family: monospace;',
      },
    });

    textArea.addEventListener('change', (e) => {
      documentText = (e.target as HTMLTextAreaElement).value;
      selectedFile = null;
    });

    textArea.addEventListener('input', (e) => {
      documentText = (e.target as HTMLTextAreaElement).value;
      selectedFile = null;
    });

    // Upload tab content
    const uploadTabContent = contentEl.createDiv({
      attr: { style: 'display: none;' },
    });

    const dropZone = uploadTabContent.createDiv({
      attr: {
        style: 'border: 2px dashed #0ea5e9; border-radius: 8px; padding: 32px; text-align: center; background: #f0f9ff; cursor: pointer;',
      },
    });

    dropZone.createEl('p', { text: '📁 Drag and drop your file here' });
    dropZone.createEl('p', { text: 'or click to select', attr: { style: 'color: #666; font-size: 0.9em;' } });

    const fileInput = uploadTabContent.createEl('input', {
      attr: {
        type: 'file',
        accept: '.txt,.pdf,.docx,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        style: 'display: none;',
      },
    }) as HTMLInputElement;

    let fileStatusEl = uploadTabContent.createDiv({
      attr: { style: 'margin-top: 12px; padding: 8px; border-radius: 4px; display: none;' },
    });

    const updateFileStatus = (file: File | null, error: string | null = null) => {
      if (error) {
        fileStatusEl.setAttribute('style', 'margin-top: 12px; padding: 8px; border-radius: 4px; background: #fee2e2; color: #991b1b;');
        fileStatusEl.setText(`❌ ${error}`);
        fileStatusEl.style.display = 'block';
      } else if (file) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
        fileStatusEl.setAttribute('style', 'margin-top: 12px; padding: 8px; border-radius: 4px; background: #dcfce7; color: #166534;');
        fileStatusEl.setText(`✓ ${file.name} (${sizeMB}MB)`);
        fileStatusEl.style.display = 'block';
      } else {
        fileStatusEl.style.display = 'none';
      }
    };

    const handleFileSelect = (file: File) => {
      const MAX_SIZE = 10 * 1024 * 1024; // 10MB
      if (file.size > MAX_SIZE) {
        updateFileStatus(null, `File too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Max 10MB.`);
        return;
      }

      const supportedTypes = ['text/plain', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      const isSupportedByType = supportedTypes.includes(file.type);
      const isSupportedByName = /\.(txt|pdf|docx)$/i.test(file.name);

      if (!isSupportedByType && !isSupportedByName) {
        updateFileStatus(null, 'Unsupported file format. Use PDF, DOCX, or TXT.');
        return;
      }

      selectedFile = file;
      documentText = ''; // Clear text when file selected
      updateFileStatus(file);
    };

    dropZone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    });

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.style.background = '#e0f2fe';
    });

    dropZone.addEventListener('dragleave', () => {
      dropZone.style.background = '#f0f9ff';
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.style.background = '#f0f9ff';
      const file = e.dataTransfer?.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    });

    // Tab switching
    const switchTab = (tab: string) => {
      activeTab = tab;
      if (tab === 'paste') {
        pasteTabContent.style.display = 'block';
        uploadTabContent.style.display = 'none';
        pasteTabBtn.style.borderBottomColor = '#0ea5e9';
        pasteTabBtn.style.color = 'inherit';
        uploadTabBtn.style.borderBottomColor = 'transparent';
        uploadTabBtn.style.color = '#666';
      } else {
        pasteTabContent.style.display = 'none';
        uploadTabContent.style.display = 'block';
        pasteTabBtn.style.borderBottomColor = 'transparent';
        pasteTabBtn.style.color = '#666';
        uploadTabBtn.style.borderBottomColor = '#0ea5e9';
        uploadTabBtn.style.color = 'inherit';
      }
    };

    pasteTabBtn.addEventListener('click', () => switchTab('paste'));
    uploadTabBtn.addEventListener('click', () => switchTab('upload'));

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
        if (!documentText.trim() && !selectedFile) {
          new Notice('Please paste a document or upload a file');
          return;
        }

        config.nodeTypes = nodeTypes.filter((type) => nodeTypeCheckboxes[type]);

        this.result = {
          canceled: false,
          document: documentText || undefined,
          file: selectedFile || undefined,
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
