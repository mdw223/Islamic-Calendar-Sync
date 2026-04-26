import fs from "fs/promises";
import os from "os";
import path from "path";
import { getMigrationStatus, readMigrationFiles } from "./MigrationStatus.js";

describe("MigrationStatus", () => {
  test("readMigrationFiles excludes init.sql and sorts by numeric prefix", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "ics-migrations-"));
    try {
      await fs.writeFile(path.join(tempDir, "init.sql"), "-- init\n", "utf8");
      await fs.writeFile(path.join(tempDir, "010_third.sql"), "SELECT 10;\n", "utf8");
      await fs.writeFile(path.join(tempDir, "001_first.sql"), "SELECT 1;\n", "utf8");
      await fs.writeFile(path.join(tempDir, "002_second.sql"), "SELECT 2;\n", "utf8");

      const migrations = await readMigrationFiles({ migrationDir: tempDir });

      expect(migrations.map((m) => m.filename)).toEqual([
        "001_first.sql",
        "002_second.sql",
        "010_third.sql",
      ]);
      expect(migrations.map((m) => m.id)).toEqual([
        "001_first",
        "002_second",
        "010_third",
      ]);
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  test("getMigrationStatus returns pending migration details correctly", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "ics-migrations-"));
    try {
      await fs.writeFile(path.join(tempDir, "001_first.sql"), "SELECT 1;\n", "utf8");
      await fs.writeFile(path.join(tempDir, "002_second.sql"), "SELECT 2;\n", "utf8");
      await fs.writeFile(path.join(tempDir, "003_third.sql"), "SELECT 3;\n", "utf8");

      const client = {
        query: async () => ({
          rows: [
            { migrationid: "002_second", appliedat: new Date("2026-01-02T00:00:00Z") },
            { migrationid: "001_first", appliedat: new Date("2026-01-01T00:00:00Z") },
          ],
        }),
      };

      const status = await getMigrationStatus(client, { migrationDir: tempDir });

      expect(status.latestKnownMigrationId).toBe("003_third");
      expect(status.latestAppliedMigrationId).toBe("002_second");
      expect(status.pendingCount).toBe(1);
      expect(status.pendingMigrationIds).toEqual(["003_third"]);
      expect(status.isUpToDate).toBe(false);
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });
});
