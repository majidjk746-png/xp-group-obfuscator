import { NextRequest, NextResponse } from "next/server";
import { verifyToken, extractBearerToken } from "@/lib/auth";
import { getJobStore } from "@/lib/job-store";
import type { JobResult } from "@/types";

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

  const result: JobResult = {
    jobId: job.id,
    status: job.status as JobResult["status"],
    progress: progressMap[job.status] ?? 0,
    originalName: job.originalName || undefined,
    protectedSize: job.protectedSize || undefined,
    processingMs: job.processingMs || undefined,
  };

  if (job.status === "COMPLETED") {
    result.downloadUrl = `/api/download/${job.id}`;
    result.message = "Protection complete. Ready for download.";
  } else if (job.status === "FAILED") {
    result.message = job.errorMessage || "Protection failed";
  }

  return NextResponse.json(result, {
    headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
  });
}
