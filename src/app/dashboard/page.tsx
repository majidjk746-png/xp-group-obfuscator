"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import UploadZone from "@/components/UploadZone";
import { Shield, FileCode2, Clock, CheckCircle2, XCircle, BarChart3 } from "lucide-react";

interface Job {
  id: string;
  originalName: string;
  status: string;
  protectionTier: string;
  originalSize: number;
  protectedSize: number | null;
  processingMs: number | null;
  createdAt: string;
}

export default function DashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [showUpload, setShowUpload] = useState(false);

  return (
    <div className="min-h-screen grid-bg">
      <Header />
      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
            <p className="text-sm text-text-muted mt-1">Manage your protected assemblies</p>
          </div>
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-glow transition-colors"
          >
            <FileCode2 className="h-4 w-4" />
            New Protection
          </button>
        </div>

        {showUpload && (
          <div className="mb-8">
            <UploadZone />
          </div>
        )}

        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Jobs", value: jobs.length, icon: BarChart3, color: "text-accent" },
            { label: "Protected", value: jobs.filter((j) => j.status === "COMPLETED").length, icon: CheckCircle2, color: "text-accent-green" },
            { label: "Failed", value: jobs.filter((j) => j.status === "FAILED").length, icon: XCircle, color: "text-accent-red" },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="rounded-xl border border-border bg-bg-card p-4">
                <div className="flex items-center gap-3">
                  <Icon className={`h-5 w-5 ${s.color}`} />
                  <div>
                    <p className="text-xs text-text-muted">{s.label}</p>
                    <p className="text-xl font-bold text-text-primary">{s.value}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {jobs.length === 0 && !showUpload && (
          <div className="rounded-2xl border border-dashed border-border p-16 text-center">
            <Shield className="h-12 w-12 text-text-muted mx-auto mb-4" />
            <p className="text-lg font-medium text-text-secondary mb-1">No jobs yet</p>
            <p className="text-sm text-text-muted mb-6">
              Upload your first .NET assembly to get started
            </p>
            <button
              onClick={() => setShowUpload(true)}
              className="rounded-xl bg-accent px-6 py-3 font-semibold text-white hover:bg-accent-glow transition-colors"
            >
              Upload Assembly
            </button>
          </div>
        )}

        {jobs.length > 0 && (
          <div className="space-y-3">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="rounded-xl border border-border bg-bg-card p-4 flex items-center gap-4"
              >
                <FileCode2 className="h-5 w-5 text-accent shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text-primary truncate">{job.originalName}</p>
                  <p className="text-xs text-text-muted">
                    {job.protectionTier} · {(job.originalSize / 1024).toFixed(0)} KB
                    {job.protectedSize && ` → ${(job.protectedSize / 1024).toFixed(0)} KB`}
                    {job.processingMs && ` · ${(job.processingMs / 1000).toFixed(1)}s`}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    job.status === "COMPLETED"
                      ? "bg-accent-green/10 text-accent-green"
                      : job.status === "FAILED"
                        ? "bg-accent-red/10 text-accent-red"
                        : "bg-accent-yellow/10 text-accent-yellow"
                  }`}
                >
                  {job.status}
                </span>
                {job.status === "COMPLETED" && (
                  <a
                    href={`/api/download/${job.id}`}
                    className="rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/20 transition-colors"
                  >
                    Download
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
