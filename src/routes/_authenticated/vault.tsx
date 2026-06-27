import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Icon } from "@/components/icon";
import { assetsQuery, vaultsQuery } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { fmtWeight } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/vault")({
  head: () => ({ meta: [{ title: "Vault Deposit — AurumTrack" }] }),
  loader: ({ context }) => { context.queryClient.ensureQueryData(assetsQuery()); context.queryClient.ensureQueryData(vaultsQuery()); },
  component: VaultDeposit,
});

function VaultDeposit() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: assets } = useSuspenseQuery(assetsQuery());
  const { data: vaults } = useSuspenseQuery(vaultsQuery());
  const eligible = assets.filter((a) => a.status !== "withdrawn");
  const [assetId, setAssetId] = useState<string>("");
  const [vaultId, setVaultId] = useState<string>("");

  const mutation = useMutation({
    mutationFn: async () => {
      if (!assetId || !vaultId) throw new Error("Select an asset and a vault");
      const asset = assets.find((a) => a.id === assetId)!;
      const vault = vaults.find((v) => v.id === vaultId)!;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error: e1 } = await supabase.from("assets").update({ status: "stored", vault_id: vaultId }).eq("id", assetId);
      if (e1) throw e1;
      const { error: e2 } = await supabase.from("transactions").insert({
        user_id: user.id, asset_id: assetId, asset_name: asset.name, type: "deposit",
        to_vault_id: vaultId, weight_g: Number(asset.weight_g), value: Number(asset.current_value ?? asset.purchase_value),
        notes: `Deposited to ${vault.name}`,
      });
      if (e2) throw e2;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assets"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Deposit confirmed and ledger updated.");
      router.navigate({ to: "/audit" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const selectedAsset = assets.find((a) => a.id === assetId);
  const selectedVault = vaults.find((v) => v.id === vaultId);

  return (
    <AppShell title="Vault Deposit">
      <div className="max-w-3xl mx-auto space-y-gutter">
        <div className="glass-panel rounded-xl p-6">
          <h3 className="font-display text-lg text-on-surface mb-4 flex items-center gap-2"><Icon name="inventory_2" /> 1. Select asset</h3>
          {eligible.length === 0 ? (
            <p className="text-sm text-on-surface-variant">No eligible assets. Register one first.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-72 overflow-y-auto">
              {eligible.map((a) => (
                <button key={a.id} type="button" onClick={() => setAssetId(a.id)}
                  className={`text-left p-4 rounded-lg border transition ${assetId === a.id ? "border-primary-container bg-primary-container/10 glow-gold" : "border-glass-stroke hover:border-primary/40"}`}>
                  <p className="font-display text-sm text-on-surface">{a.name}</p>
                  <p className="font-mono text-xs text-on-surface-variant">SN: {a.serial_number} • {fmtWeight(Number(a.weight_g))}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="glass-panel rounded-xl p-6">
          <h3 className="font-display text-lg text-on-surface mb-4 flex items-center gap-2"><Icon name="account_balance" /> 2. Choose vault</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {vaults.map((v) => (
              <button key={v.id} type="button" onClick={() => setVaultId(v.id)}
                className={`text-left p-4 rounded-lg border transition ${vaultId === v.id ? "border-primary-container bg-primary-container/10 glow-gold" : "border-glass-stroke hover:border-primary/40"}`}>
                <p className="font-display text-base text-on-surface">{v.name}</p>
                <p className="font-mono text-xs text-on-surface-variant">{v.code}</p>
                <p className="text-sm text-on-surface-variant mt-2 flex items-center gap-1"><Icon name="pin_drop" size={14} /> {v.location}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-xl p-6">
          <h3 className="font-display text-lg text-on-surface mb-4 flex items-center gap-2"><Icon name="task_alt" /> 3. Confirm deposit</h3>
          {selectedAsset && selectedVault ? (
            <div className="bg-surface-container-high rounded-lg p-4 border border-glass-stroke mb-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-[10px] text-on-surface-variant tracking-widest uppercase">Asset</p><p className="text-on-surface">{selectedAsset.name}</p></div>
                <div><p className="text-[10px] text-on-surface-variant tracking-widest uppercase">Destination</p><p className="text-on-surface">{selectedVault.name} • {selectedVault.location}</p></div>
                <div><p className="text-[10px] text-on-surface-variant tracking-widest uppercase">Weight</p><p className="font-mono text-on-surface">{fmtWeight(Number(selectedAsset.weight_g))}</p></div>
                <div><p className="text-[10px] text-on-surface-variant tracking-widest uppercase">Tracking</p><p className="font-mono text-primary">VL-{Date.now().toString(36).toUpperCase().slice(-6)}</p></div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-on-surface-variant mb-4">Select an asset and a vault to continue.</p>
          )}
          <button onClick={() => mutation.mutate()} disabled={!assetId || !vaultId || mutation.isPending}
            className="w-full inline-flex items-center justify-center gap-2 bg-primary-container text-on-primary-container px-6 py-3 rounded-lg font-display uppercase tracking-widest text-sm hover:bg-primary-fixed transition glow-gold disabled:opacity-40">
            <Icon name="lock" /> {mutation.isPending ? "Sealing…" : "Confirm vault deposit"}
          </button>
        </div>
      </div>
    </AppShell>
  );
}
