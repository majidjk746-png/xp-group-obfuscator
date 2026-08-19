"use client";

import { motion } from "framer-motion";
import {
  Upload,
  Search,
  Cpu,
  Download,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Clock,
} from "lucide-react";
import type { JobResult } from "@/types";

interface Props {
  result: JobResult;
  onDownload: () => void;
  onReset: () => void;
}

const STEPS = [
  { key: "UPLOADING", label: "Uploading", icon: Upload },
  { key: "VALIDATING", label: "Validating PE", icon: Search },
  { key: "QUEUED", label: "Queued", icon: Clock },
  { key: "PROTECTING", label: "Protecting", icon: Cpu },
  { key: "COMPLETED", label: "Complete", icon: Download },
];

const STATUS_ORDER = ["UPLOADING", "VALIDATING", "QUEUED", "PROTECTING", "COMPLETED"];

export default function ProgressTracker({ result, onDownload, onReset }: Props) {
  const isFailed = result.status === "FAILED";
  const isComplete = result.status === "COMPLETED";
  const currentIdx = STATUS_ORDER.indexOf(result.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-bg-card p-6 space-y-6"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-text-primary">
          {isComplete ? "Protection Complete" : isFailed ? "Protection Failed" : "Processing..."}
        </p>
        {result.processingMs && (
          <p className="text-xs text-text-muted">
            {(result.processingMs / 1000).toFixed(1)}s
          </p>
        )}
      </div>

      <div className="flex items-center gap-1">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const isDone = i < currentIdx || (isComplete && i === STEPS.length - 1);
          const isActive = i === currentIdx && !isFailed;
          const isCurrentFailed = isFailed && i === currentIdx;

          return (
            <div key={step.key} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1.5 w-full">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${
                    isDone
                      ? "bg-accent-green/10 text-accent-green"
                      : isCurrentFailed
                        ? "bg-accent-red/10 text-accent-red"
                        : isActive
                          ? "bg-accent/10 text-accent animate-pulse-glow"
                          : "bg-bg-secondary text-text-muted"
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : isCurrentFailed ? (
                    <XCircle className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>
                <span
                  className={`text-[10px] font-medium ${
                    isDone || isActive ? "text-text-primary" : "text-text-muted"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-px flex-1 mx-1 mt-[-16px] ${
                    i < currentIdx ? "bg-accent-green" : "bg-border"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {!isFailed && !isComplete && (
        <div className="w-full h-1.5 rounded-full bg-bg-secondary overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-accent to-accent-glow"
            initial={{ width: "0%" }}
            animate={{ width: `${result.progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      )}

      {isComplete && (
        <div className="space-y-3">
          {result.originalName && (
            <p className="text-xs text-text-muted">
              Output: <span className="text-text-secondary">{result.originalName?.replace(/\.(exe|dll)$/, "_protected$1")}</span>
            </p>
          )}
          <div className="flex gap-3">
            <button
              onClick={onDownload}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-accent py-3 font-semibold text-white hover:bg-accent-glow transition-colors"
            >
              <Download className="h-4 w-4" />
              Download Protected File
            </button>
            <button
              onClick={onReset}
              className="flex items-center justify-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-medium text-text-secondary hover:text-text-primary hover:border-accent/50 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {isFailed && (
        <div className="flex gap-3">
          <button
            onClick={onReset}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-border py-3 font-medium text-text-secondary hover:text-text-primary hover:border-accent/50 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Try Another File
          </button>
        </div>
      )}
    </motion.div>
  );
}
