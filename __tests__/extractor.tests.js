const { 
    readAndProcessJUnitXML, 
    readAndProcessJUnitXMLUsingTestInfo,
    readAndProcessPlaywrightJSONUsingTestInfo
} = require('../extractor/extractor-test-results');
const path = require('path');

describe('readAndProcessJUnitXML with actual XML file', () => {
    it('should process the actual XML file and return the correct test results', async () => {
    // Arrange
    const filePath = path.resolve(__dirname, 'data', 'test-results.xml');

    // Act
    const result = await readAndProcessJUnitXML(filePath);

    // Assert
    const expectedResult = [
        { testCaseId: 1234567, outcome: 'Passed' },
        { testCaseId: 7654321, outcome: 'Failed' },
        { testCaseId: 1122334, outcome: 'Passed' },
        { testCaseId: 5566778, outcome: 'Passed' },
        { testCaseId: 9988776, outcome: 'Skipped' },
        { testCaseId: 3456789, outcome: 'Failed' },
        { testCaseId: 9876543, outcome: 'Passed' }
    ];

    expect(result).toEqual(expectedResult);
    });

    it('should process a test without failure, error, or skipped status correctly', async () => {
         // Arrange
        const filePath = path.resolve(__dirname, 'data', 'test-results-passed.xml');

        // Act
        const result = await readAndProcessJUnitXML(filePath);

        //Asssert
        expect(result).toEqual([{ testCaseId: 1234567, outcome: 'Passed' }]);
    });

    it('should correctly interpret total tests, failures, errors, and skipped', async () => {
        // Arrange
        const filePath = path.resolve(__dirname, 'data', 'test-results.xml');

        // Act
        const result = await readAndProcessJUnitXML(filePath);
        
        //Asssert
        expect(result.length).toBe(7);
    });

    it('should handle malformatted XML gracefully', async () => {
        // Arrange
        const filePath = path.resolve(__dirname, 'data', 'test-results-bad-format.xml');
        
        // Act and Asssert
        await expect(readAndProcessJUnitXML(filePath)).rejects.toThrow();
    });

    it('should return empty array if no tests are found in XML', async () => {
        // Arrange
        const filePath = path.resolve(__dirname, 'data', 'test-results-empty.xml');

        // Act
        const result = await readAndProcessJUnitXML(filePath);

        // Asssert
        expect(result).toEqual([]);
    });

    it('should handle error when file not found', async () => {
        // Arrange
        const filePath = path.resolve(__dirname, 'data', 'test-results-not-exist.xml');

        // Act and Asssert
        await expect(readAndProcessJUnitXML(filePath)).rejects.toThrow();
    });
});

describe('readAndProcessJUnitXMLUsingTestInfo - Property-based extraction', () => {
    it('should extract TestCaseIds from properties with multiple IDs per test', async () => {
        // Arrange
        const filePath = path.resolve(__dirname, 'data', 'test-results-with-properties.xml');

        // Act
        const result = await readAndProcessJUnitXMLUsingTestInfo(filePath);

        // Assert
        const expectedResult = [
            { testCaseId: 2327280, outcome: 'Failed' },
            { testCaseId: 2611725, outcome: 'Failed' },
            { testCaseId: 2611733, outcome: 'Passed' },
            { testCaseId: 3456789, outcome: 'Passed' },
            { testCaseId: 3456790, outcome: 'Passed' },
            { testCaseId: 3456791, outcome: 'Passed' }
        ];

        expect(result).toEqual(expectedResult);
        expect(result.length).toBe(6);
    });

    it('should handle testcase with empty properties', async () => {
        // Arrange
        const filePath = path.resolve(__dirname, 'data', 'test-results-empty-properties.xml');

        // Act
        const result = await readAndProcessJUnitXMLUsingTestInfo(filePath);

        // Assert
        expect(result).toEqual([]);
    });

    it('should correctly determine outcome for passed, failed, and skipped tests', async () => {
        // Arrange
        const filePath = path.resolve(__dirname, 'data', 'test-results-with-properties.xml');

        // Act
        const result = await readAndProcessJUnitXMLUsingTestInfo(filePath);

        // Assert
        const failedTests = result.filter(r => r.outcome === 'Failed');
        const passedTests = result.filter(r => r.outcome === 'Passed');
        
        expect(failedTests.length).toBe(2); // First test has 2 TestCaseIds
        expect(passedTests.length).toBe(4); // Second test has 1, third has 3
    });

    it('should handle error when file not found', async () => {
        // Arrange
        const filePath = path.resolve(__dirname, 'data', 'non-existent.xml');

        // Act and Assert
        await expect(readAndProcessJUnitXMLUsingTestInfo(filePath)).rejects.toThrow();
    });

    it('should return empty array if no TestCaseId properties found', async () => {
        // Arrange
        const filePath = path.resolve(__dirname, 'data', 'test-results-empty-properties.xml');

        // Act
        const result = await readAndProcessJUnitXMLUsingTestInfo(filePath);

        // Assert
        expect(result).toEqual([]);
    });

    it('should parse TestCaseId as integer', async () => {
        // Arrange
        const filePath = path.resolve(__dirname, 'data', 'test-results-with-properties.xml');

        // Act
        const result = await readAndProcessJUnitXMLUsingTestInfo(filePath);

        // Assert
        result.forEach(item => {
            expect(typeof item.testCaseId).toBe('number');
            expect(Number.isInteger(item.testCaseId)).toBe(true);
        });
    });
});

describe('readAndProcessPlaywrightJSONUsingTestInfo - Annotation-based extraction', () => {
    it('should extract TestCaseIds from annotations with multiple IDs per test', async () => {
        // Arrange
        const filePath = path.resolve(__dirname, 'data', 'playwright-results-with-annotations.json');

        // Act
        const result = await readAndProcessPlaywrightJSONUsingTestInfo(filePath);

        // Assert
        const expectedResult = [
            { testCaseId: 2327280, outcome: 'Failed' },
            { testCaseId: 2611725, outcome: 'Failed' },
            { testCaseId: 2611733, outcome: 'Passed' },
            { testCaseId: 3456789, outcome: 'Passed' },
            { testCaseId: 3456790, outcome: 'Passed' },
            { testCaseId: 3456791, outcome: 'Passed' }
        ];

        expect(result).toEqual(expectedResult);
        expect(result.length).toBe(6);
    });

    it('should handle tests with empty annotations', async () => {
        // Arrange
        const filePath = path.resolve(__dirname, 'data', 'playwright-results-empty-annotations.json');

        // Act
        const result = await readAndProcessPlaywrightJSONUsingTestInfo(filePath);

        // Assert
        expect(result).toEqual([]);
    });

    it('should correctly determine outcome for passed and failed tests', async () => {
        // Arrange
        const filePath = path.resolve(__dirname, 'data', 'playwright-results-with-annotations.json');

        // Act
        const result = await readAndProcessPlaywrightJSONUsingTestInfo(filePath);

        // Assert
        const failedTests = result.filter(r => r.outcome === 'Failed');
        const passedTests = result.filter(r => r.outcome === 'Passed');
        
        expect(failedTests.length).toBe(2); // First test has 2 TestCaseIds
        expect(passedTests.length).toBe(4); // Second test has 1, third has 3
        
        // Verify specific test case IDs have correct outcomes
        expect(result.find(r => r.testCaseId === 2327280).outcome).toBe('Failed');
        expect(result.find(r => r.testCaseId === 2611733).outcome).toBe('Passed');
    });

    it('should handle error when file not found', async () => {
        // Arrange
        const filePath = path.resolve(__dirname, 'data', 'non-existent.json');

        // Act and Assert
        await expect(readAndProcessPlaywrightJSONUsingTestInfo(filePath)).rejects.toThrow();
    });

    it('should handle malformed JSON gracefully', async () => {
        // Arrange
        const filePath = path.resolve(__dirname, 'data', 'test-results-invalid.xml'); // Using XML file as malformed JSON

        // Act and Assert
        await expect(readAndProcessPlaywrightJSONUsingTestInfo(filePath)).rejects.toThrow();
    });

    it('should parse TestCaseId as integer', async () => {
        // Arrange
        const filePath = path.resolve(__dirname, 'data', 'playwright-results-with-annotations.json');

        // Act
        const result = await readAndProcessPlaywrightJSONUsingTestInfo(filePath);

        // Assert
        result.forEach(item => {
            expect(typeof item.testCaseId).toBe('number');
            expect(Number.isInteger(item.testCaseId)).toBe(true);
        });
    });

    it('should not duplicate TestCaseIds within the same test', async () => {
        // Arrange
        const filePath = path.resolve(__dirname, 'data', 'playwright-results-with-annotations.json');

        // Act
        const result = await readAndProcessPlaywrightJSONUsingTestInfo(filePath);

        // Assert
        // Each test should have unique TestCaseIds
        const testCaseIds = result.map(r => r.testCaseId);
        const uniqueTestCaseIds = [...new Set(testCaseIds)];
        expect(testCaseIds.length).toBe(uniqueTestCaseIds.length);
    });

    it('should only extract annotations with type TestCaseId', async () => {
        // Arrange
        const filePath = path.resolve(__dirname, 'data', 'playwright-results-with-annotations.json');

        // Act
        const result = await readAndProcessPlaywrightJSONUsingTestInfo(filePath);

        // Assert
        // All results should have valid test case IDs (numbers)
        result.forEach(item => {
            expect(item.testCaseId).toBeGreaterThan(0);
            expect(item.outcome).toMatch(/^(Passed|Failed)$/);
        });
    });
});
