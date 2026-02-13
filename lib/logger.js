let loggerInstance = null;

const defaultLogger = {
  debug: () => {},  
  info: (msg, ...args) => console.log('[azure-test-track]', msg, ...args),  
  warn: (msg, ...args) => console.warn('[azure-test-track]', msg, ...args),
  error: (msg, ...args) => console.error('[azure-test-track]', msg, ...args)
};

const createDebugLogger = () => ({
  debug: (msg, ...args) => console.log('[azure-test-track:debug]', msg, ...args),
  info: (msg, ...args) => console.log('[azure-test-track]', msg, ...args),
  warn: (msg, ...args) => console.warn('[azure-test-track:warn]', msg, ...args),
  error: (msg, ...args) => console.error('[azure-test-track:error]', msg, ...args)
});

const logger = new Proxy({}, {
  get: (target, prop) => {
    if (prop === 'setLogger') {
      return (customLogger) => {
        loggerInstance = customLogger;
      };
    }

    if (!loggerInstance) {
      const isDebugEnabled = process.env.DEBUG === 'true' || process.env.DEBUG === '1';
      loggerInstance = isDebugEnabled ? createDebugLogger() : defaultLogger;
    }

    return loggerInstance[prop];
  }
});

module.exports = logger;
