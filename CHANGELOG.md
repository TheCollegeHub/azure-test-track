# CHANGE LOG

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

