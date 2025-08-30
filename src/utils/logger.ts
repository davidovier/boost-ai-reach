/**
 * Production-safe logging utility
 * Removes console.log in production builds while keeping errors
 */

interface Logger {
  log: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
}

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger: Logger = {
  log: isDevelopment ? console.log : () => {},
  warn: isDevelopment ? console.warn : () => {},
  error: console.error, // Always keep errors for monitoring
  debug: isDevelopment ? console.debug : () => {},
  info: isDevelopment ? console.info : () => {},
};

// Development-only performance timing utility
export const perfLogger = {
  time: (label: string) => {
    if (isDevelopment) console.time(label);
  },
  timeEnd: (label: string) => {
    if (isDevelopment) console.timeEnd(label);
  },
  measure: <T>(label: string, fn: () => T): T => {
    if (isDevelopment) console.time(label);
    const result = fn();
    if (isDevelopment) console.timeEnd(label);
    return result;
  },
};

export default logger;