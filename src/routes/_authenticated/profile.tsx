import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { Icon } from "@/components/icon";
import { profileQuery } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "System Identity — AurumTrack" }] }),
  loader: ({ context }) => { context.queryClient.ensureQueryData(profileQuery()); },
  component: Profile,
});

function Profile() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: profile } = useSuspenseQuery(profileQuery());
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [mfa, setMfa] = useState(false);
  const [biometric, setBiometric] = useState(false);

  useEffect(() => {
    setDisplayName(profile?.display_name ?? "");
    setPhone(profile?.phone ?? "");
    setMfa(profile?.mfa_enabled ?? false);
    setBiometric(profile?.biometric_enabled ?? false);
  }, [profile]);

  const save = useMutation({
    mutationFn: async () => {
      if (!profile?.id) throw new Error("No profile");
      const { error } = await supabase.from("profiles").upsert({
        id: profile.id, display_name: displayName.slice(0, 120), phone: phone.slice(0, 32), mfa_enabled: mfa, biometric_enabled: biometric,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["profile"] }); toast.success("Identity updated."); },
    onError: (e: Error) => toast.error(e.message),
  });

  async function resetPassword() {
    if (!profile?.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(profile.email, { redirectTo: `${window.location.origin}/auth` });
    if (error) toast.error(error.message); else toast.success("Password reset email sent.");
  }

  async function signOut() {
    await qc.cancelQueries(); qc.clear();
    await supabase.auth.signOut();
    router.navigate({ to: "/auth", replace: true });
  }

  return (
    <AppShell title="System Identity">
      <div className="max-w-3xl mx-auto space-y-gutter">
        <div className="glass-panel rounded-xl p-6 flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-primary-container/15 border border-primary-container/30 flex items-center justify-center">
            {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" /> : <Icon name="person" className="text-primary text-4xl" />}
          </div>
          <div className="flex-1">
            <p className="font-display text-xl text-on-surface">{displayName || "Custodian"}</p>
            <p className="font-mono text-sm text-on-surface-variant">{profile?.email}</p>
            <p className="text-xs text-on-surface-variant mt-1 flex items-center gap-1">
              <Icon name={profile?.identity_verified ? "verified" : "pending"} size={14} className={profile?.identity_verified ? "text-status-stored" : "text-status-transit"} />
              {profile?.identity_verified ? "Identity verified" : "Verification pending"}
            </p>
          </div>
        </div>

        <div className="glass-panel rounded-xl p-6 space-y-4">
          <h3 className="font-display text-lg text-on-surface">Profile</h3>
          <label className="block">
            <span className="font-display text-[11px] tracking-widest text-on-surface-variant uppercase block mb-2">Display Name</span>
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={120}
              className="w-full bg-surface-dim border border-glass-stroke rounded-lg py-3 px-4 text-on-surface focus:outline-none focus:border-secondary" />
          </label>
          <label className="block">
            <span className="font-display text-[11px] tracking-widest text-on-surface-variant uppercase block mb-2">Phone</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={32}
              className="w-full bg-surface-dim border border-glass-stroke rounded-lg py-3 px-4 text-on-surface font-mono focus:outline-none focus:border-secondary" />
          </label>
        </div>

        <div className="glass-panel rounded-xl p-6 space-y-4">
          <h3 className="font-display text-lg text-on-surface">Security</h3>
          <ToggleRow icon="key" label="Multi-Factor Authentication" desc="Require a one-time code on every sign-in." value={mfa} onChange={setMfa} />
          <ToggleRow icon="fingerprint" label="Biometric Authentication" desc="Use device biometrics where supported." value={biometric} onChange={setBiometric} />
          <button onClick={resetPassword} className="w-full text-left p-4 rounded-lg border border-glass-stroke hover:border-primary/40 transition flex items-center gap-3">
            <Icon name="lock_reset" className="text-primary" />
            <div className="flex-1">
              <p className="text-sm text-on-surface">Change password</p>
              <p className="text-xs text-on-surface-variant">Send a password reset email.</p>
            </div>
            <Icon name="arrow_forward" className="text-on-surface-variant" />
          </button>
          <button className="w-full text-left p-4 rounded-lg border border-glass-stroke hover:border-primary/40 transition flex items-center gap-3 opacity-70 cursor-not-allowed">
            <Icon name="devices" className="text-primary" />
            <div className="flex-1">
              <p className="text-sm text-on-surface">Manage trusted devices</p>
              <p className="text-xs text-on-surface-variant">Coming soon.</p>
            </div>
          </button>
        </div>

        <div className="flex justify-between gap-3">
          <button onClick={signOut} className="px-5 py-3 rounded-lg border border-status-alert/40 text-status-alert hover:bg-status-alert/10 transition inline-flex items-center gap-2"><Icon name="logout" /> Sign out</button>
          <button onClick={() => save.mutate()} disabled={save.isPending} className="inline-flex items-center gap-2 bg-primary-container text-on-primary-container px-6 py-3 rounded-lg font-display uppercase tracking-widest text-sm hover:bg-primary-fixed transition glow-gold disabled:opacity-60">
            <Icon name="save" /> {save.isPending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </AppShell>
  );
}

function ToggleRow({ icon, label, desc, value, onChange }: { icon: string; label: string; desc: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-4 p-4 rounded-lg border border-glass-stroke cursor-pointer hover:border-primary/40 transition">
      <Icon name={icon} className="text-primary" />
      <div className="flex-1">
        <p className="text-sm text-on-surface">{label}</p>
        <p className="text-xs text-on-surface-variant">{desc}</p>
      </div>
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
      <span className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${value ? "bg-primary-container" : "bg-surface-container-high"}`}>
        <span className={`inline-block h-5 w-5 transform rounded-full bg-on-surface transition ${value ? "translate-x-5" : "translate-x-0.5"}`} />
      </span>
    </label>
  );
}
