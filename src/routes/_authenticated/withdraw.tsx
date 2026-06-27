import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Icon } from "@/components/icon";
import { assetsQuery } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { fmtWeight } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/withdraw")({
  head: () => ({ meta: [{ title: "Withdrawal Protocol — AurumTrack" }] }),
  loader: ({ context }) => { context.queryClient.ensureQueryData(assetsQuery()); },
  component: Withdrawal,
});

function Withdrawal() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: assets } = useSuspenseQuery(assetsQuery());
  const stored = assets.filter((a) => a.status === "stored");
  const [assetId, setAssetId] = useState("");
  const [pin, setPin] = useState("");
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!assetId) throw new Error("Select an asset");
      if (pin.length < 4) throw new Error("Enter your 6-digit security key");
      const asset = assets.find((a) => a.id === assetId)!;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const fromVault = asset.vault_id;
      const { error: e1 } = await supabase.from("assets").update({ status: "withdrawn", vault_id: null }).eq("id", assetId);
      if (e1) throw e1;
      const { error: e2 } = await supabase.from("transactions").insert({
        user_id: user.id, asset_id: assetId, asset_name: asset.name, type: "withdrawal",
        from_vault_id: fromVault, weight_g: Number(asset.weight_g), value: Number(asset.current_value ?? asset.purchase_value),
        notes: "Withdrawal authorized via MFA",
      });
      if (e2) throw e2;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assets"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Withdrawal authorized. Asset released.");
      router.navigate({ to: "/audit" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell title="Withdrawal Protocol">
      <div className="max-w-2xl mx-auto space-y-gutter">
        <div className="flex items-center justify-between mb-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex-1 flex items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-display text-sm border ${step >= s ? "bg-primary-container text-on-primary-container border-primary-container glow-gold" : "border-glass-stroke text-on-surface-variant"}`}>{s}</div>
              {s < 3 && <div className={`flex-1 h-0.5 ${step > s ? "bg-primary-container" : "bg-glass-stroke"}`} />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="glass-panel rounded-xl p-6">
            <h3 className="font-display text-lg text-on-surface mb-4">Select stored asset</h3>
            {stored.length === 0 ? <p className="text-sm text-on-surface-variant">No assets currently in vault storage.</p> : (
              <div className="space-y-2">
                {stored.map((a) => (
                  <button key={a.id} onClick={() => setAssetId(a.id)} className={`w-full text-left p-4 rounded-lg border transition ${assetId === a.id ? "border-primary-container bg-primary-container/10" : "border-glass-stroke hover:border-primary/40"}`}>
                    <p className="font-display text-sm text-on-surface">{a.name}</p>
                    <p className="font-mono text-xs text-on-surface-variant">SN: {a.serial_number} • {fmtWeight(Number(a.weight_g))}</p>
                  </button>
                ))}
              </div>
            )}
            <button disabled={!assetId} onClick={() => setStep(2)} className="mt-4 w-full bg-primary-container text-on-primary-container px-6 py-3 rounded-lg font-display uppercase tracking-widest text-sm disabled:opacity-40">Continue</button>
          </div>
        )}

        {step === 2 && (
          <div className="glass-panel rounded-xl p-6 text-center">
            <Icon name="fingerprint" className="text-primary text-6xl mb-4 mx-auto block animate-pulse-glow" />
            <h3 className="font-display text-lg text-on-surface mb-2">Identity Verification</h3>
            <p className="text-sm text-on-surface-variant mb-6">Enter your 6-digit security PIN to authorize this withdrawal.</p>
            <input value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))} type="password" inputMode="numeric"
              className="mx-auto block w-48 bg-surface-dim border border-glass-stroke rounded-lg py-3 px-4 text-center font-mono text-2xl tracking-[0.5em] text-on-surface focus:outline-none focus:border-primary" placeholder="••••••" />
            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(1)} className="flex-1 border border-glass-stroke text-on-surface-variant px-6 py-3 rounded-lg">Back</button>
              <button disabled={pin.length < 4} onClick={() => setStep(3)} className="flex-1 bg-primary-container text-on-primary-container px-6 py-3 rounded-lg font-display uppercase tracking-widest text-sm disabled:opacity-40">Verify</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="glass-panel rounded-xl p-6">
            <h3 className="font-display text-lg text-on-surface mb-4 flex items-center gap-2"><Icon name="warning" className="text-status-transit" /> Final confirmation</h3>
            <p className="text-sm text-on-surface-variant mb-6">This will release the asset from secure storage. The action is irreversible and will be permanently recorded in the audit ledger.</p>
            <button onClick={() => mutation.mutate()} disabled={mutation.isPending}
              className="w-full inline-flex items-center justify-center gap-2 bg-status-alert text-white px-6 py-3 rounded-lg font-display uppercase tracking-widest text-sm hover:bg-status-alert/80 transition disabled:opacity-40">
              <Icon name="outbox" /> {mutation.isPending ? "Releasing…" : "Authorize withdrawal"}
            </button>
            <button onClick={() => setStep(2)} className="mt-3 w-full border border-glass-stroke text-on-surface-variant px-6 py-3 rounded-lg">Back</button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
