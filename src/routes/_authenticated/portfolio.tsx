import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AppShell, GlassCard } from "@/components/app-shell";
import { Icon } from "@/components/icon";
import { assetsQuery, transactionsQuery, pricesQuery, alertsQuery } from "@/lib/queries";
import { fmtCurrency, fmtPct, fmtWeight, fmtRelative } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/portfolio")({
  head: () => ({ meta: [{ title: "Portfolio Overview — AurumTrack" }] }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(assetsQuery());
    context.queryClient.ensureQueryData(transactionsQuery(8));
    context.queryClient.ensureQueryData(pricesQuery());
    context.queryClient.ensureQueryData(alertsQuery());
  },
  component: PortfolioOverview,
});

function PortfolioOverview() {
  const { data: assets } = useSuspenseQuery(assetsQuery());
  const { data: txns } = useSuspenseQuery(transactionsQuery(8));
  const { data: prices } = useSuspenseQuery(pricesQuery());
  const { data: alerts } = useSuspenseQuery(alertsQuery());

  const totalValue = assets.reduce((s, a) => s + Number(a.current_value ?? a.purchase_value ?? 0), 0);
  const totalWeight = assets.reduce((s, a) => s + Number(a.weight_g ?? 0), 0);
  const activeAlerts = alerts.filter((a) => !a.resolved);

  const byType = assets.reduce<Record<string, number>>((acc, a) => {
    const v = Number(a.current_value ?? a.purchase_value ?? 0);
    acc[a.asset_type] = (acc[a.asset_type] ?? 0) + v;
    return acc;
  }, {});

  const palette: Record<string, string> = {
    gold: "bg-primary-container", silver: "bg-secondary", platinum: "bg-tertiary-container",
    palladium: "bg-status-transit", diamond: "bg-tertiary-fixed-dim", other: "bg-surface-container-highest",
  };

  return (
    <AppShell title="Portfolio Overview">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
        {/* Total value hero */}
        <section className="md:col-span-12 relative overflow-hidden glass-panel rounded-xl p-6 md:p-10 flex flex-col items-center text-center">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-container/5 to-transparent pointer-events-none" />
          <p className="font-display text-[11px] tracking-[0.2em] text-on-surface-variant uppercase mb-2">Total Portfolio Value</p>
          <h2 className="font-display font-bold text-primary text-[32px] md:text-[48px] leading-[1.1] tracking-[-0.02em] drop-shadow-[0_0_30px_rgba(255,246,223,0.35)]">
            {fmtCurrency(totalValue)}
          </h2>
          <div className="flex items-center gap-2 mt-4 bg-surface-container-low/50 px-3 py-1.5 rounded-full border border-glass-stroke">
            <Icon name="scale" filled className="text-status-stored text-sm" />
            <span className="font-mono text-sm text-status-stored">{fmtWeight(totalWeight)}</span>
            <span className="text-on-surface-variant text-sm ml-1">across {assets.length} assets</span>
          </div>
        </section>

        {/* Market snapshots */}
        <section className="md:col-span-12">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg text-on-surface">Market Snapshots</h3>
            <Link to="/market" className="font-display text-[11px] tracking-widest text-on-surface-variant hover:text-primary uppercase">Live data →</Link>
          </div>
          <div className="flex overflow-x-auto gap-4 pb-2 snap-x no-scrollbar">
            {prices.map((p) => (
              <div key={p.id} className="min-w-[180px] snap-center glass-soft rounded-lg p-4 shadow-lg flex flex-col shrink-0 hover:bg-charcoal-surface/80 transition cursor-pointer">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-display text-[11px] tracking-widest text-primary uppercase">{p.metal}</span>
                  <Icon name="toll" className="text-primary/50 text-[18px]" />
                </div>
                <span className="font-mono text-lg text-on-surface">{fmtCurrency(Number(p.price_usd_per_oz))}</span>
                <span className={`font-mono text-xs mt-1 ${Number(p.change_pct_24h) >= 0 ? "text-status-stored" : "text-status-alert"}`}>
                  {fmtPct(Number(p.change_pct_24h))}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Alerts + Quick actions */}
        <div className="md:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-gutter">
          <section className="bg-error-container/10 border border-error-container/30 backdrop-blur-[20px] rounded-xl p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-status-alert" />
            <div className="flex items-center gap-3 mb-3">
              <div className="relative">
                <Icon name="warning" filled className="text-status-alert" />
                <span className="absolute inset-0 bg-status-alert rounded-full blur-md opacity-40 animate-subtle-pulse" />
              </div>
              <h3 className="font-display text-lg text-on-error-container">Active Alerts ({activeAlerts.length})</h3>
            </div>
            <p className="text-sm text-on-surface-variant mb-4">
              {activeAlerts[0]?.description ?? "All systems nominal. No incidents reported across your vault network."}
            </p>
            <Link to="/security" className="inline-flex items-center gap-1 font-display text-[11px] tracking-widest text-status-alert hover:text-white uppercase">
              Investigate <Icon name="arrow_forward" size={14} />
            </Link>
          </section>

          <section className="glass-panel rounded-xl p-5 flex flex-col justify-between">
            <h3 className="font-display text-lg text-on-surface mb-4">Quick Actions</h3>
            <div className="grid grid-cols-4 gap-3">
              <Link to="/vault" className="bg-primary-container text-on-primary-container rounded-lg p-3 flex flex-col items-center gap-2 hover:bg-primary transition glow-gold">
                <Icon name="download" size={24} />
                <span className="font-display text-[10px] tracking-widest uppercase">Deposit</span>
              </Link>
              <Link to="/register" className="bg-surface-container-high border border-glass-stroke text-secondary hover:text-primary rounded-lg p-3 flex flex-col items-center gap-2 hover:bg-surface-container-highest transition">
                <Icon name="add_box" size={24} />
                <span className="font-display text-[10px] tracking-widest uppercase">Register</span>
              </Link>
              <Link to="/withdraw" className="bg-surface-container-high border border-glass-stroke text-secondary hover:text-primary rounded-lg p-3 flex flex-col items-center gap-2 hover:bg-surface-container-highest transition">
                <Icon name="upload" size={24} />
                <span className="font-display text-[10px] tracking-widest uppercase">Withdraw</span>
              </Link>
              <Link to="/audit" className="bg-surface-container-high border border-glass-stroke text-secondary hover:text-primary rounded-lg p-3 flex flex-col items-center gap-2 hover:bg-surface-container-highest transition">
                <Icon name="summarize" size={24} />
                <span className="font-display text-[10px] tracking-widest uppercase">Audit</span>
              </Link>
            </div>
          </section>
        </div>

        {/* Asset allocation */}
        <section className="md:col-span-6 glass-panel rounded-xl p-5">
          <h3 className="font-display text-lg text-on-surface mb-4">Asset Allocation</h3>
          {Object.keys(byType).length === 0 ? (
            <p className="text-sm text-on-surface-variant">No assets registered yet. <Link to="/register" className="text-primary hover:underline">Register your first asset</Link>.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(byType).map(([type, value]) => {
                const pct = (value / totalValue) * 100;
                return (
                  <div key={type}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="font-display text-xs tracking-widest text-on-surface-variant uppercase">{type}</span>
                      <span className="font-mono text-sm text-on-surface">{fmtCurrency(value)} <span className="text-on-surface-variant text-xs">({pct.toFixed(1)}%)</span></span>
                    </div>
                    <div className="h-2 rounded-full bg-surface-container-high overflow-hidden">
                      <div className={`h-full ${palette[type] ?? "bg-primary-container"} rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Recent movements */}
        <section className="md:col-span-6 glass-panel rounded-xl p-5">
          <div className="flex items-center justify-between mb-4 border-b border-glass-stroke pb-3">
            <h3 className="font-display text-lg text-on-surface">Recent Movements</h3>
            <Link to="/audit" className="font-display text-[11px] tracking-widest text-secondary hover:text-primary uppercase">View all</Link>
          </div>
          {txns.length === 0 ? (
            <p className="text-sm text-on-surface-variant">No recorded movements yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {txns.map((t) => {
                const isOut = t.type === "withdrawal";
                const color = t.type === "deposit" ? "status-stored" : t.type === "withdrawal" ? "status-alert" : "status-transit";
                return (
                  <div key={t.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-container/50 transition border border-transparent hover:border-glass-stroke">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full bg-${color}/10 flex items-center justify-center text-${color}`}>
                        <Icon name={isOut ? "arrow_upward" : t.type === "transfer" ? "local_shipping" : "arrow_downward"} filled />
                      </div>
                      <div>
                        <p className="text-sm text-on-surface font-medium">{t.asset?.name ?? t.asset_name ?? "Asset"}</p>
                        <p className="text-xs text-on-surface-variant capitalize">{t.type} {t.to_vault?.name ? `• ${t.to_vault.name}` : ""}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-mono text-sm text-${color}`}>{isOut ? "-" : "+"}{fmtWeight(Number(t.weight_g ?? 0))}</p>
                      <p className="font-mono text-xs text-on-surface-variant">{fmtRelative(t.created_at)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
