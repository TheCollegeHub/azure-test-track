const devops = require('./devops');
const extractor = require('../extractor/extractor-test-results');
const extractorGeneralData = require('../extractor/extractor-general-data');


const createTestRunByExecution = async (testSettings) => {
    let testResults;

    if (testSettings.reportType === 'junit') {
        if (testSettings.useTestInfo) {
            testResults = await extractor.readAndProcessJUnitXMLUsingTestInfo(testSettings.resultFilePath);
            console.log("JUnit test results (using TestInfo properties) read with success. Tests found: ", testResults.length);
        } else {
            testResults = await extractor.readAndProcessJUnitXML(testSettings.resultFilePath);
            console.log("JUnit test results read with success. Tests found: ", testResults.length);
        }
    } else if (testSettings.reportType === 'cucumber-json') {
        testResults = await extractor.readAndProcessCucumberJSON(testSettings.resultFilePath);
        console.log("Cucumber test results read with success. Tests found: ", testResults.length);
    } else if (testSettings.reportType === 'playwright-json') {
        if (testSettings.useTestInfo) {
            testResults = await extractor.readAndProcessPlaywrightJSONUsingTestInfo(testSettings.resultFilePath);
            console.log("Playwright JSON test results (using TestInfo annotations) read with success. Tests found: ", testResults.length);
        } else {
            testResults = await extractor.readAndProcessPlaywrightJSON(testSettings.resultFilePath);
            console.log("Playwright JSON results read with success. Tests found: ", testResults.length);
        }
    } else {
        throw new Error(`Unsupported report type: ${testSettings.reportType}`);
    }


    console.log("Test results read with success. Tests found: ", testResults.length);

    // Validate if useTestInfo is true but no test results were extracted
    if (testSettings.useTestInfo && testResults.length === 0) {
        const errorMessages = {
            'junit': 'No TestCaseId properties found in the JUnit XML file. When useTestInfo is set to true, you need to add test.info() annotations in your Playwright tests.\n\nExample:\ntest("My test", async ({ page }, testInfo) => {\n  testInfo.annotations.push({ type: "TestCaseId", description: "123456" });\n  // ... your test code\n});\n\nOr set useTestInfo to false to extract TestCaseIds from test names using the TC_[ID] pattern.',
            'playwright-json': 'No TestCaseId annotations found in the Playwright JSON file. When useTestInfo is set to true, you need to add test.info() annotations in your tests.\n\nExample:\ntest("My test", async ({ page }, testInfo) => {\n  testInfo.annotations.push({ type: "TestCaseId", description: "123456" });\n  // ... your test code\n});\n\nOr set useTestInfo to false to extract TestCaseIds from test titles using the TC_[ID] pattern.'
        };

        const errorMessage = errorMessages[testSettings.reportType] || 
            `No TestCaseIds found when useTestInfo is true. Please add test.info() annotations or set useTestInfo to false.`;
        
        throw new Error(errorMessage);
    }

    const planId = await devops.getPlanIdByName(testSettings.planName);
    
    if (!planId) {
        throw new Error(`Test Plan '${testSettings.planName}' not found. Please verify that:\n1. The plan name is correct\n2. The plan exists in your Azure DevOps project\n3. You have the necessary permissions to access the plan`);
    }
    
    console.log(`Plan '${testSettings.planName}' found with ID: `, planId);

    const testPointsData = await devops.getTestPointsData(planId, testResults);
    console.log("Test points data retrieved with success based on test results. Test points found: ", testPointsData.length);
 
    const buildId = process.env.BUILD_BUILDID || 'local';
    if (buildId === 'local') {
      console.log("Build ID not found in environment variables, using 'local' as default.");
    } else {
      console.log("Setting Test Run with Build ID: ", buildId);
    }

    const runSettings = {
        planId: planId,
        testPointsData: testPointsData,
        buildId: buildId,
        testRunName: testSettings.testRunName,
    }
    const testRunId = await devops.createTestRun(runSettings);	
    console.log("Test Run created with success. Test Run ID: ", testRunId);
    
    if (testRunId) {
      await devops.updateTestRunResults(testRunId, testResults);
      await devops.completeTestRun(testRunId);
    }
  };
  
module.exports = {
  getPlanIdByName: devops.getPlanIdByName,
  getSuitesByPlanId: devops.getSuitesByPlanId,
  getAllTestPointsByPlanAndSuite: devops.getAllTestPointsByPlanAndSuite,
  createTestRun: devops.createTestRun,
  addTestResults: devops.addTestResults,
  completeTestRun: devops.completeTestRun,
  getPlanIdByName: devops.getPlanIdByName,
  getPlanIdByName: devops.getPlanIdByName,
  getTestPointByTestCaseId: devops.getTestPointByTestCaseId,
  getTestPointByTestCaseId: devops.getTestPointByTestCaseId,
  getTestPointsData: devops.getTestPointsData,
  getTestPointIdsFromTestCases: devops.getTestPointIdsFromTestCases,
  getAllTestPointsByPlanName: devops.getAllTestPointsByPlanName,
  createTestRun: devops.createTestRun,
  createTestRunWithoutTests: devops.createTestRunWithoutTests,
  getTestResultsFromTestRun: devops.getTestResultsFromTestRun,
  updateTestRunResults: devops.updateTestRunResults,
  addTestResults: devops.addTestResults,
  completeTestRun: devops.completeTestRun,
  resetAllTestPointsToActiveByPlanId: devops.resetAllTestPointsToActiveByPlanId,
  getTestRunsByBuildId: devops.getTestRunsByBuildId,
  associtedTestCaseToAutomation: devops.associtedTestCaseToAutomation,
  getWorkItemById: devops.getWorkItemById,
  createSuiteInPlan: devops.createSuiteInPlan,
  createTestCase: devops.createTestCase,
  createTestCases: devops.createTestCases,
  addTestCasesToSuite: devops.addTestCasesToSuite,
  createTestCasesInSuite: devops.createTestCasesInSuite,
  updateWorkItemField: devops.updateWorkItemField,
  readAndProcessJUnitXML: extractor.readAndProcessJUnitXML,
  readAndProcessJUnitXMLUsingTestInfo: extractor.readAndProcessJUnitXMLUsingTestInfo,
  readAndProcessCucumberJSON: extractor.readAndProcessCucumberJSON,
  readAndProcessPlaywrightJSON: extractor.readAndProcessPlaywrightJSON,
  readAndProcessPlaywrightJSONUsingTestInfo: extractor.readAndProcessPlaywrightJSONUsingTestInfo,
  getTestCaseNamesFromJunitXML: extractorGeneralData.getTestCaseNamesFromJunitXML,
  createTestRunByExecution: createTestRunByExecution
};
