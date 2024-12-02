const fs = require('fs');
const xml2js = require('xml2js');

function readAndProcessJUnitXML(filePath) {
    console.log("Reading and processing XML file...");
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf-8', (err, data) => {
            if (err) {
                console.error("Error reading XML file:", err);
                return reject(err);
            }
            
            xml2js.parseString(data, (err, result) => {
                if (err) {
                    console.error("Error parsing XML:", err);
                    return reject(err);
                }

                if (!result || !result.testsuites || !result.testsuites.testsuite) {
                    return resolve([]);  
                }
                

                const newResultsData = result.testsuites.testsuite.flatMap(suite => {
                    if (!suite.testcase || !Array.isArray(suite.testcase)) {
                        return []; 
                    }
                
                    return suite.testcase.map(testcase => {
                        const testName = testcase.$.name;
                        const testCaseIdMatch = testName.match(/TC_(\d+)/);
                        const testCaseId = testCaseIdMatch ? parseInt(testCaseIdMatch[1]) : null;
                        
                        let outcome = "Passed";
                        if (testcase.failure || testcase.error) {
                            outcome = "Failed";
                        } else if (testcase.skipped) {
                            outcome = "Skipped";
                        }

                        return testCaseId ? { testCaseId, outcome } : null;
                    })
                }
                ).filter(Boolean);
                
                resolve(newResultsData);
            });
        });
    });
}

function readAndProcessCucumberJSON(filePath) {
    console.log("Reading and processing Cucumber JSON file...");
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf-8', (err, data) => {
            if (err) {
                console.error("Error reading JSON file:", err);
                return reject(err);
            }

            try {
                const parsedData = JSON.parse(data);

                const results = parsedData.flatMap(feature => {
                    if (!feature.elements || !Array.isArray(feature.elements)) {
                        return [];
                    }

                    return feature.elements.map(scenario => {
                        const scenarioName = scenario.name || "Unnamed Scenario";

                        const testCaseIdMatch = scenarioName.match(/TC_(\d+)/);
                        const testCaseId = testCaseIdMatch ? parseInt(testCaseIdMatch[1]) : null;
                        const statuses = scenario.steps.map(step => step.result?.status || "unknown");
                        const outcome = statuses.includes("failed") ? "Failed" : "Passed";

                        return testCaseId ? { testCaseId, outcome } : null;
                    });
                }).filter(Boolean);

                resolve(results);
            } catch (parseError) {
                console.error("Error parsing JSON:", parseError);
                reject(parseError);
            }
        });
    });
}

function readAndProcessPlaywrightJSON(filePath) {
    console.log("Reading and extracting test results...");
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf-8', (err, data) => {
            if (err) {
                console.error("Error reading JSON file:", err);
                return reject(err);
            }

            try {
                const parsedData = JSON.parse(data);

                const results = parsedData.suites.flatMap(suite => {
                    return suite.specs.map(spec => {
                        const testCaseIdMatch = spec.title.match(/TC_(\d+)/);
                        const testCaseId = testCaseIdMatch ? parseInt(testCaseIdMatch[1]) : null;

                        const outcome = spec.tests.every(test => 
                            test.results.every(result => result.status === "passed")
                        ) ? "Passed" : "Failed";

                        return testCaseId ? { testCaseId, outcome } : null;
                    });
                }).filter(Boolean);

                resolve(results);
            } catch (parseError) {
                console.error("Error parsing JSON:", parseError);
                reject(parseError);
            }
        });
    });
}


module.exports = { readAndProcessJUnitXML, readAndProcessCucumberJSON, readAndProcessPlaywrightJSON };
