# Supported Test Result Formats

This document provides detailed examples of all supported test result formats for the `@thecollege/azure-test-track` package.

## JUnit XML Format

The package supports two methods for extracting Test Case IDs from JUnit XML files:

### Method 1: Test Case ID in Test Name (Traditional)

The Test Case ID is extracted from the test name using the pattern `TC_[ID]`.

```xml
<testsuites id="" name="" tests="1" failures="0" skipped="0" errors="0" time="28.007">
  <testsuite name="login.spec.ts" timestamp="2024-11-07T21:18:21.215Z" hostname="chromium" tests="1" failures="0" skipped="0" time="367.297" errors="0">
    <testcase name="TC_1234567 - User should be able to do login with success" classname="login.spec.ts" time="211.158">
    </testcase>
  </testsuite>
</testsuites>
```

**Usage:**
```javascript
const testSettings = {
    resultFilePath: './test-results/results.xml',
    planName: 'My Test Plan',
    testRunName: 'My Test Run',
    reportType: 'junit'
    // useTestInfo: false (default)
};
await createTestRunByExecution(testSettings);
```

### Method 2: Test Case ID in Properties (New in v1.5.0)

The Test Case ID is extracted from the `<properties>` section, allowing multiple Test Case IDs per test and separation from test naming.

```xml
<testsuites id="" name="" tests="1" failures="0" skipped="0" errors="0" time="28.007">
  <testsuite name="product-categories\product-categories.pw.ts" timestamp="2025-11-26T11:29:28.454Z" hostname="firefox-other" tests="1" failures="0" skipped="0" time="19.828" errors="0">
    <testcase name="Verify invocation of new endpoint to get products when accessing Product Categories page" classname="product-categories\product-categories.pw.ts" time="19.828">
      <properties>
        <property name="TestCaseId" value="2327280"/>
        <property name="TestCaseId" value="2611725"/>
      </properties>
      <system-out>
        <![CDATA[
        [[ATTACHMENT|trace.zip]]
        ]]>
      </system-out>
    </testcase>
  </testsuite>
</testsuites>
```

**Usage:**
```javascript
const testSettings = {
    resultFilePath: './test-results/results.xml',
    planName: 'My Test Plan',
    testRunName: 'My Test Run',
    reportType: 'junit',
    useTestInfo: true  // Enable property-based extraction
};
await createTestRunByExecution(testSettings);
```

**Playwright Example to Generate This Format:**

```javascript
import { test, expect } from '@playwright/test';

test('Verify Product Categories Page', async ({ page }, testInfo) => {
  // Attach one or multiple Azure DevOps Test Case IDs
  testInfo.annotations.push({ type: 'TestCaseId', description: '2327280' });
  testInfo.annotations.push({ type: 'TestCaseId', description: '2611725' });
  
  // Your test steps
  await page.goto('https://example.com/product-categories');
  await expect(page).toHaveTitle(/Product Categories/);
});
```

Configure your `playwright.config.js`:
```javascript
export default {
  reporter: [
    ['junit', { outputFile: 'test-results/results.xml' }]
  ],
  // ... other config
};
```

---

## Cucumber JSON Format

The Test Case ID is extracted from the scenario name using the pattern `TC_[ID]`.

```json
[
  {
    "description": "",
    "elements": [
      {
        "description": "",
        "id": "login;tc_1234567---user-should-be-able-to-do-login-with-success",
        "keyword": "Scenario",
        "line": 18,
        "name": "TC_1234567 - User should be able to do login with success",
        "steps": [
          {
            "arguments": [],
            "keyword": "Given ",
            "line": 19,
            "name": "I have into Login page",
            "match": {
              "location": "not available:0"
            },
            "result": {
              "status": "passed",
              "duration": 22406000000
            }
          },
          {
            "arguments": [],
            "keyword": "When ",
            "line": 20,
            "name": "I do login with valid credentials",
            "match": {
              "location": "not available:0"
            },
            "result": {
              "status": "passed",
              "duration": 135832000000
            }
          },
          {
            "arguments": [],
            "keyword": "Then ",
            "line": 27,
            "name": "I should be redirected to home successfully",
            "match": {
              "location": "not available:0"
            },
            "result": {
              "status": "passed",
              "duration": 235650000000
            }
          }
        ],
        "tags": [
          {
            "name": "@login",
            "line": 1
          }
        ],
        "type": "scenario"
      }
    ],
    "id": "login",
    "line": 2,
    "keyword": "Feature",
    "name": "Login",
    "tags": [
      {
        "name": "@login",
        "line": 1
      }
    ],
    "uri": "cypress\\e2e\\features\\login\\login.feature"
  }
]
```

**Usage:**
```javascript
const testSettings = {
    resultFilePath: './test-results/cucumber-report.json',
    planName: 'My Test Plan',
    testRunName: 'My Test Run',
    reportType: 'cucumber-json'
};
await createTestRunByExecution(testSettings);
```

---

## Playwright JSON Format

The package supports two methods for extracting Test Case IDs from Playwright JSON files:

### Method 1: Test Case ID in Test Title (Traditional)

The Test Case ID is extracted from the test title using the pattern `TC_[ID]`.

```json
{
  "config": {
    "configFile": "C:\\Users\\12345678\\myPortal\\playwright.config.ts",
    "rootDir": "C:/Users/12345678/myPortal/tests",
    "forbidOnly": false,
    "fullyParallel": true,
    "globalSetup": null,
    "globalTeardown": null,
    "globalTimeout": 0,
    "grep": {},
    "grepInvert": null,
    "maxFailures": 0,
    "metadata": {
      "actualWorkers": 5
    },
    "preserveOutput": "always",
    "reporter": [
      [
        "junit",
        {
          "outputFile": "test-results/results.xml"
        }
      ],
      [
        "html",
        {
          "open": "never"
        }
      ],
      [
        "json",
        {
          "outputFile": "test-results.json"
        }
      ]
    ],
    "reportSlowTests": {
      "max": 5,
      "threshold": 15000
    },
    "quiet": false,
    "projects": [
      {
        "outputDir": "C:/Users/12345678/Myportal/test-results",
        "repeatEach": 1,
        "retries": 0,
        "metadata": {},
        "id": "firefox",
        "name": "firefox",
        "testDir": "C:/Users/12345678/Myportal/test-results",
        "testIgnore": [],
        "testMatch": [
          "**/*.@(spec|test).?(c|m)[jt]s?(x)"
        ],
        "timeout": 2400000
      }
    ],
    "shard": null,
    "updateSnapshots": "missing",
    "version": "1.48.2",
    "workers": 5,
    "webServer": null
  },
  "suites": [
    {
      "title": "login.spec.ts",
      "file": "login.spec.ts",
      "column": 0,
      "line": 0,
      "specs": [
        {
          "title": "TC_12345678 - User should be able to do login with success",
          "ok": true,
          "tags": [],
          "tests": [
            {
              "timeout": 2400000,
              "annotations": [],
              "expectedStatus": "passed",
              "projectId": "firefox",
              "projectName": "firefox",
              "results": [
                {
                  "workerIndex": 0,
                  "status": "passed",
                  "duration": 28115,
                  "errors": [],
                  "stdout": [],
                  "stderr": [],
                  "retry": 0,
                  "startTime": "2024-11-26T14:03:00.516Z",
                  "attachments": []
                }
              ],
              "status": "expected"
            }
          ],
          "id": "8971264756764dffdgfdg565635t5f7b75e",
          "file": "login.spec.ts",
          "line": 48,
          "column": 5
        }
      ]
    },
    {
      "title": "password.spec.ts",
      "file": "password.spec.ts",
      "column": 0,
      "line": 0,
      "specs": [
        {
          "title": "TC_11223344 - User should be able to recovery password with success",
          "ok": true,
          "tags": [],
          "tests": [
            {
              "timeout": 2400000,
              "annotations": [],
              "expectedStatus": "passed",
              "projectId": "firefox",
              "projectName": "firefox",
              "results": [
                {
                  "workerIndex": 2,
                  "status": "passed",
                  "duration": 223373,
                  "errors": [],
                  "stdout": [],
                  "stderr": [],
                  "retry": 0,
                  "startTime": "2024-11-26T14:03:00.480Z",
                  "attachments": []
                }
              ],
              "status": "expected"
            }
          ],
          "id": "194a8db7bd1afdff3546asadsf20e1e7b0",
          "file": "password.spec.ts",
          "line": 46,
          "column": 5
        }
      ]
    }
  ],
  "errors": [],
  "stats": {
    "startTime": "2024-11-26T14:02:58.819Z",
    "duration": 1841878.181,
    "expected": 2,
    "skipped": 0,
    "unexpected": 0,
    "flaky": 0
  }
}
```

**Usage:**
```javascript
const testSettings = {
    resultFilePath: './test-results/results.json',
    planName: 'My Test Plan',
    testRunName: 'My Test Run',
    reportType: 'playwright-json'
    // useTestInfo: false (default)
};
await createTestRunByExecution(testSettings);
```

### Method 2: Test Case ID in Annotations (New in v1.5.0)

The Test Case ID is extracted from the `annotations` array, allowing multiple Test Case IDs per test and separation from test naming.

**Example with Annotations:**

```json
{
  "suites": [
    {
      "title": "product\\product.pw.ts",
      "file": "product/product.pw.ts",
      "specs": [
        {
          "title": "Verify invocation of new endpoint to get products",
          "ok": false,
          "tests": [
            {
              "timeout": 360000,
              "annotations": [
                {
                  "type": "TestCaseId",
                  "description": "123456"
                },
                {
                  "type": "TestCaseId",
                  "description": "654321"
                }
              ],
              "expectedStatus": "passed",
              "projectId": "firefox-other",
              "projectName": "firefox-other",
              "results": [
                {
                  "status": "failed",
                  "duration": 23051
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

**Usage:**
```javascript
const testSettings = {
    resultFilePath: './test-results/results.json',
    planName: 'My Test Plan',
    testRunName: 'My Test Run',
    reportType: 'playwright-json',
    useTestInfo: true  // Enable annotation-based extraction
};
await createTestRunByExecution(testSettings);
```

**Playwright Example to Generate This Format:**

```javascript
import { test, expect } from '@playwright/test';

test('Verify Product Categories Page', async ({ page }, testInfo) => {
  // Attach one or multiple Azure DevOps Test Case IDs
  testInfo.annotations.push({ type: 'TestCaseId', description: '123456' });
  testInfo.annotations.push({ type: 'TestCaseId', description: '654321' });
  
  // Your test steps
  await page.goto('https://example.com/product-categories');
  await expect(page).toHaveTitle(/Product Categories/);
});
```

Configure your `playwright.config.js`:
```javascript
export default {
  reporter: [
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  // ... other config
};
```

---

## Important Notes

- **Test Case ID Format**: For formats that extract from names/titles (traditional JUnit, Cucumber JSON, Playwright JSON), the test case ID from Azure DevOps must follow the format `TC_[ID_FROM_AZURE]`.
- **Property/Annotation-Based Format**: For JUnit XML (properties) and Playwright JSON (annotations) using the new v1.5.0 methods, you can use any test name and attach Test Case IDs via properties/annotations.
- **Multiple Test Cases**: Both property-based and annotation-based formats support multiple Test Case IDs per test, useful when one test validates multiple requirements.
- **Same Annotations, Multiple Formats**: When using Playwright's `test.info()`, annotations are automatically included in both JUnit XML (as properties) and Playwright JSON (as annotations), giving you flexibility in which format to use.

## Need Other Formats?

If you need support for a different test result format, please open an issue or create a pull request. We welcome contributions!
