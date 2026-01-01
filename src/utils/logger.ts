type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'success';

interface LoggerConfig {
  level: LogLevel;
  enableColors: boolean;
  enableTimestamp: boolean;
}

class Logger {
  private config: LoggerConfig;
  private levelPriority: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    success: 1
  };

  constructor(config?: Partial<LoggerConfig>) {
    this.config = {
      level: config?.level || 'info',
      enableColors: config?.enableColors ?? true,
      enableTimestamp: config?.enableTimestamp ?? true,
      ...config
    };
  }

  private shouldLog(level: LogLevel): boolean {
    return this.levelPriority[level] >= this.levelPriority[this.config.level];
  }

  private formatMessage(level: LogLevel, message: string, ...args: unknown[]): string {
    const timestamp = this.config.enableTimestamp
      ? `[${new Date().toLocaleTimeString('vi-VN')}]`
      : '';

    const colors: Record<LogLevel, string> = {
      debug: '\x1b[36m',    // Cyan
      info: '\x1b[34m',     // Blue
      warn: '\x1b[33m',     // Yellow
      error: '\x1b[31m',    // Red
      success: '\x1b[32m'  // Green
    };

    const icons: Record<LogLevel, string> = {
      debug: '🔍',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
      success: '✅'
    };

    const reset = '\x1b[0m';
    const color = this.config.enableColors ? colors[level] : '';
    const icon = icons[level];
    const prefix = `${timestamp} ${icon} [${level.toUpperCase()}]`.trim();

    const formattedArgs = args.length > 0 ? ' ' + args.map(arg =>
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ') : '';

    return `${color}${prefix}${reset} ${message}${formattedArgs}`;
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', message, ...args));
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', message, ...args));
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, ...args));
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, ...args));
    }
  }

  success(message: string, ...args: unknown[]): void {
    if (this.shouldLog('success')) {
      console.log(this.formatMessage('success', message, ...args));
    }
  }

  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  setConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

export const logger = new Logger({
  level: (process.env.LOG_LEVEL as LogLevel) || 'info',
  enableColors: true,
  enableTimestamp: true
});

export { Logger };
export type { LogLevel, LoggerConfig };
