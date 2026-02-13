# Logger Usage

The `azure-test-track` now has a configurable logging system that is **silent by default**.

## Usage Modes

### 1. Default Mode (Production)
By default, **info**, **warnings** and **errors** are displayed:

```bash
node your-script.js
```

**Typical output:**
```
[azure-test-track] Test points data retrieved with success. Test points found: 42
[azure-test-track] Test Run created with success. Test Run ID: 999
[azure-test-track] Warning: The following test case IDs were not found...
[azure-test-track] Test Run results updated successfully! Updated 42 test case(s).
```

### 2. Debug Mode (Verbose)
To see **all logs** (debug, info, warn, error):

```powershell
# PowerShell
$env:DEBUG='true'
node your-script.js

# Or in one line
$env:DEBUG='true'; node your-script.js
```

**Typical output:**
```
[azure-test-track] Fetching plan ID for plan with name: E2E Tests
[azure-test-track:debug] Plan found: E2E Tests with ID 789
[azure-test-track:debug] Total suites found in plan with ID 789: 5
[azure-test-track] Test Run created with success. Test Run ID: 999
[azure-test-track:warn] Build ID not found in environment variables...
[azure-test-track] Test Run results updated successfully! Updated 42 test case(s).
```

### 3. Custom Logger
You can inject your own logger (Winston, Pino, etc):

```javascript
const logger = require('@thecollege/azure-test-track/lib/logger');
const winston = require('winston');

// Configure your logger
const myLogger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'azure-test-track.log' })
  ]
});

// Inject into azure-test-track
logger.setLogger(myLogger);

// Now all logs will go to your logger
const { createTestRunByExecution } = require('@thecollege/azure-test-track');
await createTestRunByExecution(testSettings);
```

## Log Levels

| Method | When It Appears | Example |
|--------|-----------------|---------|  
| `debug` | Only with DEBUG=true | Internal details, resource IDs, payloads |
| `info` | Always | Main operations successfully completed |
| `warn` | Always | Warnings, test cases not found |
| `error` | Always | Critical errors that prevent execution |

## Disable DEBUG

```powershell
# PowerShell
Remove-Item Env:\DEBUG
```

## In CI/CD

### GitHub Actions
```yaml
# Without logs (default)
- run: npm test

# With full logs
- run: npm test
  env:
    DEBUG: true
```

### Azure Pipelines
```yaml
# Without logs (default)
- script: npm test

# With full logs
- script: npm test
  env:
    DEBUG: true
```

## Tests

Run the included test scripts:

```powershell
# Basic test
node test-logger.js
$env:DEBUG='true'; node test-logger.js

# Realistic test
node test-logger-real.js
$env:DEBUG='true'; node test-logger-real.js
```
