"use client";

import Link from "next/link";
import { Shield, Terminal } from "lucide-react";

export default function Header() {
  return (
    <header className="glass sticky top-0 z-40 border-b border-border">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent group-hover:bg-accent/20 transition-colors">
            <Shield className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            <span className="gradient-text">XpGroup</span>
            <span className="text-text-muted ml-1.5 font-normal text-sm hidden sm:inline">
              obfuscator
            </span>
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-secondary hover:bg-bg-card hover:text-text-primary transition-colors"
          >
            <Terminal className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
          <Link
            href="/auth/login"
            className="rounded-lg bg-accent/10 px-4 py-2 text-sm font-medium text-accent hover:bg-accent/20 transition-colors"
          >
            Sign In
          </Link>
        </nav>
      </div>
    </header>
  );
}
