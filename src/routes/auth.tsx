import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Icon } from "@/components/icon";
import { toast } from "sonner";
import { z } from "zod";

const schema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(6, "Min 6 characters").max(72),
});

export const Route = createFileRoute("/auth")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) throw redirect({ to: "/portfolio" });
  },
  head: () => ({
    meta: [{ title: "Secure Access — AurumTrack" }, { name: "description", content: "Authenticate to your AurumTrack vault dashboard." }],
  }),
  component: SecureAccess,
});

function SecureAccess() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [biometric, setBiometric] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parse = schema.safeParse({ email, password });
    if (!parse.success) { toast.error(parse.error.issues[0].message); return; }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/portfolio`, data: { biometric_preference: biometric } },
        });
        if (error) throw error;
        toast.success("Vault account created. Welcome to AurumTrack.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      router.navigate({ to: "/portfolio" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  async function onGoogle() {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) { toast.error("Google sign-in failed"); setLoading(false); return; }
    if (result.redirected) return;
    router.navigate({ to: "/portfolio" });
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: "radial-gradient(circle at center, #1A1A1A 0%, #0D0D0D 100%)" }}>
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-container rounded-full mix-blend-screen filter blur-[100px] opacity-20" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-tertiary-container rounded-full mix-blend-screen filter blur-[100px] opacity-10" />
      </div>

      <main className="w-full max-w-md px-margin-mobile relative z-10">
        <div className="glass-panel rounded-xl p-8 flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-surface-container flex items-center justify-center mb-6 animate-pulse-glow relative border border-primary/20 overflow-hidden">
            <Icon name="shield" filled className="text-primary text-5xl" />
            <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
              <div className="w-full h-1 bg-primary/50 absolute left-0 animate-scan" />
            </div>
          </div>
          <h1 className="font-display text-2xl text-primary tracking-tight mb-2 text-center">AurumTrack</h1>
          <p className="text-on-surface-variant text-sm mb-8 text-center">Secure Institutional Access</p>

          <form className="w-full space-y-5" onSubmit={onSubmit}>
            <div className="space-y-2">
              <label className="font-display text-[11px] tracking-[0.1em] text-on-surface-variant block uppercase">Identity Reference</label>
              <div className="relative">
                <Icon name="person" className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary/50" />
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  placeholder="admin@vault.local"
                  className="w-full bg-surface-dim border border-glass-stroke rounded-lg py-3 pl-10 pr-4 text-on-surface font-mono text-sm placeholder:text-secondary/30 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="font-display text-[11px] tracking-[0.1em] text-on-surface-variant block uppercase">Security Key</label>
                <button type="button" className="font-display text-[11px] tracking-[0.1em] text-primary hover:text-primary-container uppercase">Forgot PIN?</button>
              </div>
              <div className="relative">
                <Icon name="key" className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary/50" />
                <input
                  type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
                  placeholder="••••••••"
                  className="w-full bg-surface-dim border border-glass-stroke rounded-lg py-3 pl-10 pr-10 text-on-surface font-mono text-sm placeholder:text-secondary/30 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/20"
                />
                <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary/50 hover:text-secondary">
                  <Icon name={showPw ? "visibility" : "visibility_off"} />
                </button>
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer select-none pt-1">
              <input type="checkbox" checked={biometric} onChange={(e) => setBiometric(e.target.checked)} className="sr-only" />
              <span className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${biometric ? "bg-primary-container" : "bg-surface-container-high"}`}>
                <span className={`inline-block h-5 w-5 transform rounded-full bg-on-surface transition ${biometric ? "translate-x-5" : "translate-x-0.5"}`} />
              </span>
              <span className="flex items-center gap-2 text-sm text-on-surface-variant">
                <Icon name="face" className="text-secondary" /> Enable biometric authentication
              </span>
            </label>

            <button
              type="submit" disabled={loading}
              className="w-full bg-primary-container text-on-primary py-3 rounded-lg font-display font-semibold text-base hover:bg-primary-fixed active:scale-95 transition shadow-[0_0_20px_rgba(255,215,0,0.2)] disabled:opacity-60"
            >
              {loading ? "Authenticating…" : mode === "signin" ? "Access Vault" : "Create Vault Account"}
            </button>

            <button type="button" onClick={onGoogle} disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 border border-glass-stroke rounded-lg hover:bg-glass-stroke transition text-on-surface text-sm">
              <Icon name="login" className="text-secondary" /> Continue with Google
            </button>

            <p className="text-center text-xs text-on-surface-variant pt-2">
              {mode === "signin" ? "New custodian? " : "Already have access? "}
              <button type="button" onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="text-primary hover:text-primary-container font-semibold">
                {mode === "signin" ? "Create account" : "Sign in"}
              </button>
            </p>
          </form>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 opacity-60">
          <Icon name="lock" className="text-status-stored text-sm" />
          <span className="font-mono text-[11px] text-secondary tracking-wide uppercase">Secured by AES-256 &amp; Blockchain Audit</span>
        </div>
      </main>
    </div>
  );
}
