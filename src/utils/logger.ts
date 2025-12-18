/**
 * Logger utility med miljöbaserad filtrering
 *
 * I development: Alla loggar visas
 * I production: Endast warn och error visas
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerOptions {
  prefix?: string;
  enabled?: boolean;
}

const isDev = import.meta.env.DEV;

const LOG_COLORS: Record<LogLevel, string> = {
  debug: '#9CA3AF', // gray
  info: '#3B82F6',  // blue
  warn: '#F59E0B',  // amber
  error: '#EF4444', // red
};

class Logger {
  private prefix: string;
  private enabled: boolean;

  constructor(options: LoggerOptions = {}) {
    this.prefix = options.prefix || '';
    this.enabled = options.enabled ?? true;
  }

  private format(level: LogLevel, ...args: unknown[]): void {
    if (!this.enabled) return;

    // I production, visa endast warn och error
    if (!isDev && level !== 'warn' && level !== 'error') {
      return;
    }

    const timestamp = new Date().toLocaleTimeString('sv-SE');
    const prefixStr = this.prefix ? `[${this.prefix}]` : '';
    const color = LOG_COLORS[level];

    if (isDev) {
      // Färgad output i development
      console[level === 'debug' ? 'log' : level](
        `%c${timestamp} ${prefixStr}`,
        `color: ${color}; font-weight: bold;`,
        ...args
      );
    } else {
      // Enkel output i production
      console[level === 'debug' ? 'log' : level](
        `${timestamp} ${prefixStr}`,
        ...args
      );
    }
  }

  debug(...args: unknown[]): void {
    this.format('debug', ...args);
  }

  info(...args: unknown[]): void {
    this.format('info', ...args);
  }

  warn(...args: unknown[]): void {
    this.format('warn', ...args);
  }

  error(...args: unknown[]): void {
    this.format('error', ...args);
  }

  /**
   * Skapa en child-logger med prefix
   */
  child(prefix: string): Logger {
    const newPrefix = this.prefix ? `${this.prefix}:${prefix}` : prefix;
    return new Logger({ prefix: newPrefix, enabled: this.enabled });
  }
}

// Globala loggers för olika moduler
export const logger = new Logger();
export const appLogger = new Logger({ prefix: 'App' });
export const authLogger = new Logger({ prefix: 'Auth' });
export const aiLogger = new Logger({ prefix: 'AI' });
export const gameLogger = new Logger({ prefix: 'Game' });
export const studyLogger = new Logger({ prefix: 'Study' });
export const motionLogger = new Logger({ prefix: 'Motion' });

// Factory för att skapa custom loggers
export const createLogger = (prefix: string): Logger => {
  return new Logger({ prefix });
};

export default logger;
