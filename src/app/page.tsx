import Header from "@/components/Header";
import UploadZone from "@/components/UploadZone";
import { Shield, Lock, Cpu, Eye, Zap, Code2 } from "lucide-react";

const FEATURES = [
  {
    icon: Lock,
    title: "String & Field Encryption",
    description: "Every string literal and constant encrypted with AES-256, decrypted only at runtime.",
  },
  {
    icon: Code2,
    title: "Control-Flow Flattening",
    description: "Structured code transformed into opaque state-machine patterns that defeat decompilers.",
  },
  {
    icon: Cpu,
    title: "Native C++ Stub",
    description: "Wraps .NET in a native launcher with self-referential key derivation. No key on disk.",
  },
  {
    icon: Shield,
    title: "Anti-Debug & Anti-Hook",
    description: "Detects debuggers, API monitors, and inline hooks. Refuses to run under analysis.",
  },
  {
    icon: Eye,
    title: "VM Bytecode Virtualization",
    description: "Method bodies translated into custom virtual-machine opcodes. Impossible to decompile.",
  },
  {
    icon: Zap,
    title: "Instant Processing",
    description: "Upload, configure, and download your protected assembly in seconds.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen grid-bg">
      <Header />

      <main>
        <section className="relative overflow-hidden py-24 sm:py-32">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_50%,rgba(99,102,241,0.08),transparent)]" />
          <div className="relative mx-auto max-w-4xl px-4 sm:px-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-4 py-1.5 text-xs font-medium text-accent mb-8">
              <Shield className="h-3.5 w-3.5" />
              Zero-Trust Protection Pipeline
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-6">
              <span className="gradient-text">.NET Obfuscator</span>
              <br />
              <span className="text-text-primary">Built for Adversaries</span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-text-secondary mb-12">
              Upload your .NET assemblies. We encrypt, virtualize, and wrap them in native stubs
              with self-referential keys — making automated reverse engineering impractical.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 sm:px-6 pb-12">
          <UploadZone />
        </section>

        <section className="mx-auto max-w-6xl px-4 sm:px-6 py-20">
          <h2 className="text-2xl font-bold text-center mb-12">
            Protection <span className="gradient-text">Layers</span>
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="rounded-2xl border border-border bg-bg-card p-6 hover:border-accent/30 transition-colors group"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent mb-4 group-hover:bg-accent/15 transition-colors">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-text-primary mb-1">{f.title}</h3>
                  <p className="text-sm text-text-muted leading-relaxed">{f.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        <footer className="border-t border-border py-8 text-center text-xs text-text-muted">
          <p>XpGroup Obfuscator — Professional .NET Assembly Protection</p>
        </footer>
      </main>
    </div>
  );
}
