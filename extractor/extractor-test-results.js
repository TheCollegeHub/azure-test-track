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

module.exports = { readAndProcessJUnitXML };
