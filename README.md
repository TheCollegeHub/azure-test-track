[![Tests and Publish](https://github.com/TheCollegeHub/azure-test-track/actions/workflows/tests-publish.yml/badge.svg)](https://github.com/TheCollegeHub/azure-test-track/actions/workflows/tests-publish.yml) [![npm version](https://badge.fury.io/js/@thecollege%2Fazure-test-track.svg)](https://badge.fury.io/js/@thecollege%2Fazure-test-track) ![Downloads](https://img.shields.io/npm/dw/@thecollege/azure-test-track)



<p align="center">
  <img src="https://github.com/TheCollegeHub/azure-test-track/blob/main/logo-azure-test-track.png" width="400" style="height: auto; display: block; margin: 0 auto;">
</p>


The `@thecollege/azure-test-track` package simplifies the integration with Azure DevOps for managing and updating test runs. It provides methods to create test runs, add test results, and retrieve test data, facilitating streamlined test tracking. 

In addition, you can associate automated tests with test cases in **Azure Test Plan**, populating the `Associated Automation` tab and automatically updating the `Automation Status` field.

If you need to create test cases from automated tests for a plan you created, you can do so as well.

See the [CHANGELOG](./CHANGELOG.md) or see some [CODE EXAMPLES](./examples/examples.js).

## Main Workflow for Test Results

The script automates the process of associating test results with Azure DevOps Test Plans and Test Runs. Here's the step-by-step workflow:

1. **Read Test Results**: 
   - The script first reads the test result file, typically in JUnit XML format (until at the moment). It extracts each test case's **ID** (in the format `TC_ID`), along with the **status** (whether it passed, failed).

2. **Create a Test Plan**:
   - Before running the automation, you need to create a **Test Plan** in Azure DevOps. This Test Plan will contain the tests you want to associate with the automation results.

3. **Search for Test Plan by ID**:
   - The script then searches for the Test Plan by its **name** (set in the environment variables or the `testSettings` object).

4. **Retrieve Test Points**:
   - After identifying the Test Plan, it retrieves the associated **Test Points** based on your test result. Test Points are individual test executions corresponding to each test case within the Test Plan. These points represent the actual execution of the test cases.

5. **Associate Build ID**:
   - The script attempts to associate the **Build ID** (i.e., the identifier of the pipeline that executed the tests) if the `BUILD_BUILDID` environment variable is available. This helps track which pipeline executed the tests.

6. **Create Test Run**:
   - A **Test Run** is created in Azure DevOps, associating the tests from your results to the Test Plan and Test Points. This step ensures that the executed tests are logged under the correct Test Plan in Azure DevOps.

7. **Update Test Run Results**:
   - The script updates the Test Run with the results of each individual test case, marking whether each test passed or failed based on the test results.

8. **Mark Test Run as Completed**:
   - Finally, the script marks the Test Run as **completed** in Azure DevOps, signaling that the automation process is finished.

This automation significantly streamlines the process of tracking test results and associating them with the relevant Test Plan and Test Runs in Azure DevOps.


# Supported Test Result Format
At the moment, this package supports JUnit XML, Cucumber-JSON and Playwright-JSON format for test results. The expected formats are as follows:

Junit Format
```xml 
<testsuite name="login.spec.ts" timestamp="2024-11-07T21:18:21.215Z" hostname="chromium" tests="1" failures="0" skipped="0" time="367.297" errors="0">
  <testcase name="TC_1234567 - User should be able to do login with success" classname="login.spec.ts" time="211.158">
  </testcase>
</testsuite>

```

Cucumber-JSON
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

Playwright-JSON
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

- `Test Case ID Format`: The test case ID from Azure DevOps must follow the format TC_[ID_FROM_AZURE] in your test result file. This ID will be used to link the results to the corresponding test case in Azure DevOps.

For any other result file format, please, contact me or contri

## Installation

To install the package, run:

```bash
npm install @thecollege/azure-test-track
```

# Requirements

## Environment Variables
Before using this package, ensure you have the following environment variables set in your environment:

`ADO_ORGANIZATION`: Your Azure DevOps organization name.

`ADO_PROJECT`: Your Azure DevOps project name.

`ADO_PERSONAL_ACCESS_TOKEN:` Your Azure DevOps personal access token with the necessary permissions.

`ADO_COMPANY_EMAIL:` Your Azure DevOps Email with the necessary permissions.


## Usage
- One of the main methods of this package is `createTestRunByExecution`, which allows you to create a test run and update results based on a provided test plan name and test result file.
- You can associated automated tests to your Azure Test Plan - TestCases using `associtedTestCaseToAutomation`. You can try to use the [Azure Test Track VSCode Extension](https://marketplace.visualstudio.com/items?itemName=araujosnathan.azure-test-track) also, if you want to associate manually when you are coding your tests.
- If you did'nt created test cases in your plan and want an easy way to create them from autotomated tests, you can use `createTestCasesInSuite.`

For more information, see the [CHANGELOG](./CHANGELOG.md).

## Example
Here's an example of how to use 
`createTestRunByExecution`:
```javascript
const { createTestRunByExecution } = require('@thecollege/azure-test-track');

const planName = process.env.TEST_PLAN_NAME || "YOUR PLAN NAME";
const testSettings = {
    resultFilePath: './test-results/results.xml',
    planName: planName,
    testRunName: "[Regression][Platform] E2E Automated Test Run",
    reportType: "junit" // For versions above 1.0.13 should have this property, you need to pass one of result formats available (junit, cucumber-json, playwright-json)
};

const reportTestResults = async () => {
    await createTestRunByExecution(testSettings);
};

reportTestResults();

```

## Method Details
`createTestRunByExecution`: Reads test results from a JUnit XML file and creates a new test run in Azure DevOps for a specified test plan. If the build ID is available as an environment variable (`BUILD_BUILDID`), it links the test run to that build ID.
Other Available Methods
This package also provides additional methods to support a variety of tasks in Azure DevOps test management. For example, you can retrieve all test points for a specific test plan using the getAllTestPointsByPlanName method.

Example
```javascript
const { getAllTestPointsByPlanName } = require('@thecollege/azure-test-track');

const testPlanName = "Your Test Plan Name";
const getTestPoints = async () => {
    const testPoints = await getAllTestPointsByPlanName(testPlanName);
    console.log("Test Points:", testPoints);
};

getTestPoints();
```

# Note
You can explore and utilize other methods provided in this package for various test management tasks, such as creating test runs without tests, resetting test points to active status, and retrieving test runs by build ID. Refer to the source code or documentation for detailed information on each method.


## Contributing and Other Result Formats

Currently, the package supports only JUnit XML format for test results. However, we are open to adding support for other formats in the future.

If you need support for a different test result format, or if you would like to contribute to this package, please feel free to reach out. You can open an issue or create a pull request to propose changes or additional formats.

### How to Contribute

1. Fork the repository.
2. Create a new branch for your feature or fix.
3. Make your changes.
4. Submit a pull request with a clear description of your changes.

We welcome any contributions to improve the package!

