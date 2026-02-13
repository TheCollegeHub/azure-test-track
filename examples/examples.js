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

    const planName = process.env.TEST_PLAN_NAME || "[KAP] BASE REGRESSION TESTS";
    
    // ===========================
    // OPTION 1: Using planName (backward compatible)
    // ===========================
    const testSettingsWithPlanName = {
        resultFilePath: '../test-results/results.xml',
        planName: planName,  // Uses plan name (requires API lookup)
        testRunName: "[Regression][Platform] E2E Automated Test Run",
        reportType: "junit",
        useTestInfo: true
    };

    // ===========================
    // OPTION 2: Using planId (FASTER! - New in v1.5.4)
    // ===========================
    const testSettingsWithPlanId = {
        resultFilePath: '../test-results/results.xml',
        planId: 1958788,  // Direct plan ID - saves ~1 second!
        testRunName: "[Regression][Platform] E2E Automated Test Run",
        reportType: "junit",
        useTestInfo: true
    };

    // ===========================
    // OPTION 3: With Configuration Filtering (New in v1.5.4)
    // ===========================
    
    // Single configuration
    const testSettingsSingleConfig = {
        resultFilePath: '../test-results/results.xml',
        planId: 1958788,
        configurationName: 'ENV: STAGING',  // Only STAGING test points
        testRunName: "[STAGING] E2E Automated Test Run",
        reportType: "junit",
        useTestInfo: true
    };

    // Multiple configurations
    const testSettingsMultipleConfigs = {
        resultFilePath: '../test-results/results.xml',
        planId: 1958788,
        configurationName: ['ENV: STAGING', 'ENV: PRODUCTION'],  // Array!
        testRunName: "[STAGING+PRODUCTION] E2E Automated Test Run",
        reportType: "junit",
        useTestInfo: true
    };

    // ===========================
    // OPTION 4: CI/CD Dynamic Configuration (New in v1.5.4)
    // ===========================
    const envs = process.env.TEST_ENVIRONMENTS?.split(',') || ['STAGING'];
    const testSettingsForCI = {
        resultFilePath: '../test-results/results.xml',
        planId: parseInt(process.env.TEST_PLAN_ID || '1958788'),
        configurationName: envs.length === 1 ? envs[0] : envs,
        testRunName: `[${envs.join('+')}] CI Test Run`,
        reportType: "junit",
        useTestInfo: true
    };

    // Choose which option to use:
    await createTestRunByExecution(testSettingsWithPlanId);
    
    // Note: You can enable debug logging to see detailed information:
    // PowerShell: $env:DEBUG='true'; node examples.js
    // Bash: DEBUG=true node examples.js
};

//Calling the desired function

// associateAutomationTestsInAzureDevops()
// createTestCasesInAzureDevops();
reportTestResults();