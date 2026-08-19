import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs/promises";

const execFileAsync = promisify(execFile);

const XPGROUP_BIN =
  process.env.XPGROUP_BIN ||
  path.resolve(process.cwd(), "..", "XpGroup-v6-main", "XpGroup", "bin", "Release", "XpGroup.exe");

const PROTECT_TIMEOUT_MS = 300_000;

interface ProtectResult {
  success: boolean;
  outputPath: string;
  protectedSize: number;
  processingMs: number;
  error?: string;
  demoMode?: boolean;
}

async function binaryExists(): Promise<boolean> {
  try {
    await fs.access(XPGROUP_BIN, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function runProtection(
  inputPath: string,
  outputPath: string,
  args: string[]
): Promise<ProtectResult> {
  const start = Date.now();

  if (!(await binaryExists())) {
    try {
      const inputStat = await fs.stat(inputPath);
      await fs.copyFile(inputPath, outputPath);
      const outputStat = await fs.stat(outputPath);
      console.warn(`[sandbox] Binary not found at ${XPGROUP_BIN}. Running in DEMO mode (file copied as-is).`);
      return {
        success: true,
        outputPath,
        protectedSize: outputStat.size,
        processingMs: Date.now() - start,
        demoMode: true,
      };
    } catch {
      return {
        success: false,
        outputPath,
        protectedSize: 0,
        processingMs: Date.now() - start,
        error: `XpGroup binary not found at: ${XPGROUP_BIN}. Set XPGROUP_BIN env variable.`,
      };
    }
  }

  const fullArgs = ["--protect", inputPath, outputPath, ...args];

  try {
    await execFileAsync(XPGROUP_BIN, fullArgs, {
      timeout: PROTECT_TIMEOUT_MS,
      maxBuffer: 50 * 1024 * 1024,
      windowsHide: true,
    });

    const stat = await fs.stat(outputPath);

    return {
      success: true,
      outputPath,
      protectedSize: stat.size,
      processingMs: Date.now() - start,
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unknown protection error";
    return {
      success: false,
      outputPath,
      protectedSize: 0,
      processingMs: Date.now() - start,
      error: message,
    };
  }
}

export function buildArgs(
  options: Partial<Record<string, boolean>>,
  preset: string
): string[] {
  const args: string[] = ["--preset", preset || "default"];

  const sets: string[] = [];
  if (options.nativeStub) sets.push("NativeStub=true");
  if (options.vmBytecode) sets.push("VmBytecode=true");
  if (options.selfRefKey) sets.push("SelfRefKey=true");
  if (options.antiDebug) sets.push("AntiDebug=true");
  if (options.antiDump) sets.push("AntiDump=true");
  if (options.antiApiHooks) sets.push("AntiApiHooks=true");

  for (const s of sets) {
    args.push("--set", s);
  }

  return args;
}
