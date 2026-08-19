"use client";

import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileCode2,
  X,
  AlertTriangle,
  CheckCircle2,
  Shield,
  Cpu,
  Lock,
  Bug,
  Zap,
  Eye,
  ChevronDown,
} from "lucide-react";
import ProtectionOptions from "./ProtectionOptions";
import ProgressTracker from "./ProgressTracker";
import type { ProtectionOptions as ProtectionOptionsType, JobResult } from "@/types";

interface UploadedFile {
  file: File;
  preview?: string;
}

export default function UploadZone() {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [options, setOptions] = useState<ProtectionOptionsType>({
    preset: "default",
    stringEncryption: true,
    fieldEncryption: false,
    controlFlow: true,
    nativeStub: false,
    antiDebug: false,
    antiDump: false,
    antiApiHooks: false,
    vmBytecode: false,
    selfRefKey: false,
  });
  const [isUploading, setIsUploading] = useState(false);
  const [jobResult, setJobResult] = useState<JobResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [protectedBase64, setProtectedBase64] = useState<string | null>(null);
  const [protectedChecksum, setProtectedChecksum] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const ALLOWED = [".exe", ".dll"];

  const validateFile = (file: File): string | null => {
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED.includes(ext)) return `Invalid file type "${ext}". Only .exe and .dll are allowed.`;
    if (file.size > 100 * 1024 * 1024) return "File too large. Maximum size is 100MB.";
    if (file.size < 64) return "File too small to be a valid PE assembly.";
    return null;
  };

  const handleFile = useCallback((file: File) => {
    setError(null);
    setJobResult(null);
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setUploadedFile({ file });
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const onDragLeave = useCallback(() => setIsDragOver(false), []);

  const onFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const pollJob = async (jobId: string) => {
    for (let i = 0; i < 120; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      try {
        const res = await fetch(`/api/jobs/${jobId}`);
        if (!res.ok) continue;
        const data: JobResult = await res.json();
        setJobResult(data);
        if (data.status === "COMPLETED" || data.status === "FAILED") return data;
      } catch {
        continue;
      }
    }
    return null;
  };

  const handleUpload = async () => {
    if (!uploadedFile || isUploading) return;
    setIsUploading(true);
    setError(null);
    setJobResult({ jobId: "", status: "UPLOADING", progress: 5 });

    try {
      const fd = new FormData();
      fd.append("file", uploadedFile.file);
      fd.append("options", JSON.stringify(options));

      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      if (data.protectedFileBase64) {
        setProtectedBase64(data.protectedFileBase64);
        setProtectedChecksum(data.protectedChecksum);
        setJobResult({
          jobId: data.jobId,
          status: "COMPLETED",
          progress: 100,
          originalName: uploadedFile.file.name,
          protectedSize: Math.round((data.protectedFileBase64.length * 3) / 4),
          downloadUrl: `data:application/octet-stream;base64,${data.protectedFileBase64}`,
        });
        return;
      }

      setJobResult({ jobId: data.jobId, status: "QUEUED", progress: 30 });
      const result = await pollJob(data.jobId);
      if (result?.status !== "COMPLETED") {
        throw new Error(result?.message || "Protection failed");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setJobResult(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = () => {
    if (protectedBase64 && protectedChecksum) {
      const byteString = atob(protectedBase64);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `protected_${uploadedFile?.file?.name || "file.exe"}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return;
    }
    if (jobResult?.jobId) {
      window.open(`/api/download/${jobResult.jobId}`, "_blank");
    }
  };

  const reset = () => {
    setUploadedFile(null);
    setJobResult(null);
    setError(null);
    setIsUploading(false);
    setProtectedBase64(null);
    setProtectedChecksum(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const activeCount = Object.entries(options).filter(
    ([k, v]) => k !== "preset" && v === true
  ).length;

  return (
    <div className="w-full max-w-3xl mx-auto space-y-5">
      <AnimatePresence mode="wait">
        {!uploadedFile ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`
              relative cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center
              transition-all duration-300
              ${
                isDragOver
                  ? "border-accent bg-accent/5 scale-[1.01]"
                  : "border-border hover:border-accent/50 hover:bg-bg-card/50"
              }
            `}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".exe,.dll"
              className="hidden"
              onChange={onFileInput}
            />
            <motion.div
              animate={isDragOver ? { scale: 1.1, rotate: 2 } : { scale: 1, rotate: 0 }}
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10"
            >
              <Upload className="h-8 w-8 text-accent" />
            </motion.div>
            <p className="text-lg font-semibold text-text-primary mb-1">
              {isDragOver ? "Drop to upload" : "Drag & drop your .NET assembly"}
            </p>
            <p className="text-sm text-text-muted">
              or <span className="text-accent font-medium">browse files</span> — .exe, .dll up to 100MB
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="file"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="rounded-2xl border border-border bg-bg-card p-5"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10">
                <FileCode2 className="h-6 w-6 text-accent" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-text-primary truncate">
                  {uploadedFile.file.name}
                </p>
                <p className="text-sm text-text-muted">
                  {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
                  {" · "}
                  {uploadedFile.file.name.endsWith(".exe") ? "PE Executable" : "Class Library"}
                </p>
              </div>
              {!isUploading && !jobResult && (
                <button
                  onClick={reset}
                  className="rounded-lg p-2 text-text-muted hover:text-accent-red hover:bg-accent-red/10 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {uploadedFile && !jobResult && (
        <>
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="flex w-full items-center justify-between rounded-xl border border-border bg-bg-card p-4 text-left hover:border-accent/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-accent" />
              <div>
                <p className="text-sm font-medium text-text-primary">Protection Settings</p>
                <p className="text-xs text-text-muted">
                  {activeCount} feature{activeCount !== 1 ? "s" : ""} active ·{" "}
                  <span className="text-accent">{options.preset}</span> preset
                </p>
              </div>
            </div>
            <ChevronDown
              className={`h-5 w-5 text-text-muted transition-transform ${showOptions ? "rotate-180" : ""}`}
            />
          </button>

          <AnimatePresence>
            {showOptions && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <ProtectionOptions options={options} onChange={setOptions} />
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="w-full rounded-xl bg-accent py-3.5 font-semibold text-white hover:bg-accent-glow transition-colors disabled:opacity-50 disabled:cursor-not-allowed animate-pulse-glow"
          >
            {isUploading ? "Protecting..." : "Protect Assembly"}
          </button>
        </>
      )}

      {jobResult && !error && (
        <ProgressTracker result={jobResult} onDownload={handleDownload} onReset={reset} />
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl border border-accent-red/30 bg-accent-red/5 p-4"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-accent-red shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-accent-red">Protection Failed</p>
              <p className="text-sm text-text-muted mt-1">{error}</p>
              <button
                onClick={reset}
                className="mt-3 text-sm font-medium text-accent hover:text-accent-glow transition-colors"
              >
                Try another file
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
