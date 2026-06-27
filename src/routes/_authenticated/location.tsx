import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { Icon } from "@/components/icon";
import { vaultsQuery, assetsQuery, transactionsQuery } from "@/lib/queries";
import { fmtDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/location")({
  head: () => ({ meta: [{ title: "Physical Location Tracking — AurumTrack" }] }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(vaultsQuery());
    context.queryClient.ensureQueryData(assetsQuery());
    context.queryClient.ensureQueryData(transactionsQuery(20));
  },
  component: LocationTracking,
});

function LocationTracking() {
  const { data: vaults } = useSuspenseQuery(vaultsQuery());
  const { data: assets } = useSuspenseQuery(assetsQuery());
  const { data: txns } = useSuspenseQuery(transactionsQuery(20));

  return (
    <AppShell title="Physical Location Tracking">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        <div className="lg:col-span-2 glass-panel rounded-xl p-6">
          <h3 className="font-display text-lg text-on-surface mb-4">Global Vault Network</h3>
          <div className="relative aspect-[2/1] rounded-lg bg-surface-container-low border border-glass-stroke overflow-hidden" style={{ backgroundImage: "radial-gradient(circle at 20% 30%, rgba(255,215,0,0.15), transparent 40%), radial-gradient(circle at 75% 60%, rgba(0,241,255,0.10), transparent 40%), linear-gradient(180deg, #0e0e0e, #1A1A1A)" }}>
            {/* Stylized world grid */}
            <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 100 50" preserveAspectRatio="none">
              {Array.from({ length: 10 }).map((_, i) => <line key={`v${i}`} x1={i * 10} y1="0" x2={i * 10} y2="50" stroke="#999077" strokeWidth="0.1" />)}
              {Array.from({ length: 5 }).map((_, i) => <line key={`h${i}`} x1="0" y1={i * 10} x2="100" y2={i * 10} stroke="#999077" strokeWidth="0.1" />)}
            </svg>
            {/* Vault markers — projected naively from lat/lng to demo positions */}
            {vaults.map((v, i) => {
              const x = ((v.longitude ?? 0) + 180) / 360 * 100;
              const y = (90 - (v.latitude ?? 0)) / 180 * 100;
              return (
                <div key={v.id} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${x}%`, top: `${y}%` }}>
                  <span className="relative flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-container opacity-60" style={{ animationDelay: `${i * 0.4}s` }} />
                    <span className="relative inline-flex h-4 w-4 rounded-full bg-primary-container border-2 border-on-primary-container" />
                  </span>
                  <span className="absolute left-5 top-0 whitespace-nowrap font-display text-[10px] tracking-widest text-primary uppercase">{v.code}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-panel rounded-xl p-6">
          <h3 className="font-display text-lg text-on-surface mb-4">Vault Inventory</h3>
          <div className="space-y-3">
            {vaults.map((v) => {
              const count = assets.filter((a) => a.vault_id === v.id).length;
              return (
                <div key={v.id} className="p-3 rounded-lg border border-glass-stroke bg-surface-container-high">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-display text-sm text-primary">{v.name}</p>
                    <span className="font-mono text-sm text-on-surface">{count}</span>
                  </div>
                  <p className="text-xs text-on-surface-variant flex items-center gap-1"><Icon name="pin_drop" size={14} /> {v.location}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-3 glass-panel rounded-xl p-6">
          <h3 className="font-display text-lg text-on-surface mb-4">Movement History</h3>
          <div className="space-y-2">
            {txns.filter((t) => t.from_vault?.name || t.to_vault?.name).slice(0, 10).map((t) => (
              <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border border-transparent hover:border-glass-stroke hover:bg-surface-container/40 transition">
                <div className="flex items-center gap-3">
                  <Icon name="local_shipping" className="text-status-transit" />
                  <div>
                    <p className="text-sm text-on-surface">{t.asset?.name ?? t.asset_name}</p>
                    <p className="text-xs text-on-surface-variant">{t.from_vault?.name ?? "—"} → {t.to_vault?.name ?? "Withdrawn"}</p>
                  </div>
                </div>
                <p className="font-mono text-xs text-on-surface-variant">{fmtDateTime(t.created_at)}</p>
              </div>
            ))}
            {txns.length === 0 && <p className="text-sm text-on-surface-variant">No movements recorded.</p>}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
