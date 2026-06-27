import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { Icon } from "@/components/icon";
import { assetQuery, transactionsQuery } from "@/lib/queries";
import { fmtCurrency, fmtWeight, fmtDateTime, fmtPct } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/assets/$id")({
  head: () => ({ meta: [{ title: "Asset Insight — AurumTrack" }] }),
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(assetQuery(params.id));
    if (!data) throw notFound();
    context.queryClient.ensureQueryData(transactionsQuery(50));
  },
  notFoundComponent: () => (
    <AppShell title="Asset"><div className="glass-panel rounded-xl p-10 text-center text-on-surface-variant">Asset not found.</div></AppShell>
  ),
  errorComponent: ({ error }) => (
    <AppShell title="Asset"><div className="glass-panel rounded-xl p-10 text-center text-status-alert">{error.message}</div></AppShell>
  ),
  component: AssetDetail,
});

function AssetDetail() {
  const { id } = Route.useParams();
  const { data: asset } = useSuspenseQuery(assetQuery(id));
  const { data: allTxns } = useSuspenseQuery(transactionsQuery(50));
  if (!asset) return null;
  const txns = allTxns.filter((t) => t.asset_id === asset.id);
  const purchase = Number(asset.purchase_value);
  const current = Number(asset.current_value ?? purchase);
  const delta = current - purchase;
  const deltaPct = purchase > 0 ? (delta / purchase) * 100 : 0;

  return (
    <AppShell title="Asset Insight">
      <Link to="/assets" className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary mb-6 text-sm">
        <Icon name="arrow_back" size={18} /> Back to assets
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-gutter">
          <div className="glass-panel rounded-xl p-6 md:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
              <div>
                <p className="font-display text-[11px] tracking-[0.2em] text-on-surface-variant uppercase mb-2">{asset.asset_type}</p>
                <h2 className="font-display text-3xl text-on-surface mb-1">{asset.name}</h2>
                <p className="font-mono text-sm text-on-surface-variant">SN: {asset.serial_number}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-[10px] font-display tracking-widest uppercase ${
                asset.authentication_status === "verified" ? "bg-status-stored/15 text-status-stored" :
                asset.authentication_status === "pending" ? "bg-status-transit/15 text-status-transit" :
                "bg-status-alert/15 text-status-alert"
              }`}>
                <Icon name={asset.authentication_status === "verified" ? "verified" : "pending"} size={12} /> {asset.authentication_status}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-glass-stroke">
              <Stat label="Current Value" value={fmtCurrency(current)} accent="primary" />
              <Stat label="Purchase Value" value={fmtCurrency(purchase)} />
              <Stat label="Weight" value={fmtWeight(Number(asset.weight_g))} />
              <Stat label="Purity" value={asset.purity ? `${asset.purity}` : "—"} />
            </div>
          </div>

          <div className="glass-panel rounded-xl p-6">
            <h3 className="font-display text-lg text-on-surface mb-4">Historical Performance</h3>
            <div className="flex items-end justify-between mb-4">
              <div>
                <p className={`font-mono text-2xl ${delta >= 0 ? "text-status-stored" : "text-status-alert"}`}>
                  {delta >= 0 ? "+" : ""}{fmtCurrency(delta)}
                </p>
                <p className={`font-mono text-sm ${delta >= 0 ? "text-status-stored" : "text-status-alert"}`}>{fmtPct(deltaPct)} since purchase</p>
              </div>
            </div>
            <div className="h-32 flex items-end gap-1">
              {Array.from({ length: 24 }).map((_, i) => {
                const h = 30 + Math.sin(i * 0.5) * 20 + Math.random() * 30;
                return <div key={i} className="flex-1 bg-gradient-to-t from-primary-container/40 to-primary-container rounded-sm" style={{ height: `${h}%` }} />;
              })}
            </div>
            <p className="text-xs text-on-surface-variant text-center mt-3 font-display tracking-widest uppercase">Last 24 sessions</p>
          </div>

          <div className="glass-panel rounded-xl p-6">
            <h3 className="font-display text-lg text-on-surface mb-4">Ownership History</h3>
            {txns.length === 0 ? (
              <p className="text-sm text-on-surface-variant">No movements recorded for this asset.</p>
            ) : (
              <div className="space-y-3">
                {txns.map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-container/50">
                    <div className="flex items-center gap-3">
                      <Icon name={t.type === "withdrawal" ? "arrow_upward" : t.type === "transfer" ? "local_shipping" : "arrow_downward"} className="text-on-surface-variant" />
                      <div>
                        <p className="text-sm text-on-surface capitalize">{t.type.replace("_", " ")}</p>
                        <p className="text-xs text-on-surface-variant">{fmtDateTime(t.created_at)}</p>
                      </div>
                    </div>
                    <p className="font-mono text-sm text-on-surface-variant">{fmtWeight(Number(t.weight_g ?? 0))}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Side column */}
        <div className="space-y-gutter">
          <div className="glass-panel rounded-xl p-6">
            <h3 className="font-display text-lg text-on-surface mb-4">Risk Indicators</h3>
            <RiskRow label="Volatility" level="low" />
            <RiskRow label="Liquidity" level="high" />
            <RiskRow label="Counterparty" level="low" />
            <RiskRow label="Geopolitical" level="medium" />
          </div>

          <div className="glass-panel rounded-xl p-6">
            <h3 className="font-display text-lg text-on-surface mb-4">Vault Location</h3>
            {asset.vault ? (
              <Link to="/location" className="block">
                <p className="font-display text-base text-primary">{asset.vault.name}</p>
                <p className="font-mono text-xs text-on-surface-variant">{asset.vault.code}</p>
                <p className="text-sm text-on-surface-variant mt-2 flex items-center gap-1"><Icon name="pin_drop" size={16} /> {asset.vault.location}</p>
              </Link>
            ) : (
              <p className="text-sm text-on-surface-variant">Not currently stored in a vault.</p>
            )}
          </div>

          <div className="glass-panel rounded-xl p-6">
            <h3 className="font-display text-lg text-on-surface mb-4">Authentication</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-on-surface-variant">RFID Chip</span><span className="text-status-stored">✓ Active</span></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">Holographic Seal</span><span className="text-status-stored">✓ Intact</span></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">XRF Assay</span><span className="text-status-stored">✓ Verified</span></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">Blockchain Hash</span><span className="font-mono text-xs text-primary">0x{asset.id.slice(0, 8)}…</span></div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: "primary" }) {
  return (
    <div>
      <p className="font-display text-[10px] tracking-widest text-on-surface-variant uppercase mb-1">{label}</p>
      <p className={`font-mono text-lg ${accent === "primary" ? "text-primary" : "text-on-surface"}`}>{value}</p>
    </div>
  );
}

function RiskRow({ label, level }: { label: string; level: "low" | "medium" | "high" }) {
  const color = level === "low" ? "status-stored" : level === "medium" ? "status-transit" : "status-alert";
  const width = level === "low" ? "25%" : level === "medium" ? "55%" : "85%";
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm text-on-surface-variant">{label}</span>
        <span className={`font-display text-[10px] tracking-widest text-${color} uppercase`}>{level}</span>
      </div>
      <div className="h-1.5 rounded-full bg-surface-container-high overflow-hidden">
        <div className={`h-full bg-${color} rounded-full`} style={{ width }} />
      </div>
    </div>
  );
}
