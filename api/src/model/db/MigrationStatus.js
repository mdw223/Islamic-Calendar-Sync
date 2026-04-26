import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultRepoRoot = path.resolve(__dirname, "..", "..", "..", "..");
const defaultMigrationDir = path.join(defaultRepoRoot, "Sql.Migrations");

function parseSortKey(filename) {
  const match = filename.match(/^(\d+)/);
  if (!match) return Number.MAX_SAFE_INTEGER;
  return Number.parseInt(match[1], 10);
}

function toMigrationId(filename) {
  return filename.replace(/\.sql$/i, "");
}

function getChecksum(sqlText) {
  return crypto.createHash("sha256").update(sqlText, "utf8").digest("hex");
}

export async function readMigrationFiles(options = {}) {
  const migrationDir = options.migrationDir || defaultMigrationDir;
  const files = await fs.readdir(migrationDir);
  const sorted = files
    .filter((name) => name.toLowerCase().endsWith(".sql") && name.toLowerCase() !== "init.sql")
    .sort((a, b) => {
      const aNum = parseSortKey(a);
      const bNum = parseSortKey(b);
      if (aNum !== bNum) return aNum - bNum;
      return a.localeCompare(b);
    });

  const migrations = [];
  for (const filename of sorted) {
    const fullPath = path.join(migrationDir, filename);
    const sql = await fs.readFile(fullPath, "utf8");
    migrations.push({
      id: toMigrationId(filename),
      filename,
      fullPath,
      sql,
      checksum: getChecksum(sql),
    });
  }

  return migrations;
}

export async function getMigrationStatus(client, options = {}) {
  const migrations = await readMigrationFiles(options);
  const appliedRows = await client.query(
    "SELECT MigrationId, AppliedAt FROM SchemaMigration ORDER BY AppliedAt DESC, MigrationId DESC",
  );

  const appliedIds = new Set(appliedRows.rows.map((row) => row.migrationid));
  const pending = migrations.filter((migration) => !appliedIds.has(migration.id));

  return {
    latestKnownMigrationId: migrations[migrations.length - 1]?.id ?? null,
    latestAppliedMigrationId: appliedRows.rows[0]?.migrationid ?? null,
    latestAppliedAt: appliedRows.rows[0]?.appliedat ?? null,
    pendingCount: pending.length,
    pendingMigrationIds: pending.map((item) => item.id),
    isUpToDate: pending.length === 0,
  };
}

export { defaultMigrationDir };
