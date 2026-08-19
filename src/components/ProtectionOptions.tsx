"use client";

import { motion } from "framer-motion";
import {
  Lock,
  Code2,
  ShieldAlert,
  Bug,
  Eye,
  Cpu,
  KeyRound,
  Layers,
  Target,
} from "lucide-react";
import type { ProtectionOptions as ProtectionOptionsType } from "@/types";

interface Props {
  options: ProtectionOptionsType;
  onChange: (options: ProtectionOptionsType) => void;
}

interface ToggleDef {
  key: keyof ProtectionOptionsType;
  label: string;
  description: string;
  icon: React.ReactNode;
  tier: "basic" | "advanced" | "enterprise";
}

const TOGGLES: ToggleDef[] = [
  {
    key: "stringEncryption",
    label: "String & Number Encryption",
    description: "Encrypts all string literals and constant numbers at rest",
    icon: <Lock className="h-4 w-4" />,
    tier: "basic",
  },
  {
    key: "fieldEncryption",
    label: "Field Encryption",
    description: "Encrypts static and instance field initializers",
    icon: <Lock className="h-4 w-4" />,
    tier: "basic",
  },
  {
    key: "controlFlow",
    label: "Control-Flow Flattening",
    description: "Transforms structured flow into opaque state-machine patterns",
    icon: <Code2 className="h-4 w-4" />,
    tier: "basic",
  },
  {
    key: "nativeStub",
    label: "Native C++ Stub",
    description: "Wraps the assembly in a native launcher; no keys on disk",
    icon: <Cpu className="h-4 w-4" />,
    tier: "advanced",
  },
  {
    key: "antiDebug",
    label: "Anti-Debug",
    description: "Detects and refuses to run under debuggers and trace tools",
    icon: <ShieldAlert className="h-4 w-4" />,
    tier: "advanced",
  },
  {
    key: "antiDump",
    label: "Anti-Dump",
    description: "Prevents memory-dumping tools from extracting the loaded assembly",
    icon: <Eye className="h-4 w-4" />,
    tier: "advanced",
  },
  {
    key: "antiApiHooks",
    label: "Anti-API Hooks",
    description: "Detects inline hooks on ntdll/kernel32 to block API monitors",
    icon: <Bug className="h-4 w-4" />,
    tier: "advanced",
  },
  {
    key: "vmBytecode",
    label: "VM Bytecode Virtualization",
    description: "Translates method bodies into custom virtual-machine opcodes",
    icon: <Layers className="h-4 w-4" />,
    tier: "enterprise",
  },
  {
    key: "selfRefKey",
    label: "Self-Referential Key Derivation",
    description: "Encryption key derived from the stub's own PE headers at runtime",
    icon: <KeyRound className="h-4 w-4" />,
    tier: "enterprise",
  },
];

const TIER_COLORS = {
  basic: "text-accent-cyan",
  advanced: "text-accent-yellow",
  enterprise: "text-accent",
};

const TIER_LABELS = {
  basic: "Basic",
  advanced: "Advanced",
  enterprise: "Enterprise",
};

const PRESETS: { value: ProtectionOptionsType["preset"]; label: string }[] = [
  { value: "none", label: "None" },
  { value: "default", label: "Default" },
  { value: "max", label: "Max" },
  { value: "hide", label: "Hide" },
  { value: "all", label: "All" },
];

export default function ProtectionOptions({ options, onChange }: Props) {
  const toggle = (key: keyof ProtectionOptionsType) => {
    if (key === "preset") return;
    onChange({ ...options, [key]: !options[key] });
  };

  const setPreset = (preset: ProtectionOptionsType["preset"]) => {
    const presetMap: Record<string, Partial<ProtectionOptionsType>> = {
      none: {},
      default: { stringEncryption: true, controlFlow: true },
      max: { stringEncryption: true, fieldEncryption: true, controlFlow: true, nativeStub: true, antiDebug: true, antiDump: true, antiApiHooks: true },
      hide: { stringEncryption: true, fieldEncryption: true, controlFlow: true, vmBytecode: true },
      all: { stringEncryption: true, fieldEncryption: true, controlFlow: true, nativeStub: true, antiDebug: true, antiDump: true, antiApiHooks: true, vmBytecode: true, selfRefKey: true },
    };
    onChange({ ...options, ...presetMap[preset], preset });
  };

  const grouped = {
    basic: TOGGLES.filter((t) => t.tier === "basic"),
    advanced: TOGGLES.filter((t) => t.tier === "advanced"),
    enterprise: TOGGLES.filter((t) => t.tier === "enterprise"),
  };

  return (
    <div className="rounded-2xl border border-border bg-bg-card p-5 space-y-5">
      <div>
        <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">Quick Presets</p>
        <div className="flex gap-2 flex-wrap">
          {PRESETS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPreset(p.value)}
              className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all ${
                options.preset === p.value
                  ? "bg-accent text-white shadow-md shadow-accent/20"
                  : "bg-bg-secondary text-text-secondary hover:text-text-primary hover:bg-bg-card-hover border border-border"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {(["basic", "advanced", "enterprise"] as const).map((tier) => (
        <div key={tier}>
          <p className={`text-xs font-medium uppercase tracking-wider mb-2 ${TIER_COLORS[tier]}`}>
            {TIER_LABELS[tier]} Features
          </p>
          <div className="space-y-1.5">
            {grouped[tier].map((t) => (
              <motion.button
                key={t.key}
                onClick={() => toggle(t.key)}
                whileTap={{ scale: 0.99 }}
                className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition-all ${
                  options[t.key]
                    ? "bg-accent/5 border border-accent/20"
                    : "bg-bg-secondary/50 border border-transparent hover:border-border"
                }`}
              >
                <div className={`shrink-0 ${options[t.key] ? "text-accent" : "text-text-muted"}`}>
                  {t.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium ${options[t.key] ? "text-text-primary" : "text-text-secondary"}`}>
                    {t.label}
                  </p>
                  <p className="text-xs text-text-muted truncate">{t.description}</p>
                </div>
                <div
                  className={`shrink-0 h-5 w-9 rounded-full p-0.5 transition-colors ${
                    options[t.key] ? "bg-accent" : "bg-border"
                  }`}
                >
                  <motion.div
                    className="h-4 w-4 rounded-full bg-white shadow"
                    animate={{ x: options[t.key] ? 16 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
