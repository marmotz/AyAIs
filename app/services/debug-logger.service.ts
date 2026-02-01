import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

export class DebugLoggerService {
  private readonly debugPath: string;

  constructor() {
    this.debugPath = path.join(app.getPath('userData'), 'debugs');

    this.cleanOldLogs();
  }

  public cleanOldLogs(): void {
    try {
      if (!fs.existsSync(this.debugPath)) {
        return;
      }

      const files = fs.readdirSync(this.debugPath);
      const now = Date.now();
      const oneWeekMs = 7 * 24 * 60 * 60 * 1000;

      files.forEach((file) => {
        if (!this.isDebugLogFile(file)) {
          return;
        }

        const filePath = path.join(this.debugPath, file);
        const stats = fs.statSync(filePath);
        const fileAge = now - stats.mtimeMs;

        if (fileAge > oneWeekMs) {
          fs.unlinkSync(filePath);
        }
      });
    } catch (error) {
      console.error('Failed to clean old debug logs:', error);
    }
  }

  public log(message: string): void {
    try {
      this.ensureDebugDirectoryExists();

      const logPath = this.getLogFilePath();
      const timestamp = new Date().toISOString();
      const logEntry = `[${timestamp}] ${message}\n`;

      fs.appendFileSync(logPath, logEntry, 'utf8');
    } catch (error) {
      console.error('Failed to write debug log:', error);
    }
  }

  private ensureDebugDirectoryExists(): void {
    if (!fs.existsSync(this.debugPath)) {
      fs.mkdirSync(this.debugPath, { recursive: true });
    }
  }

  private getLogFilePath(): string {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const logFileName = `debug-${dateStr}.log`;

    return path.join(this.debugPath, logFileName);
  }

  private isDebugLogFile(file: string): boolean {
    return file.startsWith('debug-') && file.endsWith('.log');
  }
}
