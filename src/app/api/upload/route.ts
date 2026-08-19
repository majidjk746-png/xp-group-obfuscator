import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { z } from "zod";
import { validatePeMagic, parsePeInfo, MAX_FILE_SIZE } from "@/lib/pe-validator";
import { checkUploadLimit } from "@/lib/rate-limit";
import { verifyToken, extractBearerToken } from "@/lib/auth";
import { runProtection, buildArgs } from "@/lib/sandbox";
import { getJobStore } from "@/lib/job-store";
import { inferTier } from "@/types";
import type { ProtectionOptions, UploadResponse } from "@/types";

const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");
const PROTECTED_DIR = path.resolve(process.cwd(), "protected");
const IS_VERCEL = process.env.VERCEL === "1";

const ProtectionOptionsSchema = z.object({
  preset: z.enum(["none", "default", "max", "hide", "all"]).default("default"),
  stringEncryption: z.boolean().default(false),
  fieldEncryption: z.boolean().default(false),
  controlFlow: z.boolean().default(false),
  nativeStub: z.boolean().default(false),
  antiDebug: z.boolean().default(false),
  antiDump: z.boolean().default(false),
  antiApiHooks: z.boolean().default(false),
  vmBytecode: z.boolean().default(false),
  selfRefKey: z.boolean().default(false),
});

function jsonError(error: string, code: string, status: number, details?: string[]) {
  return NextResponse.json({ error, code, details }, { status });
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    const token = extractBearerToken(request);
    let userId = "anonymous";

    if (token) {
      const payload = verifyToken(token);
      if (payload) userId = payload.userId;
    }

    const rateKey = userId === "anonymous"
      ? (request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown")
      : userId;

    const rl = checkUploadLimit(rateKey);
    if (!rl.allowed) {
      return jsonError("Rate limit exceeded. Try again later.", "RATE_LIMITED", 429);
    }

    const contentType = request.headers.get("content-type");
    if (!contentType?.includes("multipart/form-data")) {
      return jsonError("Content-Type must be multipart/form-data", "INVALID_CONTENT_TYPE", 400);
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const optionsRaw = formData.get("options") as string | null;

    if (!file) {
      return jsonError("No file provided", "NO_FILE", 400);
    }

    if (file.size > MAX_FILE_SIZE) {
      return jsonError("File too large (max 100MB)", "FILE_TOO_LARGE", 400);
    }

    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (ext !== ".exe" && ext !== ".dll") {
      return jsonError(
        `Invalid file type "${ext}". Only .exe and .dll allowed.`,
        "INVALID_EXTENSION",
        400
      );
    }

    const headerBuf = Buffer.allocUnsafe(Math.min(8192, file.size));
    const arrayBuf = await file.arrayBuffer();
    Buffer.from(arrayBuf).copy(headerBuf, 0, 0, headerBuf.length);

    const peValidation = validatePeMagic(headerBuf);
    if (!peValidation.valid) {
      return jsonError(peValidation.error!, "INVALID_PE", 400);
    }

    const peInfo = parsePeInfo(headerBuf);

    let options: ProtectionOptions;
    try {
      const parsed = optionsRaw ? JSON.parse(optionsRaw) : {};
      options = ProtectionOptionsSchema.parse(parsed);
    } catch (e) {
      return jsonError(
        "Invalid protection options",
        "INVALID_OPTIONS",
        400,
        e instanceof z.ZodError ? e.issues.map((i: { message: string }) => i.message) : undefined
      );
    }

    const jobId = crypto.randomUUID();
    const store = await getJobStore();
    const fileBytes = new Uint8Array(arrayBuf);

    let inputPath = "";
    let outputPath = "";

    if (!IS_VERCEL) {
      await fs.mkdir(UPLOADS_DIR, { recursive: true }).catch(() => {});
      await fs.mkdir(PROTECTED_DIR, { recursive: true }).catch(() => {});
      inputPath = path.join(UPLOADS_DIR, `${jobId}${ext}`);
      outputPath = path.join(PROTECTED_DIR, `${jobId}_protected${ext}`);
      try {
        await fs.writeFile(inputPath, fileBytes);
      } catch {
        console.warn(`[upload][${requestId}] Could not write file to disk`);
      }
    }

    await store.createJob({
      id: jobId,
      userId,
      status: "QUEUED",
      originalName: file.name,
      originalSize: file.size,
      protectionTier: inferTier(options),
      preset: options.preset,
      stringEncryption: options.stringEncryption,
      fieldEncryption: options.fieldEncryption,
      controlFlow: options.controlFlow,
      nativeStub: options.nativeStub,
      antiDebug: options.antiDebug,
      antiDump: options.antiDump,
      antiApiHooks: options.antiApiHooks,
      vmBytecode: options.vmBytecode,
      selfRefKey: options.selfRefKey,
      originalPath: inputPath || null,
      protectedPath: outputPath || null,
      ipHash: crypto
        .createHash("sha256")
        .update(request.headers.get("x-forwarded-for") || "unknown")
        .digest("hex")
        .slice(0, 16),
      userAgent: request.headers.get("user-agent")?.slice(0, 256) || null,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    if (IS_VERCEL) {
      await store.setJobFile(jobId, fileBytes);
    }

    await store.updateJob(jobId, { status: "PROTECTING" });

    let result;
    if (IS_VERCEL) {
      const start = Date.now();
      await store.setJobFile(jobId + "_protected", fileBytes);
      result = {
        success: true,
        outputPath: "",
        protectedSize: fileBytes.length,
        processingMs: Date.now() - start,
        demoMode: true,
      };
    } else {
      const cliArgs = buildArgs(options as unknown as Record<string, boolean>, options.preset);
      result = await runProtection(inputPath, outputPath, cliArgs);
    }

    if (!result.success) {
      await store.updateJob(jobId, {
        status: "FAILED",
        errorMessage: result.error?.slice(0, 512) || "Protection failed",
        processingMs: result.processingMs,
      });
      if (!IS_VERCEL) await fs.unlink(inputPath).catch(() => {});

      return jsonError("Protection failed", "PROTECTION_FAILED", 500, [result.error || "unknown"]);
    }

    await store.updateJob(jobId, {
      status: "COMPLETED",
      protectedSize: result.protectedSize,
      processingMs: result.processingMs,
      completedAt: new Date(),
    });

    if (!IS_VERCEL) await fs.unlink(inputPath).catch(() => {});

    const response: UploadResponse = {
      jobId,
      status: "QUEUED",
      analysis: {
        fileName: file.name,
        fileSize: file.size,
        is32Bit: peInfo?.is32Bit ?? false,
        is64Bit: peInfo?.is64Bit ?? false,
        machine: peInfo?.machine ?? 0,
        subsystem: peInfo?.subsystem ?? 0,
        sections: peInfo?.sections ?? [],
        isGui: peInfo?.isGui ?? false,
        isDotNet: (peInfo?.sections.includes(".text") ?? false) && (peInfo?.sections.some(s => s.includes("mscorej") || s.includes("CLR")) ?? false),
      },
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        "X-Request-Id": requestId,
        "X-RateLimit-Remaining": String(rl.remaining),
      },
    });
  } catch (error) {
    console.error(`[upload][${requestId}]`, error);
    return jsonError("Internal server error", "INTERNAL_ERROR", 500);
  }
}
