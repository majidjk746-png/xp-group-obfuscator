import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { verifyToken, extractBearerToken } from "@/lib/auth";
import { getJobStore } from "@/lib/job-store";
import type { JobResult } from "@/types";

const IS_VERCEL = process.env.VERCEL === "1";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const token = extractBearerToken(request);
  const payload = token ? verifyToken(token) : null;

  const store = await getJobStore();
  const job = await store.getJob(id);

  if (!job) {
    return NextResponse.json({ error: "Job not found", code: "NOT_FOUND" }, { status: 404 });
  }

  if (payload && job.userId !== payload.userId && job.userId !== "anonymous") {
    return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
  }

  const progressMap: Record<string, number> = {
    UPLOADING: 10,
    VALIDATING: 20,
    QUEUED: 30,
    PROTECTING: 60,
    COMPLETED: 100,
    FAILED: 100,
  };

  const result: JobResult & { protectedFileBase64?: string; checksum?: string } = {
    jobId: job.id,
    status: job.status as JobResult["status"],
    progress: progressMap[job.status] ?? 0,
    originalName: job.originalName || undefined,
    protectedSize: job.protectedSize || undefined,
    processingMs: job.processingMs || undefined,
  };

  if (job.status === "COMPLETED") {
    result.message = "Protection complete. Ready for download.";

    if (IS_VERCEL) {
      const fileBytes = await store.getJobFile(id + "_protected");
      if (fileBytes) {
        result.protectedFileBase64 = Buffer.from(fileBytes).toString("base64");
        result.checksum = crypto.createHash("sha256").update(fileBytes).digest("hex");
      }
    } else {
      result.downloadUrl = `/api/download/${job.id}`;
    }
  } else if (job.status === "FAILED") {
    result.message = job.errorMessage || "Protection failed";
  }

  return NextResponse.json(result, {
    headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
  });
}
