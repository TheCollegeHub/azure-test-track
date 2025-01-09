## CHANGE LOG

### Version 1.3.0
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

