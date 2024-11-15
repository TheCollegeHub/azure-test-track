const axios = require("axios");
const devops = require("../lib/devops");

jest.mock("axios");

describe("getPlanIdByName", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return the plan ID when found on the first page", async () => {
    // Arrange
    axios.get.mockResolvedValueOnce({
      data: {
        value: [{ name: "Test Plan", id: 123 }],
      },
      headers: {},
    });

    // Act
    const planId = await devops.getPlanIdByName("Test Plan");

    // Asssert
    expect(planId).toBe(123);
    expect(axios.get).toHaveBeenCalledTimes(1);
  });

  it("should return the plan ID when found after pagination", async () => {
    //Arrange
    axios.get
      .mockResolvedValueOnce({
        data: {
          value: [],
        },
        headers: { "x-ms-continuationtoken": "token1" },
      })
      .mockResolvedValueOnce({
        data: {
          value: [{ name: "Test Plan", id: 456 }],
        },
        headers: {},
      });
    
    // Act
    const planId = await devops.getPlanIdByName("Test Plan");
      
    //Asssert
    expect(planId).toBe(456);
    expect(axios.get).toHaveBeenCalledTimes(2);
  });

  it("should return null when the plan is not found", async () => {
    // Arrange
    axios.get
      .mockResolvedValueOnce({
        data: { value: [] },
        headers: { "x-ms-continuationtoken": "token1" },
      })
      .mockResolvedValueOnce({
        data: { value: [] },
        headers: {},
      });

    // Act 
    const planId = await devops.getPlanIdByName("Non-existent Plan");

    // Asssert
    expect(planId).toBeNull();
    expect(axios.get).toHaveBeenCalledTimes(2);
  });

  it("should throw an error when the API fails", async () => {
    // Arrange
    axios.get.mockRejectedValueOnce({
      response: { data: { message: "API Error" } },
    });

    // Act and Asssert
    await expect(devops.getPlanIdByName("Test Plan")).rejects.toThrow(
      "Failed to fetch plan ID"
    );
    expect(axios.get).toHaveBeenCalledTimes(1);
  });
});
