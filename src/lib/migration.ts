import fs from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";

let migrationDone = false;

export async function ensureMigration(): Promise<void> {
  if (migrationDone) return;

  const migrationSqlPath = path.resolve(
    process.cwd(),
    "prisma",
    "migrations",
    "20260819000000_init",
    "migration.sql"
  );

  try {
    await fs.access(migrationSqlPath);
  } catch {
    migrationDone = true;
    return;
  }

  try {
    const sql = await fs.readFile(migrationSqlPath, "utf-8");

    const statements = sql
      .split(";")
      .map((s) =>
        s
          .split("\n")
          .filter((line) => !line.trim().startsWith("--"))
          .join("\n")
          .trim()
      )
      .filter((s) => s.length > 0);

    let applied = 0;
    let skipped = 0;

    for (const stmt of statements) {
      try {
        await prisma.$executeRawUnsafe(stmt);
        applied++;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (
          msg.includes("already exists") ||
          msg.includes("duplicate") ||
          msg.includes("does not exist")
        ) {
          skipped++;
        } else {
          console.error("[migration] Statement failed:", msg.slice(0, 200));
          console.error("[migration] SQL:", stmt.slice(0, 200));
          skipped++;
        }
      }
    }

    migrationDone = true;
    console.log(`[migration] Done: ${applied} applied, ${skipped} skipped`);
  } catch (err) {
    migrationDone = true;
    console.error("[migration] Failed:", (err as Error).message?.slice(0, 200));
  }
}
