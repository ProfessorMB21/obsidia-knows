export class Logger {
  private prefix = '[ObsidiaKnows]';

  log(message: string, ...args: any[]): void {
    console.log(`${this.prefix} ${message}`, ...args);
  }

  warn(message: string, ...args: any[]): void {
    console.warn(`${this.prefix} ${message}`, ...args);
  }

  error(message: string, ...args: any[]): void {
    console.error(`${this.prefix} ${message}`, ...args);
  }

  debug(message: string, ...args: any[]): void {
    console.debug(`${this.prefix} ${message}`, ...args);
  }
}

export const logger = new Logger();
