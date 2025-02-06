const { getTestCaseNamesFromJunitXML } = require('../extractor/extractor-general-data');
const path = require('path');

describe('getTestCaseNamesFromJunitXML - Additional Cases', () => {
    
    it('should handle multiple testsuites correctly', async () => {
        const filePath = path.resolve(__dirname, 'data', 'test-results-multiple-suites.xml');
        const result = await getTestCaseNamesFromJunitXML(filePath);

        expect(result).toEqual([
            { testName: 'Suite1 - Test A' },
            { testName: 'Suite1 - Test B' },
            { testName: 'Suite2 - Test X' },
            { testName: 'Suite2 - Test Y' }
        ]);
    });

    it('should ignore test cases without a name attribute', async () => {
        const filePath = path.resolve(__dirname, 'data', 'test-results-missing-names.xml');
        const result = await getTestCaseNamesFromJunitXML(filePath);

        expect(result).toEqual([
            { testName: 'Valid Test 2' },
            { testName: 'Valid Test 3' }
        ]); 
    });

    it('should return an empty array for an empty XML file', async () => {
        const filePath = path.resolve(__dirname, 'data', 'test-results-empty-file.xml');
        const result = await getTestCaseNamesFromJunitXML(filePath);
        
        expect(result).toEqual([]);
    });

    it('should reject when XML is invalid', async () => {
        const filePath = path.resolve(__dirname, 'data', 'test-results-invalid.xml');

        await expect(getTestCaseNamesFromJunitXML(filePath)).rejects.toThrow();
    });
});
