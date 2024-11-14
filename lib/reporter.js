const devops = require('./devops');
const extractor = require('../extractor/extractor-test-results');

const createTestRunByExecution = async (testSettings) => {
    const testResults = await extractor.readAndProcessJUnitXML(testSettings.resultFilePath);
    console.log("Test results read with success. Tests found: ", testResults.length);

    const planId = await devops.getPlanIdByName(testSettings.planName);
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
  readAndProcessJUnitXML: extractor.readAndProcessJUnitXML,
  createTestRunByExecution: createTestRunByExecution
};
