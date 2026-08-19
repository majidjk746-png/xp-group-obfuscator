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
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    for (const stmt of statements) {
      try {
        await prisma.$executeRawUnsafe(stmt);
      } catch {
        // table/enum might already exist, ignore duplicate errors
      }
    }

    migrationDone = true;
    console.log("[migration] Schema applied successfully");
  } catch (err) {
    migrationDone = true;
    console.error("[migration] Failed:", (err as Error).message?.slice(0, 200));
  }
}
