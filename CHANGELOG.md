# CHANGE LOG

## Version 1.5.5

### Bug Fix: Multiple Test Points Per Test Case Now Update Correctly

Fixed a critical bug in `updateTestRunResults` where test cases with multiple test points (different configurations) were not being updated correctly.

#### The Problem

When a test case had multiple test points (e.g., different configurations like "Chrome", "Firefox", or environments like "STAGING", "PRODUCTION"), the previous implementation would:

❌ **Overwrite test points** - Only the last test point for each test case was kept in the mapping  
❌ **Leave test points as "In Progress"** - Other test points remained stuck in "In Progress" state in the Test Run  
❌ **Incomplete results** - Test results were only applied to one configuration, not all

**Example of the bug:**
```
Test Case ID 123 has:
  - Test Point 456 (Chrome)
  - Test Point 457 (Firefox)

Old behavior:
  - Only Test Point 457 (last one) was stored in the map
  - Update result for TC 123 → Only Firefox was updated
  - Chrome remained "In Progress" ❌
```

#### The Solution

The new implementation correctly handles multiple test points per test case:

✅ **Maps Test Case ID to Array of Test Points** - Preserves all test points for each test case  
✅ **Updates ALL configurations** - When you update a test case result, all its test points receive the same outcome  
✅ **Complete Test Run results** - No more stuck "In Progress" test points

**Example of the fix:**
```
Test Case ID 123 has:
  - Test Point 456 (Chrome)
  - Test Point 457 (Firefox)

New behavior:
  - Both test points are stored: TC 123 → [456, 457]
  - Update result for TC 123 with "Passed" → Both Chrome AND Firefox are updated to "Passed"
  - Complete and accurate results ✅
```
---

## Version 1.5.4

### New Features: Configurable Logger, Performance Optimization, and Configuration Filtering

This release introduces three major improvements: a configurable logging system, performance optimization through direct plan ID usage, and the ability to filter test points by configuration name(s).

#### 1. Configurable Logger System

Added a comprehensive logging system that is **visible by default** but can be enhanced with debug mode.

**Key Features:**
- **Default Mode**: Shows info, warnings, and errors for production use
- **Debug Mode**: Shows all logs including detailed debug information
- **Custom Logger Support**: Inject your own logger (Winston, Pino, etc.)
- **Zero Breaking Changes**: Existing code continues to work without modifications

**Usage:**

```javascript
// Default mode - info, warnings, and errors displayed
node your-script.js

// Debug mode - see all logs including debug details
// PowerShell
$env:DEBUG='true'; node your-script.js

// Bash
DEBUG=true node your-script.js
```

**Custom Logger Example:**
```javascript
const logger = require('@thecollege/azure-test-track/lib/logger');
const winston = require('winston');

const myLogger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.File({ filename: 'test-track.log' })]
});

logger.setLogger(myLogger);
```

**Log Levels:**
- `debug` - Only with DEBUG=true (internal details, payloads, IDs)
- `info` - Always (main operations, success messages)
- `warn` - Always (warnings, missing test cases)
- `error` - Always (critical errors)

#### 2. Performance Optimization: Direct planId Support

Added ability to pass `planId` directly instead of `planName`, **saving ~1 second per execution** by avoiding the plan lookup API call.

**Before (using planName):**
```javascript
await createTestRunByExecution({
    resultFilePath: './test-results.xml',
    planName: 'My Test Plan',  // Requires API call to get plan ID
    testRunName: 'Test Run',
    reportType: 'junit'
});
```

**After (using planId - Faster!):**
```javascript
await createTestRunByExecution({
    resultFilePath: './test-results.xml',
    planId: 789,  // Direct ID - no lookup needed!
    testRunName: 'Test Run',
    reportType: 'junit'
});
```

**Key Benefits:**
- **Faster execution** (time saved per run)
- **Backward compatible** - `planName` still works
- **Prioritizes planId** - if both provided, uses planId

#### 3. Configuration Filtering: Filter Test Points by Configuration Name

Added support for filtering test points by configuration name(s), enabling precise test result reporting for specific environments or browsers.

**Key Features:**
- **Single Configuration**: Pass a string for one configuration
- **Multiple Configurations**: Pass an array for multiple configurations
- **No Filter**: Omit parameter to report to all configurations (default)
- **Prevents Cross-Environment Issues**: Avoid marking wrong environments as tested

**Single Configuration Example:**
```javascript
await createTestRunByExecution({
    resultFilePath: './test-results.xml',
    planId: 789,
    configurationName: 'ENV: STAGING',  // Only STAGING test points
    testRunName: '[STAGING] Test Run',
    reportType: 'junit',
    useTestInfo: true
});
```

**Multiple Configurations Example:**
```javascript
await createTestRunByExecution({
    resultFilePath: './test-results.xml',
    planId: 789,
    configurationName: ['ENV: STAGING', 'ENV: PRODUCTION'],  // Array!
    testRunName: '[Multi-Env] Test Run',
    reportType: 'junit',
    useTestInfo: true
});
```

**Browser Filtering Example:**
```javascript
await createTestRunByExecution({
    resultFilePath: './test-results.xml',
    planId: 789,
    configurationName: ['Windows 11 | Chrome', 'Windows 11 | Firefox'],
    testRunName: '[Chrome+Firefox] Test Run',
    reportType: 'junit'
});
```

**Why This Matters:**

In Azure DevOps, a single test case can have multiple test points with different configurations (STAGING, PRODUCTION, Chrome, Firefox, etc.). Without filtering:
- ❌ Running tests in STAGING would update ALL configurations (STAGING, PRODUCTION, QA)
- ❌ Results would be inaccurate across environments

With configuration filtering:
- ✅ Reports only to the correct environment/browser
- ✅ Maintains accurate test results per configuration
- ✅ Easy to use with simple configuration names

**CI/CD Integration:**
```javascript
// GitHub Actions / Azure Pipelines
const envs = process.env.TEST_ENVIRONMENTS.split(',');

await createTestRunByExecution({
    resultFilePath: './test-results.xml',
    planId: parseInt(process.env.TEST_PLAN_ID),
    configurationName: envs.length === 1 ? envs[0] : envs,
    testRunName: `[${envs.join('+')}] CI Test Run`,
    reportType: 'junit',
    useTestInfo: true
});
```
---

## Version 1.5.0

### New Feature: Extract TestCaseId from Properties and Annotations

Added support for extracting Azure DevOps Test Case IDs directly from JUnit XML properties and Playwright JSON annotations, providing more flexibility in how test results are mapped to Azure DevOps test cases.

#### What's New

1. **New Method: `readAndProcessJUnitXMLUsingTestInfo`**

   This method extracts `TestCaseId` values from the `<properties>` section of each test case in the JUnit XML file, rather than parsing them from the test name.

   **Key Features:**
   - Extracts `TestCaseId` from `<property name="TestCaseId" value="123456">` elements
   - Supports multiple TestCaseId properties per test case
   - Returns a separate result object for each TestCaseId found
   - Maintains outcome determination (Passed/Failed/Skipped)

   **Usage Example:**
   ```javascript
   const { readAndProcessJUnitXMLUsingTestInfo } = require('azure-test-track');
   
   const results = await readAndProcessJUnitXMLUsingTestInfo('./test-results.xml');
   // Returns: [{ testCaseId: 2327280, outcome: "Passed" }, ...]
   ```

2. **New Method: `readAndProcessPlaywrightJSONUsingTestInfo`**

   This method extracts `TestCaseId` values from the `annotations` array in Playwright JSON results, rather than parsing them from the test title.

   **Key Features:**
   - Extracts `TestCaseId` from annotations with `type: 'TestCaseId'`
   - Supports multiple TestCaseId annotations per test
   - Returns a separate result object for each TestCaseId found
   - Maintains outcome determination (Passed/Failed)

   **Usage Example:**
   ```javascript
   const { readAndProcessPlaywrightJSONUsingTestInfo } = require('azure-test-track');
   
   const results = await readAndProcessPlaywrightJSONUsingTestInfo('./test-results.json');
   // Returns: [{ testCaseId: 2359356, outcome: "Failed" }, ...]
   ```

3. **Enhanced `createTestRunByExecution` with Backward Compatibility**

   The main test run creation method now supports both extraction methods for JUnit XML and Playwright JSON:
   
4. **Enhanced Validation and Error Handling**

   - **TestCaseId Validation**: When `useTestInfo: true` is set but no TestCaseIds are found in the results file, a helpful error is thrown with code examples showing how to add annotations correctly
   - **Plan Validation**: Validates that the specified test plan exists before attempting to create a test run, providing clear guidance when a plan is not found
   - **Robust Error Recovery**: Missing test case IDs are filtered out with warnings instead of causing crashes, allowing test runs to continue with valid results

   **Traditional Method (existing behavior):**
   ```javascript
   // JUnit XML - Extract from test name
   await createTestRunByExecution({
       reportType: 'junit',
       resultFilePath: './test-results.xml',
       planName: 'My Test Plan',
       testRunName: 'My Test Run'
   });

   // Playwright JSON - Extract from test title
   await createTestRunByExecution({
       reportType: 'playwright-json',
       resultFilePath: './test-results.json',
       planName: 'My Test Plan',
       testRunName: 'My Test Run'
   });
   ```

   **New Property/Annotation-Based Method:**
   ```javascript
   // JUnit XML - Extract from properties
   await createTestRunByExecution({
       reportType: 'junit',
       resultFilePath: './test-results.xml',
       planName: 'My Test Plan',
       testRunName: 'My Test Run',
       useTestInfo: true  // Enable property-based extraction
   });

   // Playwright JSON - Extract from annotations
   await createTestRunByExecution({
       reportType: 'playwright-json',
       resultFilePath: './test-results.json',
       planName: 'My Test Plan',
       testRunName: 'My Test Run',
       useTestInfo: true  // Enable annotation-based extraction
   });
   ```

4. **Improved Error Handling in `updateTestRunResults`**

   Enhanced error handling to gracefully skip test cases that don't exist in the test run:
   - Logs warning messages for missing test case IDs
   - Continues processing valid test cases
   - Provides summary of successfully updated results
   - Prevents crashes when test case IDs are not found in existing results

#### Use Cases

This feature is particularly useful when:
- Using Playwright's `test.info()` to attach Test Case IDs as annotations
- Multiple test cases share the same test scenario but map to different Azure DevOps test cases
- Test names are dynamic or don't follow a predictable pattern
- You want to separate test naming conventions from Azure DevOps test case tracking
- Working with both JUnit XML and Playwright JSON report formats

#### Playwright test.info() Example

You can use Playwright's `test.info()` to attach Azure DevOps Test Case IDs as annotations, which will be included in both JUnit XML and Playwright JSON reports:

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

Configure your `playwright.config.js` to generate both JUnit XML and/or JSON reports:

```javascript
export default {
  reporter: [
    ['junit', { outputFile: 'test-results/results.xml' }],  // For JUnit XML
    ['json', { outputFile: 'test-results/results.json' }]   // For Playwright JSON
  ],
  // ... other config
};
```

The annotations will be included in both report formats:
- **JUnit XML**: As `<property>` elements that can be extracted using `readAndProcessJUnitXMLUsingTestInfo`
- **Playwright JSON**: As annotation objects that can be extracted using `readAndProcessPlaywrightJSONUsingTestInfo`

#### Report Format Examples

**JUnit XML Format:**

```xml
<testcase name="Verify Product Categories Page" classname="product-categories.spec">
  <properties>
    <property name="TestCaseId" value="2327280"/>
    <property name="TestCaseId" value="2611725"/>
  </properties>
</testcase>
```

**Playwright JSON Format:**

```json
{
  "title": "Verify Product Categories Page",
  "tests": [
    {
      "annotations": [
        { "type": "TestCaseId", "description": "2327280" },
        { "type": "TestCaseId", "description": "2611725" }
      ],
      "results": [
        { "status": "passed" }
      ]
    }
  ]
}
```

#### Error Messages and Validation

**Test Plan Not Found:**
```
Error: Test Plan 'My Plan Name' not found. Please verify that:
1. The plan name is correct
2. The plan exists in your Azure DevOps project
3. You have the necessary permissions to access the plan
```

**Missing TestCaseIds when useTestInfo is true:**
```
Error: No TestCaseId properties found in the JUnit XML file. When useTestInfo 
is set to true, you need to add test.info() annotations in your Playwright tests.

Example:
test("My test", async ({ page }, testInfo) => {
  testInfo.annotations.push({ type: "TestCaseId", description: "123456" });
  // ... your test code
});

Or set useTestInfo to false to extract TestCaseIds from test names using the TC_[ID] pattern.
```

## Version 1.4.4

Just adding some code examples for tasks that you need.

See [CODE EXAMPLES](./examples/examples.js).

## Version 1.4.3

## Enhancements

1. **Added method to update Azure Work Item fields** `updateWorkItemField`

    This method allows updating a specific field in an Azure DevOps work item using a PATCH request.

    **Parameters:**
    - *workItemId (string):* The ID of the work item.
    - *pathToField (string):* The field's path to update (e.g., /fields/System.State).
    - *valueToUpdate (string):* The new value to assign to the field.

    **Usage:** 
    This method is useful for associating test cases to automation tools and setting their state (e.g., "Ready", "In Progress").
Error Handling: If the request fails, an error message is thrown and logged.

2. **Improved XML parsing for test case extraction** `getTestCaseNamesFromJunitXML`

    This method reads and parses the XML file to extract the names of the test cases within.

    **Parameters:**
    - *filePath (string):* The path to the XML file containing test results.
    - *Flow:* The XML is read from the file system, and xml2js is used to parse the XML into a JavaScript object. The function then extracts the test case names from the testcase nodes under the testsuite nodes.
    - *Output:* The result is an array of objects, each containing the testName of the respective test case. If no test cases are found, an empty array is returned.

3. **Automated Test Case Creation and Work Item Updates**

    With all these changes you can automate the process of creating test cases in Azure DevOps, linking them to a test suite, and updating the related work items.

    **Flow:**

    1. The XML file is read, and the test case name are extracted.
    2. The test cases are then created in a specified test suite under a test plan.
    3. The work items for the created test cases are updated with automation tool information and their state is set to "Ready".

    **Parameters:**

    You need a predefined test plan and suite names to fetch relevant plan IDs and create a suite within that plan.
Error Handling: If any step of the automation process fails (fetching plan ID, creating suite, etc.), it throws an error and logs the issue.

**Example Final Code (Creating Automated Test Cases in AzureDevops)**

```javascript
const { 
    getTestCaseNamesFromJunitXML, 
    getPlanIdByName , 
    createSuiteInPlan, 
    createTestCasesInSuite, 
    associtedTestCaseToAutomation , 
    updateWorkItemField
    } = require('@thecollege/azure-test-track');

const createTestCasesInAzureDevops = async () => {
    try {

        // Get all Test Case Names from XML Result File
        const filePath = './test-results.xml'
        const results = await getTestCaseNamesFromJunitXML(filePath);
        const testCaseNames = results.map(item => item.testName); 
        console.log("Processed Results:", testCaseNames);
        console.log("Total TestCases Found:", testCaseNames.length);

        // Get Pland and Suite ID (Suite is created)
        const planId = await getPlanIdByName("Base Test Plan");
        const suiteId = await createSuiteInPlan(planId, "My Suite Name");
        
        //Create all TestCases in Plan/Suite
        const testcaseIds = await createTestCasesInSuite(planId, suiteId, testCaseNames);
        console.log("Total TestCases Created:", testcaseIds.length);
        
        //Update desired fields in the Test Case created (Update the fields you want)
        testcaseIds.forEach(async (testCaseId) => {
            await associtedTestCaseToAutomation(testCaseId, "My Backend Testing/Or Scenario Name" ,"API");
            await updateWorkItemField(testCaseId, "/fields/System.State", "Ready");
        })

    } catch (error) {
        console.error("Error creating test cases in Azure Devops:", error);
    }
};

createTestCasesInAzureDevops();
```
## Version 1.4.0

### Change Details:
1. **Creating Suites:** The `createSuiteInPlan` function checks whether a suite exists in a plan and creates it if it doesn't.
2. **Creating Test Cases:** The `createTestCase` function creates Test Cases individually, with a title and priority.
3. **Process for Creating Multiple Test Cases:** The `createTestCases` function handles the creation of multiple Test Cases from an array of names.
4. **Adding Test Cases to a Suite:** The `addTestCasesToSuite` function adds multiple Test Cases to an existing suite.
5. **Complete Integration:** The `createTestCasesInSuite` function combines both the creation and addition of Test Cases to the suite in one operation. This function should be used when the final goal is to create and add multiple Test Cases to a test plan.

### New Features:

- Creating a Suite in a Test Plan - `createSuiteInPlan`:

    - **Description:** Creates or fetches a test suite in a specific plan. If the suite already exists, it returns its ID. If not, it creates a new suite.
    - **Parameters:**
        - **planId:** The ID of the test plan.
        - **suiteName:** The name of the suite to be created or fetched.
    - **Return:** The ID of the created or existing suite.

- Creating a Test Case - `createTestCase`:

    - **Description:** Creates a new Test Case with the provided name and a fixed priority.
        - **Parameters:**
            - **testName:** The name of the Test Case to be created.
    - **Return:** The ID of the created Test Case.

- Creating Multiple Test Cases - `createTestCases`:

    - **Description:** Takes an array of Test Case names and creates them one by one.
        - **Parameters:**
            - **estNames:** An array of Test Case names to be created.
    - **Return:** An array of the created Test Case IDs.

- Adding Test Cases to a Suite - `addTestCasesToSuite`:

    - **Description:** Adds a list of Test Cases to a suite within a specific test plan.
        - **Parameters:**
            - **planId:** The ID of the test plan.
            - **suiteId:** The ID of the suite to which the Test Cases will be added.
            - **testCaseIds:** An array of Test Case IDs to be added.
    - **Return:** The API response confirming the addition of the Test Cases.

- Creating Test Cases and Adding Them to a Suite- `createTestCasesInSuite`:

    - **Description:** This is the main function if your final goal is to create multiple Test Cases in a plan and add them to a suite. It creates Test Cases from an array of names and adds them to an existing suite.
        - **Parameters:**
            - **planId:** The ID of the test plan.
            - **suiteId:** The ID of the suite where the Test Cases will be added.
            - **testNames:** An array of Test Case names to be created and added.
    - **Return:** A success message after the Test Cases have been created and added.

### Example Usage
```js
const createTestCases = async () => {
    try {
        // Fetch the test plan ID by name
        const planId = await getPlanIdByName("MY PLAN NAME");

        // Create or fetch the "Login" suite in the specified plan
        const suiteId = await createSuiteInPlan(planId, "Login");

        // Create the Test Cases and add them to the suite
        await createTestCasesInSuite(planId, suiteId, ["Login Test 1", "Login Test 2", "Login Test 3"]);

    } catch (error) {
        console.error("Error processing Create Test Cases", error);
    }
};

// Execute the process of creating Test Cases
createTestCases();

``` 

## Version 1.3.1
**New Features:**

1. Added Environment Variable `ADO_COMPANY_EMAIL:`

    - The environment variable ADO_COMPANY_EMAIL has been added to configure the company's email. This email is required for authentication when interacting with the Azure DevOps API, as the API for updating a work item requires this specific field for authentication.

2. Methods Added:

    **getWorkItemById:**
                    
    - A method to retrieve information of a work item by its ID. It makes a request to the Azure DevOps API to return the data of the requested work item.

    **associtedTestCaseToAutomation:**

    - A method to associate a test case with an automated test in Azure DevOps. It updates the fields in the Associated Automation tab of the test case, including details of the automated test, such as the test name and type (e.g., E2E).

**Example Usage:**

An example is provided demonstrating how to:

- Retrieve a work item by its ID.
- Associate a test case with an automated test, filling in the necessary fields for the association.
```javascript
const testCaseId = 123456
let workItemResponse = await getWorkItemById(testCaseId);
console.log("Processed Results:", workItemResponse.value);

// Updating the Associated Automation Fields to change the Automation Status to 'Automated' automatically
await associtedTestCaseToAutomation(testCaseId, "Automation Testing Name", "E2E");

// If you want, you can recheck work item information after update
workItemResponse = await getWorkItemById(testCaseId);
console.log("Processed Results:", responseWorkItem.value);

```

**Notes:**

- The automation status of a test case will be automatically updated to "Automated" once the test case is associated with an automated test.

- To perform this association, the relevant fields in the Associated Automation tab of the test case must be populated.

- Including the company email as an environment variable is essential for the work item update API to function properly due to the required authentication format.

