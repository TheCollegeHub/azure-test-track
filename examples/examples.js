const { 
    getTestCaseNamesFromJunitXML, 
    getPlanIdByName , 
    createSuiteInPlan, 
    createTestCasesInSuite, 
    associtedTestCaseToAutomation , 
    updateWorkItemField,
    createTestRunByExecution,
    getWorkItemById
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

const associateAutomationTestsInAzureDevops = async () => {
    try {
        const testCaseId = 123456789; // Test Case ID to be associated with Automation
        await associtedTestCaseToAutomation(testCaseId, "Auto - Automation Testing /Or Scenario-Method Name" ,"E2E");
        const responseWorkItem = await getWorkItemById(testCaseId);
        console.log("Processed Results:", responseWorkItem.value); // Check if 'Microsoft.VSTS.TCM.AutomationStatus' was updated to 'Automated'

    } catch (error) {
        console.error("Error associting Test Case To Automation:", error);
    }
};

const reportTestResults = async () => {

    const planName = process.env.TEST_PLAN_NAME || "YOUR PLAN NAME";
    const testSettings = {
        resultFilePath: './test-results/results.xml',
        planName: planName,
        testRunName: "[Regression][Platform] E2E Automated Test Run",
        reportType: "junit" // For versions above 1.0.13 should have this property, you need to pass one of result formats available (junit, cucumber-json, playwright-json)
    };
        await createTestRunByExecution(testSettings);
};

//Calling the desired function

// associateAutomationTestsInAzureDevops()
// createTestCasesInAzureDevops();
// reportTestResults();