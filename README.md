# @thecollege/azure-test-track


<div style="text-align: center; margin: 0; padding: 0;">
  <img src="./logo-azure-test-track.png" alt="Texto alternativo" width="500" style="height: auto; display: block; margin: 0 auto;">
</div>


The `@thecollege/azure-test-track` package simplifies the integration with Azure DevOps for managing and updating test runs. It provides methods to create test runs, add test results, and retrieve test data, facilitating streamlined test tracking.

## Main Workflow of the Script

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
At the moment, this package supports only JUnit XML format for test results. The expected format is as follows:
```xml
<testsuite name="login.spec.ts" timestamp="2024-11-07T21:18:21.215Z" hostname="chromium" tests="1" failures="0" skipped="0" time="367.297" errors="0">
  <testcase name="TC_1234567 - User should be able to do login with success" classname="login.spec.ts" time="211.158">
  </testcase>
</testsuite>

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

ADO_ORGANIZATION: Your Azure DevOps organization name.
ADO_PROJECT: Your Azure DevOps project name.
ADO_PERSONAL_ACCESS_TOKEN: Your Azure DevOps personal access token with the necessary permissions.

## Usage
One of the main methods of this package is createTestRunByExecution, which allows you to create a test run and update results based on a provided test plan name and test result file.

## Example
Here's an example of how to use 
`createTestRunByExecution`:
```
const { createTestRunByExecution } = require('@thecollege/azure-test-track');

const planName = process.env.TEST_PLAN_NAME || "YOUR PLAN NAME";
const testSettings = {
    resultFilePath: './test-results/results.xml',
    planName: planName,
    testRunName: "[Regression][Platform] E2E Automated Test Run"
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
```
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
