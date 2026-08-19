"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Shield, Mail, Lock, User, AlertTriangle } from "lucide-react";
import Header from "@/components/Header";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      localStorage.setItem("token", data.token);
      router.push("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid-bg">
      <Header />
      <main className="flex items-center justify-center py-20 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-2xl border border-border bg-bg-card p-8"
        >
          <div className="flex items-center justify-center mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10">
              <Shield className="h-6 w-6 text-accent" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-center mb-6">Create Account</h1>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-accent-red/5 border border-accent-red/20 p-3 mb-4 text-sm text-accent-red">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-border bg-bg-secondary pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none transition-colors"
                  placeholder="Your name (optional)"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-border bg-bg-secondary pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none transition-colors"
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-border bg-bg-secondary pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none transition-colors"
                  placeholder="Min 8 characters"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-accent py-3 font-semibold text-white hover:bg-accent-glow transition-colors disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="text-center text-sm text-text-muted mt-6">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-accent hover:text-accent-glow transition-colors font-medium">
              Sign in
            </Link>
          </p>
        </motion.div>
      </main>
    </div>
  );
}
