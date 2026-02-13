const axios = require('axios');
const logger = require('./logger');

const organization = process.env.ADO_ORGANIZATION
const project = process.env.ADO_PROJECT
const personalAccessToken = process.env.ADO_PERSONAL_ACCESS_TOKEN
const companyEmail = process.env.ADO_COMPANY_EMAIL

const headers = {
  'Authorization': `Basic ${Buffer.from(':' + personalAccessToken).toString('base64')}`
};

const getPlanIdByName = async (planName) => {
    logger.info(`Fetching plan ID for plan with name: ${planName}`);
    let continuationToken = null;
    const planUrlBase = `https://dev.azure.com/${organization}/${project}/_apis/testplan/plans?api-version=7.1`;
    
    try {
      while (true) {
        const url = continuationToken ? `${planUrlBase}&continuationToken=${continuationToken}` : planUrlBase;
        const response = await axios.get(url, { headers });
    
        const plan = response.data.value.find(p => p.name === planName);
        
        if (plan) {
          logger.debug(`Plan found: ${planName} with ID ${plan.id}`);
          return plan.id;
        }
        
        continuationToken = response.headers['x-ms-continuationtoken'];
        
        if (!continuationToken) {
          logger.error(`Plan with name ${planName} not found.`);
          return null;
        }
      }
    } catch (error) {
        logger.error("Error fetching plan ID:", error.response?.data || error.message);
        logger.debug("Error Status:", error.response?.status);
        logger.debug("Error Headers:", error.response?.headers);
        logger.debug("Full Error:", JSON.stringify(error, null, 2));
        logger.debug("URL attempted:", planUrlBase);
        logger.debug("Organization:", organization);
        logger.debug("Project:", project);
        throw new Error("Failed to fetch plan ID");
    }
  };

const getSuitesByPlanId = async (planId) => {
  const suitesUrl = `https://dev.azure.com/${organization}/${project}/_apis/testplan/Plans/${planId}/suites?api-version=7.1`;
  
  try {
    const response = await axios.get(suitesUrl, { headers });
    logger.debug(`Total suites found in plan with ID ${planId}: ${response.data.value.length}`);
    return response.data.value;
  } catch (error) {
    logger.error("Error fetching suites for plan:", error.response?.data || error.message);
    return [];
  }
};

const getTestPointByTestCaseId = async (planId, suiteId, testCaseId) => {
  const pointsUrl = `https://dev.azure.com/${organization}/${project}/_apis/test/Plans/${planId}/Suites/${suiteId}/points?testCaseId=${testCaseId}&api-version=7.1`;
  
  try {
    const response = await axios.get(pointsUrl, { headers });
    return response.data.value[0] || null;
  } catch (error) {
    logger.error("Error fetching Test Point ID:", error.response?.data || error.message);
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
      suite: { id: suiteId },
      configuration: point.configuration || null
    }));
  } catch (error) {
    logger.error(`Error to get Test Points from suite ${suiteId}:`, error.response?.data || error.message);
    return [];
  }
};


const getTestPointsData = async (planId, resultData, configurationName = null) => {
  if (!planId) return [];

  const suites = await getSuitesByPlanId(planId);

  const allTestPointsPromises = suites.map(async (suite) => {
    return await getAllTestPointsByPlanAndSuite(planId, suite.id);
  });

  const allTestPoints = (await Promise.all(allTestPointsPromises)).flat();

  const testCaseIdsSet = new Set(resultData.map(testCase => testCase.testCaseId.toString()));

  let filteredTestPointsData = allTestPoints
    .filter(testPoint => testCaseIdsSet.has(testPoint.testCase.id.toString()));

  if (configurationName) {
    const beforeFilterCount = filteredTestPointsData.length;
    
    const configNames = Array.isArray(configurationName) ? configurationName : [configurationName];
    
    filteredTestPointsData = filteredTestPointsData.filter(testPoint => 
      testPoint.configuration && configNames.includes(testPoint.configuration.name)
    );
    
    const afterFilterCount = filteredTestPointsData.length;
    const configNamesStr = configNames.length > 1 ? `"${configNames.join('", "')}"` : `"${configNames[0]}"`;
    
    logger.info(`Filtering by configuration ${configNamesStr}: ${beforeFilterCount} test points found → ${afterFilterCount} matched`);
    logger.debug(`Configuration filter details: BEFORE=${beforeFilterCount} | AFTER=${afterFilterCount} | Filtered out=${beforeFilterCount - afterFilterCount}`);
  }

  filteredTestPointsData = filteredTestPointsData.map(testPoint => ({
    testPointId: testPoint.id,
    testCaseId: testPoint.testCase.id,
    testCaseTitle: testPoint.testCase.name,
    outcome: testPoint.outcome,
    suiteId: testPoint.suite.id,
    configuration: testPoint.configuration || null
  }));

  logger.debug(`Filtered ${filteredTestPointsData.length} test points from ${allTestPoints.length} total test points`);
  logger.debug("Test points details:", JSON.stringify(filteredTestPointsData, null, 2));
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
    logger.error("Error fetching Test Points:", error.response?.data || error.message);
    return [];
  }
};

const getAllTestPointsByPlanName = async (planName) => {
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
            configuration: point.configuration || null,
            suiteId: suite.id
          })));
          
          continuationToken = response.headers['x-ms-continuationtoken'];
          
          if (!continuationToken) break; // No more pages
        }
  
      } catch (error) {
        logger.error(`Error fetching Test Points for Suite ID ${suiteId}:`, error.response?.data || error.message);
      }
    }
  
    return allTestPoints;
  };
  

const createTestRun = async (runSettings) => {
if (runSettings.testPointsData.length === 0) {
    logger.warn("Test Run cannot be created without valid Test Point IDs.");
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
    logger.debug("Test Run created successfully:", response.data);
    return response.data.id;
} catch (error) {
    logger.error("Error creating Test Run:", error.response?.data || error.message);
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
    logger.debug("Test Run created successfully:", response.data);
    return response.data.id;
} catch (error) {
    logger.error("Error creating Test Run:", error.response?.data || error.message);
    return null;
}
};

const getTestResultsFromTestRun = async (runId) => {
    const url = `https://dev.azure.com/${organization}/${project}/_apis/test/Runs/${runId}/results?api-version=7.1`;
  
    try {
      const response = await axios.get(url, { headers });
      const testResults = response.data.value;
      logger.debug("Fetched test results:", testResults.length);
      return testResults;
    } catch (error) {
      logger.error("Error fetching test results:", error.response?.data || error.message);
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
  
    const notFoundTestCaseIds = [];
    const resultsPayload = newResultsData
      .map(result => {
        const matchedResult = resultIdMap[result.testCaseId];
        
        if (!matchedResult) {
          notFoundTestCaseIds.push(result.testCaseId);
          return null;
        }
        
        return {
          id: matchedResult.resultId,                 
          testCase: { id: result.testCaseId },
          testPoint: { id: matchedResult.testPointId },
          outcome: result.outcome,                   
          state: 'Completed',                         
          testCaseRevision: matchedResult.testCaseRevision,
          testCaseTitle: matchedResult.testCaseTitle,
        };
      })
      .filter(Boolean);

    if (notFoundTestCaseIds.length > 0) {
      logger.warn(`Warning: The following test case IDs were not found in Test Plan and will be skipped: ${notFoundTestCaseIds.join(', ')}`);
    }

    if (resultsPayload.length === 0) {
      logger.warn("No matching test results to update.");
      return;
    }

    const url = `https://dev.azure.com/${organization}/${project}/_apis/test/Runs/${runId}/results?api-version=7.1`;
    
    const testCaseIdsToUpdate = resultsPayload.map(r => r.testCase.id);
    logger.debug(`Attempting to update ${testCaseIdsToUpdate.length} test case(s) with IDs:`, testCaseIdsToUpdate.join(', '));
    
    try {
      const response = await axios.patch(url, resultsPayload, { headers });
      logger.info(`Test Run results updated successfully! Updated ${resultsPayload.length} test case(s).`);
    } catch (error) {
      logger.error("Error updating Test Run results:", error.response?.data || error.message);
      logger.debug("Test Case IDs that failed to update:", testCaseIdsToUpdate.join(', '));
      logger.debug("Payload sent:", JSON.stringify(resultsPayload, null, 2));
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
    logger.debug("Test Results added successfully:", response.data);
} catch (error) {
    logger.error("Error adding Test Results:", error.response?.data || error.message);
}
};


const completeTestRun = async (runId) => {
const url = `https://dev.azure.com/${organization}/${project}/_apis/test/runs/${runId}?api-version=7.1`;

const data = { state: "Completed" };

try {
    await axios.patch(url, data, { headers });
    logger.info("Test Run completed successfully.");
} catch (error) {
    logger.error("Error completing Test Run:", error.response?.data || error.message);
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
    logger.debug(`Test point ${testPointId} in suite ${suiteId} reset to Active.`);
    } catch (error) {
    logger.error(`Error resetting test point ${testPointId} in suite ${suiteId}:`, error.response?.data || error.message);
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
    logger.error("Error fetching Test Runs:", error.response?.data || error.message);
  }
};

const getWorkItemById = async (workItemId) => {
  const url = `https://dev.azure.com/${organization}/${project}/_apis/wit/workitems?ids=${workItemId}&$expand=all&api-version=7.1`;

  try {
      const response = await axios.get(url, { headers });
      logger.debug(`WorkItem ${workItemId} get successfully.`);
      return response.data;
  } catch (error) {
      logger.error(`Failed to get Work Item ${workItemId}`, error.response?.data || error.message);
      throw new Error(`Error getting Work Item: ${error.message}`);
  }
};

const associtedTestCaseToAutomation = async (testCaseId, automatedTestCaseName, automationTestType) => {
  const url = `https://dev.azure.com/${organization}/${project}/_apis/wit/workitems/${testCaseId}?api-version=7.1`;

  const headers = {
    Authorization: `Basic ${Buffer.from(`${companyEmail}:` + personalAccessToken).toString('base64')}`,
    'Content-Type': 'application/json-patch+json',
  };

  // The Automation Status is automatically updated to "Automated" once the test case is associated with automation. 
  // This occurs after the relevant fields (below) in the Associated Automation tab are populated.
  const body = [
      {
        op: "add",
        path: "/fields/Microsoft.VSTS.TCM.AutomatedTestId",
        value: testCaseId
      },
      {
        op: "add",
        path: "/fields/Microsoft.VSTS.TCM.AutomatedTestName",
        value: automatedTestCaseName
      },
      {
        op: "add",
        path: "/fields/Microsoft.VSTS.TCM.AutomatedTestType",
        value: automationTestType
      }
  ];
  try {
      logger.debug(`Updating field Associated Automation of test case ID ${testCaseId}...`);

      const response = await axios.patch(url, body, { headers });
      logger.debug(`Associated Automation Fields updated successfully.`);
      return response.data;
  } catch (error) {
      logger.error(`Failed to update Associated Automation for test case ID ${testCaseId}:`, error.response?.data || error.message);
      throw new Error(`Error updating Associated Automation: ${error.message}`);
  }
};

const updateWorkItemField = async (workItemId, pathToField, valueToUpdate) => {
  const url = `https://dev.azure.com/${organization}/${project}/_apis/wit/workitems/${workItemId}?api-version=7.1`;

  const headers = {
    Authorization: `Basic ${Buffer.from(`${companyEmail}:` + personalAccessToken).toString('base64')}`,
    'Content-Type': 'application/json-patch+json',
  };

  const body = [
      {
        op: "replace",
        path: pathToField,
        value: valueToUpdate
      }
  ];
  try {
      logger.debug(`Updating ${pathToField} for Work Item Id ${workItemId}...`);

      const response = await axios.patch(url, body, { headers });
      logger.debug(`${pathToField} updated successfully.`);
      return response.data;
  } catch (error) {
      logger.error(`Failed to update ${pathToField} for Work Item Id ${workItemId}:`, error.response?.data || error.message);
      throw new Error(`Error updating ${pathToField}: ${error.message}`);
  }
};

const createSuiteInPlan = async (planId, suiteName) => {
  logger.info(`Creating or fetching suite '${suiteName}' in plan ID: ${planId}`);

  const suitesUrl = `https://dev.azure.com/${organization}/${project}/_apis/testplan/plans/${planId}/suites?api-version=7.1`;

  try {
    const suitesResponse = await axios.get(suitesUrl, { headers });
    const existingSuite = suitesResponse.data.value.find(suite => suite.name === suiteName);

    if (existingSuite) {
      logger.debug(`Suite '${suiteName}' already exists with ID: ${existingSuite.id}`);
      return existingSuite.id;
    }

    logger.debug(`Suite '${suiteName}' not found, proceeding to create it.`);

    const rootSuiteId = suitesResponse.data.value[0]?.id;

    if (!rootSuiteId) {
      throw new Error("Root suite not found for the specified plan.");
    }

    logger.debug(`Root Suite ID for plan ${planId}: ${rootSuiteId}`);

    const createSuiteUrl = `https://dev.azure.com/${organization}/${project}/_apis/testplan/plans/${planId}/suites?api-version=7.1`;
    const payload = {
      name: suiteName,
      parentSuite: { id: rootSuiteId },
      suiteType: "staticTestSuite"
    };

    const createResponse = await axios.post(createSuiteUrl, payload, { headers });
    const newSuiteId = createResponse.data.id;

    logger.info(`Suite '${suiteName}' created successfully with ID: ${newSuiteId}`);
    return newSuiteId;
  } catch (error) {
    logger.error("Error creating or fetching suite:", error.response?.data || error.message);
    throw new Error("Failed to create or fetch suite");
  }
};

const createTestCase = async (testName) => {
  const url = `https://dev.azure.com/${organization}/${project}/_apis/wit/workitems/$Test%20Case?api-version=7.1`;

  const payload = [
    { op: "add", path: "/fields/System.Title", value: testName },
    { op: "add", path: "/fields/Microsoft.VSTS.Common.Priority", value: 2 }
  ];

  const response = await axios.post(url, payload, {
    headers: {
      ...headers,
      "Content-Type": "application/json-patch+json"
    }
  });

  logger.debug(`Test case '${testName}' created with ID: ${response.data.id}`);
  return response.data.id;
};

const createTestCases = async (testNames) => {
  if (!Array.isArray(testNames)) {
    throw new Error("O parâmetro 'testNames' precisa ser um array.");
  }

  const testCaseIds = [];

  for (const testName of testNames) {
    const testCaseId = await createTestCase(testName); 
    testCaseIds.push(testCaseId);
  }

  return testCaseIds;
};

const addTestCasesToSuite = async (planId, suiteId, testCaseIds) => {
  const url = `https://dev.azure.com/${organization}/${project}/_apis/testplan/Plans/${planId}/suites/${suiteId}/testcase?api-version=7.1`;

  if (!Array.isArray(testCaseIds)) {
    throw new Error("The parameter 'testCaseIds' must be an array.");
  }

  const payload = testCaseIds.map(id => ({
    workItem: { id }
  }));

  try {
    const response = await axios.post(url, payload , { headers });
    logger.debug(`Test cases added to suite ID ${suiteId}:`, response.data);
    return response.data;
  } catch (error) {
    logger.error("Error adding test cases to suite:", error.response?.data || error.message);
    throw error;
  }
};


const createTestCasesInSuite = async (planId, suiteId, testNames) => {
  if (!Array.isArray(testNames)) {
    throw new Error("The parameter 'testNames' must be an array.");
  }
  const testCaseIds = await createTestCases(testNames);
  await addTestCasesToSuite(planId, suiteId, testCaseIds);

  logger.info("All test cases created and added to suite successfully.");
  return testCaseIds;
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
    getTestRunsByBuildId,
    associtedTestCaseToAutomation,
    getWorkItemById,
    createSuiteInPlan,
    createTestCase,
    createTestCases,
    addTestCasesToSuite,
    createTestCasesInSuite,
    updateWorkItemField
  };