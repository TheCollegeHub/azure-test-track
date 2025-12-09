[![Tests and Publish](https://github.com/TheCollegeHub/azure-test-track/actions/workflows/tests-publish.yml/badge.svg)](https://github.com/TheCollegeHub/azure-test-track/actions/workflows/tests-publish.yml) [![npm version](https://badge.fury.io/js/@thecollege%2Fazure-test-track.svg)](https://badge.fury.io/js/@thecollege%2Fazure-test-track) [![Downloads](https://img.shields.io/npm/dm/@thecollege/azure-test-track)](https://www.npmjs.com/package/@thecollege/azure-test-track)



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
   - The script reads the test result file (JUnit XML, Cucumber JSON, or Playwright JSON) and extracts each test case's **ID** along with the **status** (passed, failed, or skipped).
   - **Two methods are available for extracting Test Case IDs from JUnit XML:**
     - **Traditional Method (Name-Based)**: Extracts the Test Case ID from the test name using the pattern `TC_[ID]` (e.g., `TC_1234567 - User login test`)
     - **Property-Based Method (New in v1.5.0)**: Extracts the Test Case ID from the `<properties>` section of the XML, allowing you to use Playwright's `test.info()` annotations or attach multiple Test Case IDs to a single test. Set `useTestInfo: true` in your test settings to enable this method.

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


# Supported Test Result Formats

This package supports **JUnit XML**, **Cucumber JSON**, and **Playwright JSON** formats for test results.

**New in v1.5.0**: JUnit XML and Playwright JSON now support extracting Test Case IDs from properties/annotations (using Playwright's `test.info()`) in addition to the traditional name-based extraction.

For detailed format examples and usage instructions, see the **[Test Result Formats Documentation](./TEST_RESULT_FORMATS.md)**.

### Quick Overview

- **JUnit XML**: Extract Test Case ID from test name (`TC_[ID]`) OR from properties (new)
- **Cucumber JSON**: Extract Test Case ID from scenario name (`TC_[ID]`)
- **Playwright JSON**: Extract Test Case ID from test title (`TC_[ID]`) OR from annotations (new)

**Property/Annotation-Based Extraction Example (New in v1.5.0):**
```javascript
// In your Playwright test
test('Verify Product Categories', async ({ page }, testInfo) => {
  testInfo.annotations.push({ type: 'TestCaseId', description: '123456' });
  testInfo.annotations.push({ type: 'TestCaseId', description: '654321' });
  // ... test code
});

// Configure Playwright to generate both JUnit XML and JSON reports
// playwright.config.js
export default {
  reporter: [
    ['junit', { outputFile: 'test-results/results.xml' }],
    ['json', { outputFile: 'test-results/results.json' }]
  ]
};

// In your test execution - use either format
const testSettings = {
    reportType: 'junit',  // or 'playwright-json'
    resultFilePath: './test-results.xml',  // or './test-results.json'
    planName: 'My Test Plan',
    testRunName: 'My Test Run',
    useTestInfo: true  // Enable property/annotation-based extraction
};
```

For any other result file format, please contact us or contribute

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

Here are examples of how to use `createTestRunByExecution`:

### Traditional Method (Extract TestCaseId from Test Name)
```javascript
const { createTestRunByExecution } = require('@thecollege/azure-test-track');

const planName = process.env.TEST_PLAN_NAME || "YOUR PLAN NAME";
const testSettings = {
    resultFilePath: './test-results/results.xml',
    planName: planName,
    testRunName: "[Regression][Platform] E2E Automated Test Run",
    reportType: "junit" // Options: junit, cucumber-json, playwright-json
};

const reportTestResults = async () => {
    await createTestRunByExecution(testSettings);
};

reportTestResults();
```

### Property/Annotation-Based Method (New in v1.5.0)
```javascript
const { createTestRunByExecution } = require('@thecollege/azure-test-track');

const planName = process.env.TEST_PLAN_NAME || "YOUR PLAN NAME";

// Using JUnit XML with properties
const testSettingsXML = {
    resultFilePath: './test-results/results.xml',
    planName: planName,
    testRunName: "[Regression][Platform] E2E Automated Test Run",
    reportType: "junit",
    useTestInfo: true  // Enable property-based extraction from <properties>
};

// OR using Playwright JSON with annotations
const testSettingsJSON = {
    resultFilePath: './test-results/results.json',
    planName: planName,
    testRunName: "[Regression][Platform] E2E Automated Test Run",
    reportType: "playwright-json",
    useTestInfo: true  // Enable annotation-based extraction
};

const reportTestResults = async () => {
    await createTestRunByExecution(testSettingsXML);
    // or
    // await createTestRunByExecution(testSettingsJSON);
};

reportTestResults();
```

**When to use `useTestInfo: true`:**
- You're using Playwright's `test.info()` to attach Test Case IDs as annotations
- One test validates multiple Azure DevOps Test Cases
- You want to separate test naming from Test Case ID tracking
- Your test names are dynamic or don't follow the `TC_[ID]` pattern
- Works with both JUnit XML (properties) and Playwright JSON (annotations)

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

