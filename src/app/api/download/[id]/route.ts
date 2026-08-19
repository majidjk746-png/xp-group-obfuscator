import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { verifyToken, extractBearerToken } from "@/lib/auth";
import { getJobStore } from "@/lib/job-store";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const store = await getJobStore();
  const job = await store.getJob(id);

  if (!job || job.status !== "COMPLETED") {
    return NextResponse.json(
      { error: "File not ready or not found", code: "NOT_FOUND" },
      { status: 404 }
    );
  }

  if (job.expiresAt && new Date() > job.expiresAt) {
    return NextResponse.json(
      { error: "File expired. Re-upload to get a new copy.", code: "EXPIRED" },
      { status: 410 }
    );
  }

  const token = extractBearerToken(request);
  const payload = token ? verifyToken(token) : null;
  if (payload && job.userId !== payload.userId && job.userId !== "anonymous") {
    return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
  }

  if (!job.protectedPath) {
    return NextResponse.json({ error: "No output file", code: "NO_FILE" }, { status: 500 });
  }

  try {
    const fileBytes = await fs.readFile(job.protectedPath);
    const ext = path.extname(job.originalName || ".exe");
    const baseName = path.basename(job.originalName || "protected", ext);
    const downloadName = `${baseName}_protected${ext}`;

    const headers = new Headers();
    headers.set("Content-Type", "application/octet-stream");
    headers.set("Content-Disposition", `attachment; filename="${downloadName}"`);
    headers.set("Content-Length", String(fileBytes.length));
    headers.set("X-Checksum-SHA256", crypto.createHash("sha256").update(fileBytes).digest("hex"));
    headers.set("Cache-Control", "no-store, no-cache, must-revalidate");

    return new NextResponse(fileBytes, { status: 200, headers });
  } catch {
    return NextResponse.json(
      { error: "File not found on disk", code: "FILE_MISSING" },
      { status: 404 }
    );
  }
}
