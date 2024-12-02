const { readAndProcessJUnitXML } = require('../extractor/extractor-test-results');
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
