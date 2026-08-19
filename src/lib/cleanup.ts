import fs from "fs/promises";
import path from "path";

const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");
const PROTECTED_DIR = path.resolve(process.cwd(), "protected");

export async function cleanupFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch {
    /* file already removed or never existed */
  }
}

export async function cleanupExpiredFiles(maxAgeMs: number = 10 * 60 * 1000): Promise<number> {
  let cleaned = 0;
  const now = Date.now();

  for (const dir of [UPLOADS_DIR, PROTECTED_DIR]) {
    try {
      const entries = await fs.readdir(dir);
      for (const entry of entries) {
        const fullPath = path.join(dir, entry);
        try {
          const stat = await fs.stat(fullPath);
          if (now - stat.mtimeMs > maxAgeMs) {
            await fs.unlink(fullPath);
            cleaned++;
          }
        } catch {
          /* skip inaccessible */
        }
      }
    } catch {
      /* dir doesn't exist yet */
    }
  }

  return cleaned;
}

let cleanupInterval: NodeJS.Timeout | null = null;

export function startCleanupWorker(intervalMs: number = 60_000) {
  if (cleanupInterval) return;
  cleanupInterval = setInterval(async () => {
    const cleaned = await cleanupExpiredFiles();
    if (cleaned > 0) {
      console.log(`[cleanup] Removed ${cleaned} expired file(s)`);
    }
  }, intervalMs);
}

export function stopCleanupWorker() {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}
