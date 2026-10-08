import { App, Notice } from 'obsidian';

let currentNotice: Notice | null = null;

export function showProgressNotification(
  app: App,
  message: string,
  isError: boolean = false
): void {
  if (currentNotice) {
    currentNotice.hide();
  }

  currentNotice = new Notice(message, 0);
  if (isError) {
    (currentNotice as any).noticeEl.style.background = '#ef4444';
  }
}

export function updateProgressNotification(chunk: number, total: number): void {
  showProgressNotification(null as any, `Analyzing: chunk ${chunk} of ${total}...`);
}

export function showSuccessNotification(app: App, message: string, duration: number = 5000): void {
  const notice = new Notice(message, duration);
  (notice as any).noticeEl.style.background = '#10b981';
}

export function showErrorNotification(app: App, message: string): void {
  showProgressNotification(app, `Error: ${message}`, true);
}

export function hideProgressNotification(): void {
  if (currentNotice) {
    currentNotice.hide();
    currentNotice = null;
  }
}
