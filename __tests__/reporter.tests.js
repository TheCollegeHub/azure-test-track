const { createTestRunByExecution } = require('../lib/reporter');
const devops = require('../lib/devops');
const extractor = require('../extractor/extractor-test-results');
const path = require('path');

jest.mock('../lib/devops');
jest.mock('../extractor/extractor-test-results');

describe('createTestRunByExecution - useTestInfo validation', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('JUnit XML with useTestInfo=true but no properties', () => {
        it('should throw error when useTestInfo is true but no TestCaseId properties found', async () => {
            // Arrange
            const testSettings = {
                resultFilePath: './test-results.xml',
                planName: 'Test Plan',
                testRunName: 'Test Run',
                reportType: 'junit',
                useTestInfo: true
            };

            extractor.readAndProcessJUnitXMLUsingTestInfo.mockResolvedValue([]);

            // Act & Assert
            await expect(createTestRunByExecution(testSettings)).rejects.toThrow(
                /No TestCaseId properties found in the JUnit XML file/
            );
            await expect(createTestRunByExecution(testSettings)).rejects.toThrow(
                /test\.info\(\) annotations/
            );
            await expect(createTestRunByExecution(testSettings)).rejects.toThrow(
                /set useTestInfo to false/
            );
        });

        it('should include code example in error message', async () => {
            // Arrange
            const testSettings = {
                resultFilePath: './test-results.xml',
                planName: 'Test Plan',
                testRunName: 'Test Run',
                reportType: 'junit',
                useTestInfo: true
            };

            extractor.readAndProcessJUnitXMLUsingTestInfo.mockResolvedValue([]);

            // Act & Assert
            await expect(createTestRunByExecution(testSettings)).rejects.toThrow(
                /testInfo\.annotations\.push/
            );
            await expect(createTestRunByExecution(testSettings)).rejects.toThrow(
                /type: "TestCaseId"/
            );
        });
    });

    describe('Playwright JSON with useTestInfo=true but no annotations', () => {
        it('should throw error when useTestInfo is true but no TestCaseId annotations found', async () => {
            // Arrange
            const testSettings = {
                resultFilePath: './test-results.json',
                planName: 'Test Plan',
                testRunName: 'Test Run',
                reportType: 'playwright-json',
                useTestInfo: true
            };

            extractor.readAndProcessPlaywrightJSONUsingTestInfo.mockResolvedValue([]);

            // Act & Assert
            await expect(createTestRunByExecution(testSettings)).rejects.toThrow(
                /No TestCaseId annotations found in the Playwright JSON file/
            );
            await expect(createTestRunByExecution(testSettings)).rejects.toThrow(
                /test\.info\(\) annotations/
            );
            await expect(createTestRunByExecution(testSettings)).rejects.toThrow(
                /set useTestInfo to false/
            );
        });

        it('should include code example in error message', async () => {
            // Arrange
            const testSettings = {
                resultFilePath: './test-results.json',
                planName: 'Test Plan',
                testRunName: 'Test Run',
                reportType: 'playwright-json',
                useTestInfo: true
            };

            extractor.readAndProcessPlaywrightJSONUsingTestInfo.mockResolvedValue([]);

            // Act & Assert
            await expect(createTestRunByExecution(testSettings)).rejects.toThrow(
                /testInfo\.annotations\.push/
            );
            await expect(createTestRunByExecution(testSettings)).rejects.toThrow(
                /TC_\[ID\]/
            );
        });
    });

    describe('Successful execution with useTestInfo=true and valid data', () => {
        it('should not throw error when useTestInfo is true and TestCaseIds are found in JUnit XML', async () => {
            // Arrange
            const testSettings = {
                resultFilePath: './test-results.xml',
                planName: 'Test Plan',
                testRunName: 'Test Run',
                reportType: 'junit',
                useTestInfo: true
            };

            const mockTestResults = [
                { testCaseId: 123456, outcome: 'Passed' },
                { testCaseId: 789012, outcome: 'Failed' }
            ];

            extractor.readAndProcessJUnitXMLUsingTestInfo.mockResolvedValue(mockTestResults);
            devops.getPlanIdByName.mockResolvedValue(1);
            devops.getTestPointsData.mockResolvedValue([
                { testPointId: 1, testCaseId: 123456 },
                { testPointId: 2, testCaseId: 789012 }
            ]);
            devops.createTestRun.mockResolvedValue(100);
            devops.updateTestRunResults.mockResolvedValue(undefined);
            devops.completeTestRun.mockResolvedValue(undefined);

            // Act & Assert
            await expect(createTestRunByExecution(testSettings)).resolves.not.toThrow();
            expect(devops.createTestRun).toHaveBeenCalled();
        });

        it('should not throw error when useTestInfo is true and TestCaseIds are found in Playwright JSON', async () => {
            // Arrange
            const testSettings = {
                resultFilePath: './test-results.json',
                planName: 'Test Plan',
                testRunName: 'Test Run',
                reportType: 'playwright-json',
                useTestInfo: true
            };

            const mockTestResults = [
                { testCaseId: 123456, outcome: 'Passed' },
                { testCaseId: 789012, outcome: 'Failed' }
            ];

            extractor.readAndProcessPlaywrightJSONUsingTestInfo.mockResolvedValue(mockTestResults);
            devops.getPlanIdByName.mockResolvedValue(1);
            devops.getTestPointsData.mockResolvedValue([
                { testPointId: 1, testCaseId: 123456 },
                { testPointId: 2, testCaseId: 789012 }
            ]);
            devops.createTestRun.mockResolvedValue(100);
            devops.updateTestRunResults.mockResolvedValue(undefined);
            devops.completeTestRun.mockResolvedValue(undefined);

            // Act & Assert
            await expect(createTestRunByExecution(testSettings)).resolves.not.toThrow();
            expect(devops.createTestRun).toHaveBeenCalled();
        });
    });

    describe('Traditional mode (useTestInfo=false) with empty results', () => {
        it('should not throw validation error when useTestInfo is false or undefined', async () => {
            // Arrange
            const testSettings = {
                resultFilePath: './test-results.xml',
                planName: 'Test Plan',
                testRunName: 'Test Run',
                reportType: 'junit'
                // useTestInfo is undefined (default false)
            };

            extractor.readAndProcessJUnitXML.mockResolvedValue([]);
            devops.getPlanIdByName.mockResolvedValue(1);
            devops.getTestPointsData.mockResolvedValue([]);
            devops.createTestRun.mockResolvedValue(100);
            devops.updateTestRunResults.mockResolvedValue(undefined);
            devops.completeTestRun.mockResolvedValue(undefined);

            // Act & Assert
            // Should complete without throwing the useTestInfo validation error
            await expect(createTestRunByExecution(testSettings)).resolves.not.toThrow(/test\.info/);
        });
    });

    describe('Plan validation', () => {
        test('should throw error when plan is not found', async () => {
            // Arrange
            const testSettings = {
                planName: 'Non-Existent Plan',
                reportType: 'junit',
                resultFilePath: './test-results.xml',
                useTestInfo: true
            };

            // Mock the extractor to return test results
            extractor.readAndProcessJUnitXMLUsingTestInfo.mockResolvedValue([
                { testCaseId: '123456', outcome: 'Passed', durationInMs: 1000 }
            ]);
            
            // Mock devops.getPlanIdByName to return null (plan not found)
            devops.getPlanIdByName.mockResolvedValue(null);

            // Act & Assert
            await expect(createTestRunByExecution(testSettings)).rejects.toThrow(
                "Test Plan 'Non-Existent Plan' not found"
            );
        });

        test('should include helpful information in plan not found error', async () => {
            // Arrange
            const testSettings = {
                planName: 'My Plan',
                reportType: 'playwright-json',
                resultFilePath: './results.json',
                useTestInfo: true
            };

            // Mock the extractor to return test results
            extractor.readAndProcessPlaywrightJSONUsingTestInfo.mockResolvedValue([
                { testCaseId: '123456', outcome: 'Passed', durationInMs: 1000 }
            ]);
            
            // Mock devops.getPlanIdByName to return null
            devops.getPlanIdByName.mockResolvedValue(null);

            // Act & Assert
            try {
                await createTestRunByExecution(testSettings);
                fail('Expected error to be thrown');
            } catch (error) {
                expect(error.message).toContain("Test Plan 'My Plan' not found");
                expect(error.message).toContain('plan name is correct');
                expect(error.message).toContain('plan exists');
                expect(error.message).toContain('necessary permissions');
            }
        });

        test('should proceed successfully when plan is found', async () => {
            // Arrange
            const testSettings = {
                planName: 'Valid Plan',
                reportType: 'junit',
                resultFilePath: './test-results.xml',
                useTestInfo: true
            };

            // Mock successful flow
            extractor.readAndProcessJUnitXMLUsingTestInfo.mockResolvedValue([
                { testCaseId: '123456', outcome: 'Passed', durationInMs: 1000 }
            ]);
            devops.getPlanIdByName.mockResolvedValue(1); // Plan found
            devops.getTestPointsData.mockResolvedValue([{ id: 1 }]);
            devops.createTestRun.mockResolvedValue(100);
            devops.updateTestRunResults.mockResolvedValue(undefined);
            devops.completeTestRun.mockResolvedValue(undefined);

            // Act & Assert - should not throw
            await expect(createTestRunByExecution(testSettings)).resolves.not.toThrow();
        });
    });
});
