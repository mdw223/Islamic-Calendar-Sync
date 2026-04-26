import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import pkg from "pg";
import { getMigrationStatus, readMigrationFiles } from "../src/model/db/MigrationStatus.js";

const { Pool } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");

function parseEnvLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return null;
  const idx = trimmed.indexOf("=");
  if (idx <= 0) return null;
  const key = trimmed.slice(0, idx).trim();
  let value = trimmed.slice(idx + 1).trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  return { key, value };
}

async function loadEnvFromFile(envPath) {
  try {
    const text = await fs.readFile(envPath, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const parsed = parseEnvLine(line);
      if (!parsed) continue;
      if (process.env[parsed.key] == null) {
        process.env[parsed.key] = parsed.value;
      }
    }
  } catch {
    // No .env file is fine when environment variables are provided externally.
  }
}

await loadEnvFromFile(path.join(repoRoot, ".env"));
const { dbConfig } = await import("../src/config.js");

function createPool(host) {
  return new Pool({
    host,
    user: dbConfig.USER,
    password: dbConfig.PASSWORD,
    database: dbConfig.DATABASE,
    port: Number(dbConfig.PORT) || 5432,
  });
}

let pool = createPool(dbConfig.HOST);

async function withClient(work) {
  try {
    const client = await pool.connect();
    try {
      return await work(client);
    } finally {
      client.release();
    }
  } catch (err) {
    const canFallbackToLocalhost =
      err?.code === "ENOTFOUND" &&
      dbConfig.HOST === "database";

    if (!canFallbackToLocalhost) {
      throw err;
    }

    await pool.end().catch(() => {});
    pool = createPool("localhost");
    console.warn(
      "DB host 'database' was not resolvable from local shell. Retrying with host 'localhost'.",
    );

    const client = await pool.connect();
    try {
      return await work(client);
    } finally {
      client.release();
    }
  }
}

async function ensureSchemaMigrationTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS SchemaMigration (
      MigrationId VARCHAR(255) PRIMARY KEY,
      Checksum VARCHAR(64) NOT NULL,
      AppliedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      AppliedBy VARCHAR(255) NOT NULL DEFAULT CURRENT_USER
    );
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_schemamigration_appliedat
    ON SchemaMigration (AppliedAt DESC);
  `);
}

async function applyMigrations() {
  await withClient(async (client) => {
    await ensureSchemaMigrationTable(client);
    const migrations = await readMigrationFiles();

    for (const migration of migrations) {
      const existing = await client.query(
        "SELECT Checksum FROM SchemaMigration WHERE MigrationId = $1",
        [migration.id],
      );

      if (existing.rowCount > 0) {
        const appliedChecksum = existing.rows[0].checksum;
        if (appliedChecksum === migration.checksum) {
          console.log(`SKIP ${migration.filename}`);
          continue;
        }

        if (
          appliedChecksum === "legacy" ||
          appliedChecksum === "init-baseline" ||
          String(appliedChecksum).startsWith("sha256:")
        ) {
          await client.query(
            "UPDATE SchemaMigration SET Checksum = $1 WHERE MigrationId = $2",
            [migration.checksum, migration.id],
          );
          console.log(`UPDATED CHECKSUM ${migration.filename}`);
          continue;
        }

        throw new Error(
          `Checksum mismatch for ${migration.id}. Applied=${appliedChecksum} Current=${migration.checksum}`,
        );
      }

      await client.query("BEGIN");
      try {
        await client.query(migration.sql);
        await client.query(
          "INSERT INTO SchemaMigration (MigrationId, Checksum) VALUES ($1, $2)",
          [migration.id, migration.checksum],
        );
        await client.query("COMMIT");
        console.log(`APPLIED ${migration.filename}`);
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      }
    }
  });
}

async function showStatus() {
  await withClient(async (client) => {
    await ensureSchemaMigrationTable(client);
    const status = await getMigrationStatus(client);

    console.log("Latest known migration:", status.latestKnownMigrationId ?? "none");
    console.log("Latest applied migration:", status.latestAppliedMigrationId ?? "none");
    console.log("Pending count:", status.pendingCount);

    if (status.pendingCount > 0) {
      console.log("Pending migrations:");
      for (const id of status.pendingMigrationIds) {
        console.log(`- ${id}`);
      }
    }
  });
}

async function main() {
  const command = (process.argv[2] ?? "status").toLowerCase();

  if (command !== "up" && command !== "status") {
    throw new Error(`Unknown command: ${command}. Use 'up' or 'status'.`);
  }

  if (command === "up") {
    await applyMigrations();
  } else {
    await showStatus();
  }
}

main()
  .catch((err) => {
    console.error("Migration command failed:", err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
