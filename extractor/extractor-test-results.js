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

function readAndProcessJUnitXMLUsingTestInfo(filePath) {
    console.log("Reading and processing XML file using TestCaseId from properties...");
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
                
                    return suite.testcase.flatMap(testcase => {
                        // Determine the outcome first
                        let outcome = "Passed";
                        if (testcase.failure || testcase.error) {
                            outcome = "Failed";
                        } else if (testcase.skipped) {
                            outcome = "Skipped";
                        }

                        // Extract TestCaseId from properties
                        const testCaseIds = [];
                        if (testcase.properties && Array.isArray(testcase.properties)) {
                            testcase.properties.forEach(propertiesBlock => {
                                if (propertiesBlock.property && Array.isArray(propertiesBlock.property)) {
                                    propertiesBlock.property.forEach(prop => {
                                        if (prop.$ && (prop.$.name === 'TestCaseId' || prop.$.name === 'testCaseId')) {
                                            const value = prop.$.value;
                                            if (value) {
                                                const testCaseId = parseInt(value);
                                                if (!isNaN(testCaseId)) {
                                                    testCaseIds.push(testCaseId);
                                                }
                                            }
                                        }
                                    });
                                }
                            });
                        }

                        return testCaseIds.map(testCaseId => ({ testCaseId, outcome }));
                    });
                }).filter(Boolean);
                
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

function readAndProcessPlaywrightJSONUsingTestInfo(filePath) {
    console.log("Reading and extracting test results using TestInfo annotations...");
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf-8', (err, data) => {
            if (err) {
                console.error("Error reading JSON file:", err);
                return reject(err);
            }

            try {
                const parsedData = JSON.parse(data);

                const results = parsedData.suites.flatMap(suite => {
                    return suite.specs.flatMap(spec => {
                        // Determine the outcome based on test results
                        const outcome = spec.tests.every(test => 
                            test.results.every(result => result.status === "passed")
                        ) ? "Passed" : "Failed";

                        // Extract TestCaseId from annotations
                        const testCaseIds = [];
                        
                        spec.tests.forEach(test => {
                            if (test.annotations && Array.isArray(test.annotations)) {
                                test.annotations.forEach(annotation => {
                                    if (annotation.type === 'TestCaseId' && annotation.description) {
                                        const testCaseId = parseInt(annotation.description);
                                        if (!isNaN(testCaseId) && !testCaseIds.includes(testCaseId)) {
                                            testCaseIds.push(testCaseId);
                                        }
                                    }
                                });
                            }
                        });

                        // Return one result object per TestCaseId found
                        return testCaseIds.map(testCaseId => ({ testCaseId, outcome }));
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


module.exports = { 
    readAndProcessJUnitXML, 
    readAndProcessJUnitXMLUsingTestInfo, 
    readAndProcessCucumberJSON, 
    readAndProcessPlaywrightJSON,
    readAndProcessPlaywrightJSONUsingTestInfo 
};
