import { jest } from "@jest/globals";

const mockFindAllByUserId = jest.fn();
const mockBulkUpsert = jest.fn();
const mockFindById = jest.fn();
const mockUpdateGeneratedYearsRange = jest.fn();
const mockBuildIslamicMasterRowsForYears = jest.fn();

jest.unstable_mockModule("../model/db/doa/IslamicDefinitionPreferenceDOA.js", () => ({
  default: {
    findAllByUserId: mockFindAllByUserId,
  },
}));

jest.unstable_mockModule("../model/db/doa/EventDOA.js", () => ({
  default: {
    bulkUpsert: mockBulkUpsert,
  },
}));

jest.unstable_mockModule("../model/db/doa/UserDOA.js", () => ({
  default: {
    findById: mockFindById,
    updateGeneratedYearsRange: mockUpdateGeneratedYearsRange,
  },
}));

jest.unstable_mockModule("../util/HijriUtils.js", () => ({
  buildIslamicMasterRowsForYears: mockBuildIslamicMasterRowsForYears,
}));

const {
  getBaseDefinitions,
  getMergedDefinitions,
  generateForUser,
  generateForNewUser,
} = await import("./IslamicEventService.js");

describe("IslamicEventService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("getBaseDefinitions returns seeded definitions", () => {
    const defs = getBaseDefinitions();
    expect(Array.isArray(defs)).toBe(true);
    expect(defs.length).toBeGreaterThan(0);
  });

  test("getMergedDefinitions applies per-user hidden preferences", async () => {
    mockFindAllByUserId.mockResolvedValue([{ definitionId: 1, isHidden: true }]);

    const defs = await getMergedDefinitions(25);

    expect(mockFindAllByUserId).toHaveBeenCalledWith(25);
    const overridden = defs.find((d) => d.id === 1);
    if (overridden) {
      expect(overridden.isHidden).toBe(true);
    }
  });

  test("generateForUser returns zero when no rows generated", async () => {
    mockFindAllByUserId.mockResolvedValue([]);
    mockBuildIslamicMasterRowsForYears.mockReturnValue([]);

    const result = await generateForUser(42, [2026], "UTC");

    expect(result).toEqual({ events: [], generatedCount: 0 });
    expect(mockBulkUpsert).not.toHaveBeenCalled();
  });

  test("generateForUser persists rows and updates generated year range", async () => {
    const masters = [{ name: "E1" }, { name: "E2" }];
    const persisted = [{ id: 1 }, { id: 2 }];

    mockFindAllByUserId.mockResolvedValue([]);
    mockBuildIslamicMasterRowsForYears.mockReturnValue(masters);
    mockBulkUpsert.mockResolvedValue(persisted);
    mockFindById.mockResolvedValue({ generatedYearsStart: 2020, generatedYearsEnd: 2023 });

    const result = await generateForUser(42, [2022, 2026], "UTC");

    expect(mockBulkUpsert).toHaveBeenCalledWith(masters, 42);
    expect(mockUpdateGeneratedYearsRange).toHaveBeenCalledWith(42, 2020, 2026);
    expect(result).toEqual({ events: persisted, generatedCount: 2 });
  });

  test("generateForUser includeAll bypasses preference lookup", async () => {
    mockBuildIslamicMasterRowsForYears.mockReturnValue([]);

    await generateForUser(42, [2026], "UTC", true);

    expect(mockFindAllByUserId).not.toHaveBeenCalled();
  });

  test("generateForNewUser delegates to generateForUser for current year", async () => {
    mockFindAllByUserId.mockResolvedValue([]);
    mockBuildIslamicMasterRowsForYears.mockReturnValue([]);

    const result = await generateForNewUser(77);

    expect(result).toEqual({ events: [], generatedCount: 0 });
  });
});
