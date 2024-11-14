const axios = require('axios');

const organization = process.env.ADO_ORGANIZATION
const project = process.env.ADO_PROJECT
const personalAccessToken = process.env.ADO_PERSONAL_ACCESS_TOKEN

const headers = {
  'Authorization': `Basic ${Buffer.from(':' + personalAccessToken).toString('base64')}`
};

const getPlanIdByName = async (planName) => {
    console.log(`Fetching plan ID for plan with name: ${planName}`);
    let continuationToken = null;
    const planUrlBase = `https://dev.azure.com/${organization}/${project}/_apis/testplan/plans?api-version=7.1`;
    
    try {
      while (true) {
        const url = continuationToken ? `${planUrlBase}&continuationToken=${continuationToken}` : planUrlBase;
        const response = await axios.get(url, { headers });
    
        const plan = response.data.value.find(p => p.name === planName);
        
        if (plan) {
          console.log(`Plan found: ${planName} with ID ${plan.id}`);
          return plan.id;
        }
        
        continuationToken = response.headers['x-ms-continuationtoken'];
        
        if (!continuationToken) {
          console.error(`Plan with name ${planName} not found.`);
          return null;
        }
      }
    } catch (error) {
        console.error("Error fetching plan ID:", error.response?.data || error.message);
        throw new Error("Failed to fetch plan ID");
    }
  };

const getSuitesByPlanId = async (planId) => {
  const suitesUrl = `https://dev.azure.com/${organization}/${project}/_apis/testplan/Plans/${planId}/suites?api-version=7.1`;
  
  try {
    const response = await axios.get(suitesUrl, { headers });
    console.log(`Total suites found in plan with ID ${planId}: ${response.data.value.length}`);
    return response.data.value;
  } catch (error) {
    console.error("Error fetching suites for plan:", error.response?.data || error.message);
    return [];
  }
};

const getTestPointByTestCaseId = async (planId, suiteId, testCaseId) => {
  const pointsUrl = `https://dev.azure.com/${organization}/${project}/_apis/test/Plans/${planId}/Suites/${suiteId}/points?testCaseId=${testCaseId}&api-version=7.1`;
  
  try {
    const response = await axios.get(pointsUrl, { headers });
    return response.data.value[0] || null;
  } catch (error) {
    console.error("Error fetching Test Point ID:", error.response?.data || error.message);
    return null;
  }
};

const getAllTestPointsByPlanAndSuite = async (planId, suiteId) => {
  const url = `https://dev.azure.com/${organization}/${project}/_apis/test/Plans/${planId}/Suites/${suiteId}/points?api-version=7.1`;

  try {
    const response = await axios.get(url, { headers });
    const testPoints = response.data.value;
    return testPoints.map(point => ({
      id: point.id,
      testCase: {
        id: point.testCase.id,
        name: point.testCase.name
      },
      suite: { id: suiteId }
    }));
  } catch (error) {
    console.error(`Error to get Test Points from suite ${suiteId}:`, error.response?.data || error.message);
    return [];
  }
};


const getTestPointsData = async (planId, resultData) => {
  if (!planId) return [];

  const suites = await getSuitesByPlanId(planId);

  const allTestPointsPromises = suites.map(async (suite) => {
    return await getAllTestPointsByPlanAndSuite(planId, suite.id);
  });

  const allTestPoints = (await Promise.all(allTestPointsPromises)).flat();

  const testCaseIdsSet = new Set(resultData.map(testCase => testCase.testCaseId.toString()));

  const filteredTestPointsData = allTestPoints
    .filter(testPoint => testCaseIdsSet.has(testPoint.testCase.id.toString()))
    .map(testPoint => ({
      testPointId: testPoint.id,
      testCaseId: testPoint.testCase.id,
      testCaseTitle: testPoint.testCase.name,
      outcome: testPoint.outcome,
      suiteId: testPoint.suite.id
    }));
  
  return filteredTestPointsData;
};


const getTestPointIdsFromTestCases = async (planName, testCaseIds) => {
  const planId = await getPlanIdByName(planName);
  if (!planId) return [];

  const url = `https://dev.azure.com/${organization}/${project}/_apis/test/plans/${planId}/testpoints?api-version=7.1`;

  try {
    const response = await axios.get(url, { headers });
    const testPoints = response.data.value;

    return testPoints.filter(point => testCaseIds.includes(point.testCase.id));
  } catch (error) {
    console.error("Error fetching Test Points:", error.response?.data || error.message);
    return [];
  }
};

const getAllTestPointsByPlanName = async (planName) => {
    const testPointsData = [];

    const planId = await getPlanIdByName(planName);
    if (!planId) return [];

    
    const suites = await getSuitesByPlanId(planId);
    const allTestPoints = [];
  
    for (const suite of suites) {
      const pointsUrl = `https://dev.azure.com/${organization}/${project}/_apis/test/Plans/${planId}/Suites/${suite.id}/points?api-version=7.1`;
      
      let continuationToken = null;
  
      try {
        while (true) {
          const url = continuationToken ? `${pointsUrl}&continuationToken=${continuationToken}` : pointsUrl;
          const response = await axios.get(url, { headers });
          
          allTestPoints.push(...response.data.value.map(point => ({
            testPointId: point.id,
            testCaseId: point.testCase.id,
            testCaseTitle: point.testCase.name,
            outcome: point.outcome,
            suiteId: suite.id
          })));
          
          continuationToken = response.headers['x-ms-continuationtoken'];
          
          if (!continuationToken) break; // No more pages
        }
  
      } catch (error) {
        console.error(`Error fetching Test Points for Suite ID ${suiteId}:`, error.response?.data || error.message);
      }
    }
  
    return allTestPoints;
  };
  

const createTestRun = async (runSettings) => {
if (runSettings.testPointsData.length === 0) {
    console.log("Test Run cannot be created without valid Test Point IDs.");
    return;
}

const url = `https://dev.azure.com/${organization}/${project}/_apis/test/runs?api-version=7.1`;

const data = {
    name: runSettings.testRunName,
    plan: { id: runSettings.planId },
    build: { id: runSettings.buildId},
    pointIds: runSettings.testPointsData.map(point => point.testPointId),
    automated: true,
    state: "NotStarted"
};

try {
    const response = await axios.post(url, data, { headers });
    // console.log("Test Run created successfully:", response.data);
    return response.data.id;
} catch (error) {
    console.error("Error creating Test Run:", error.response?.data || error.message);
    return null;
}
};

const createTestRunWithoutTests = async () => {
const url = `https://dev.azure.com/${organization}/${project}/_apis/test/runs?api-version=7.1`;

const data = {
    name: "PW Automated Test Run",
    automated: true,
    state: "NotStarted"
};

try {
    const response = await axios.post(url, data, { headers });
    console.log("Test Run created successfully:", response.data);
    return response.data.id;
} catch (error) {
    console.error("Error creating Test Run:", error.response?.data || error.message);
    return null;
}
};

const getTestResultsFromTestRun = async (runId) => {
    const url = `https://dev.azure.com/${organization}/${project}/_apis/test/Runs/${runId}/results?api-version=7.1`;
  
    try {
      const response = await axios.get(url, { headers });
      const testResults = response.data.value;
      console.log("Fetched test results:", testResults.length);
      return testResults;
    } catch (error) {
      console.error("Error fetching test results:", error.response?.data || error.message);
      return [];
    }
  };

  
const updateTestRunResults = async (runId, newResultsData) => {
    const existingResults = await getTestResultsFromTestRun(runId);
  
    const resultIdMap = {};
    existingResults.forEach(result => {
      resultIdMap[result.testCase.id] = {
        resultId: result.id,
        testCaseRevision: result.testCaseRevision,
        testPointId: result.testPoint.id,
        testCaseTitle: result.testCaseTitle,
      };
    });
  

    const resultsPayload = newResultsData.map(result => {
      const matchedResult = resultIdMap[result.testCaseId];
  
      return {
        id: matchedResult.resultId,                 
        testCase: { id: result.testCaseId },
        testPoint: { id: matchedResult.testPointId },
        outcome: result.outcome,                   
        state: 'Completed',                         
        testCaseRevision: matchedResult.testCaseRevision,
        testCaseTitle: matchedResult.testCaseTitle,
      };
    });

    const url = `https://dev.azure.com/${organization}/${project}/_apis/test/Runs/${runId}/results?api-version=7.1`;
    
    // console.log("Test Run results to be updated:", resultsPayload);
    try {
      const response = await axios.patch(url, resultsPayload, { headers });
      console.log("Test Run results updated successfully!");
    } catch (error) {
      console.error("Error updating Test Run results:", error.response?.data || error.message);
    }
  };

const addTestResults = async (runId, resultData) => {
const url = `https://dev.azure.com/${organization}/${project}/_apis/test/runs/${runId}/results?api-version=7.1`;

const data = resultData.map(result => ({
    testCase: { id: result.testCaseId },
    outcome: result.outcome,
    state: "Completed",
    automatedTestName: `Automated Test ${result.testCaseId}`,
    TestCaseTitle: `Automated Test ${result.testCaseId}`
}));

try {
    const response = await axios.post(url, data, { headers });
    console.log("Test Results added successfully:", response.data);
} catch (error) {
    console.error("Error adding Test Results:", error.response?.data || error.message);
}
};


const completeTestRun = async (runId) => {
const url = `https://dev.azure.com/${organization}/${project}/_apis/test/runs/${runId}?api-version=7.1`;

const data = { state: "Completed" };

try {
    await axios.patch(url, data, { headers });
    console.log("Test Run completed successfully.");
} catch (error) {
    console.error("Error completing Test Run:", error.response?.data || error.message);
}
};

const resetAllTestPointsToActiveByPlanId = async (planId, testPoints) => {
for (const testPoint of testPoints) {
    const suiteId = testPoint.suiteId; 
    const testPointId = testPoint.testPointId;
    const updateUrl = `https://dev.azure.com/${organization}/${project}/_apis/test/Plans/${planId}/Suites/${suiteId}/points/${testPointId}?api-version=7.1`;

    try {
    await axios.patch(
        updateUrl,
        { resetToActive: true},
        { headers }
    );
    console.log(`Test point ${testPointId} in suite ${suiteId} reset to Active.`);
    } catch (error) {
    console.error(`Error resetting test point ${testPointId} in suite ${suiteId}:`, error.response?.data || error.message);
    }
}
};

const getTestRunsByBuildId = async (buildId) => {
  const minLastUpdatedDate = '2024-11-13T00:00:00Z';
  const maxLastUpdatedDate = '2024-11-14T23:59:59Z'; 

  const url = `https://dev.azure.com/${organization}/${project}/_apis/test/runs?minLastUpdatedDate=${minLastUpdatedDate}&maxLastUpdatedDate=${maxLastUpdatedDate}&buildIds=${buildId}&includeRunDetails=true&api-version=7.1`;

  try {
    const response = await axios.get(url, { headers });
    return response.data.value;
  } catch (error) {
    console.error("Error fetching Test Runs:", error.response?.data || error.message);
  }
};

module.exports = {
    getPlanIdByName,
    getSuitesByPlanId,
    getTestPointByTestCaseId,
    getTestPointsData,
    getTestPointIdsFromTestCases,
    getAllTestPointsByPlanAndSuite,
    getAllTestPointsByPlanName,
    createTestRun,
    createTestRunWithoutTests,
    getTestResultsFromTestRun,
    updateTestRunResults,
    addTestResults,
    completeTestRun,
    resetAllTestPointsToActiveByPlanId,
    getTestRunsByBuildId
  };