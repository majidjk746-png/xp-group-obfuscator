export interface ProtectionOptions {
  preset: "none" | "default" | "max" | "hide" | "all";
  stringEncryption: boolean;
  fieldEncryption: boolean;
  controlFlow: boolean;
  nativeStub: boolean;
  antiDebug: boolean;
  antiDump: boolean;
  antiApiHooks: boolean;
  vmBytecode: boolean;
  selfRefKey: boolean;
}

export interface PeAnalysis {
  fileName: string;
  fileSize: number;
  is32Bit: boolean;
  is64Bit: boolean;
  machine: number;
  subsystem: number;
  sections: string[];
  isGui: boolean;
  isDotNet: boolean;
  dotNetVersion?: string;
}

export type JobStatus =
  | "UPLOADING"
  | "VALIDATING"
  | "QUEUED"
  | "PROTECTING"
  | "COMPLETED"
  | "FAILED";

export interface JobResult {
  jobId: string;
  status: JobStatus;
  progress: number;
  message?: string;
  downloadUrl?: string;
  originalName?: string;
  protectedSize?: number;
  processingMs?: number;
}

export interface UploadResponse {
  jobId: string;
  analysis: PeAnalysis;
  status: "QUEUED";
  protectedFileBase64?: string;
  protectedChecksum?: string;
}

export interface ApiError {
  error: string;
  code: string;
  details?: string[];
}

export const TIER_MAP: Record<string, keyof typeof TIER_FEATURES> = {
  BASIC: "BASIC",
  ADVANCED: "ADVANCED",
  ENTERPRISE: "ENTERPRISE",
};

export const TIER_FEATURES = {
  BASIC: {
    label: "Basic",
    description: "String & field encryption, control-flow flattening",
    features: ["stringEncryption", "fieldEncryption", "controlFlow"],
  },
  ADVANCED: {
    label: "Advanced",
    description: "Native C++ stub, anti-debug/dump/hooks",
    features: [
      "stringEncryption",
      "fieldEncryption",
      "controlFlow",
      "nativeStub",
      "antiDebug",
      "antiDump",
      "antiApiHooks",
    ],
  },
  ENTERPRISE: {
    label: "Enterprise",
    description: "Full VM bytecode, self-referential key derivation",
    features: [
      "stringEncryption",
      "fieldEncryption",
      "controlFlow",
      "nativeStub",
      "antiDebug",
      "antiDump",
      "antiApiHooks",
      "vmBytecode",
      "selfRefKey",
    ],
  },
} as const;

export function inferTier(options: ProtectionOptions): "BASIC" | "ADVANCED" | "ENTERPRISE" {
  if (options.vmBytecode || options.selfRefKey) return "ENTERPRISE";
  if (options.nativeStub || options.antiDebug || options.antiDump || options.antiApiHooks)
    return "ADVANCED";
  return "BASIC";
}

export function presetFromTier(tier: "BASIC" | "ADVANCED" | "ENTERPRISE"): ProtectionOptions {
  const base: ProtectionOptions = {
    preset: "none",
    stringEncryption: false,
    fieldEncryption: false,
    controlFlow: false,
    nativeStub: false,
    antiDebug: false,
    antiDump: false,
    antiApiHooks: false,
    vmBytecode: false,
    selfRefKey: false,
  };

  const features = TIER_FEATURES[tier].features;
  for (const f of features) {
    (base as unknown as Record<string, boolean>)[f] = true;
  }

  if (tier === "ENTERPRISE") base.preset = "all";
  else if (tier === "ADVANCED") base.preset = "max";
  else base.preset = "default";

  return base;
}
