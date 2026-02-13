const fs = require('fs');
const xml2js = require('xml2js');
const logger = require('../lib/logger');

function getTestCaseNamesFromJunitXML(filePath) {
    logger.info("Reading and processing XML file...");
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf-8', (err, data) => {
            if (err) {
                logger.error("Error reading XML file:", err);
                return reject(new Error("Error reading XML file: " + err.message));
            }
            
            xml2js.parseString(data, (err, result) => {
                if (err) {
                    logger.error("Error parsing XML:", err);
                    return reject(new Error("Error parsing XML: " + err.message));
                }

                if (!result || !result.testsuites || !result.testsuites.testsuite) {
                    return resolve([]);  
                }
                

                const newResultsData = result.testsuites.testsuite.flatMap(suite => {
                    if (!suite.testcase || !Array.isArray(suite.testcase)) {
                        return []; 
                    }
                
                    return suite.testcase.map(testcase => {
                        const testName = testcase.$ ? testcase.$.name : undefined;
                        return testName ? { testName } : null;
                    })
                }
                ).filter(Boolean);
                
                resolve(newResultsData);
            });
        });
    });
}

module.exports = { getTestCaseNamesFromJunitXML };
