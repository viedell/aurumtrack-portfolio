import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { Icon } from "@/components/icon";
import { pricesQuery } from "@/lib/queries";
import { fmtCurrency, fmtPct } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/market")({
  head: () => ({ meta: [{ title: "Live Market Data — AurumTrack" }] }),
  loader: ({ context }) => { context.queryClient.ensureQueryData(pricesQuery()); },
  component: Market,
});

const sparklines: Record<string, number[]> = {
  gold:     [40, 45, 42, 50, 55, 53, 58, 62, 60, 65, 70, 68, 72],
  silver:   [55, 52, 50, 48, 51, 49, 47, 45, 48, 46, 44, 42, 45],
  platinum: [30, 33, 35, 38, 40, 42, 45, 48, 50, 53, 55, 58, 60],
  palladium:[60, 58, 55, 50, 48, 45, 42, 40, 38, 35, 33, 30, 28],
};

function Sparkline({ data, positive }: { data: number[]; positive: boolean }) {
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * 100},${100 - ((v - min) / range) * 100}`).join(" ");
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-16">
      <defs>
        <linearGradient id={`grad-${positive ? "u" : "d"}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={positive ? "#10B981" : "#EF4444"} stopOpacity="0.4" />
          <stop offset="100%" stopColor={positive ? "#10B981" : "#EF4444"} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={points} fill="none" stroke={positive ? "#10B981" : "#EF4444"} strokeWidth="2" vectorEffect="non-scaling-stroke" />
      <polygon points={`0,100 ${points} 100,100`} fill={`url(#grad-${positive ? "u" : "d"})`} />
    </svg>
  );
}

function Market() {
  const { data: prices } = useSuspenseQuery(pricesQuery());

  return (
    <AppShell title="Live Market Data">
      <div className="flex items-center gap-3 mb-6">
        <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-stored opacity-75" /><span className="relative inline-flex rounded-full h-3 w-3 bg-status-stored" /></span>
        <p className="font-display text-[11px] tracking-widest text-on-surface-variant uppercase">Live telemetry • Last updated just now</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
        {prices.map((p) => {
          const positive = Number(p.change_pct_24h) >= 0;
          return (
            <div key={p.id} className="glass-panel rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-display text-[11px] tracking-widest text-on-surface-variant uppercase mb-1">{p.metal}</p>
                  <p className="font-mono text-3xl text-on-surface">{fmtCurrency(Number(p.price_usd_per_oz))}</p>
                  <p className="text-xs text-on-surface-variant mt-1">per troy ounce</p>
                </div>
                <div className={`px-3 py-1.5 rounded-full text-sm font-mono ${positive ? "bg-status-stored/15 text-status-stored" : "bg-status-alert/15 text-status-alert"}`}>
                  <Icon name={positive ? "arrow_upward" : "arrow_downward"} size={14} /> {fmtPct(Number(p.change_pct_24h))}
                </div>
              </div>
              <Sparkline data={sparklines[p.metal] ?? sparklines.gold} positive={positive} />
              <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-glass-stroke">
                <div><p className="text-[10px] text-on-surface-variant uppercase tracking-widest">24h Low</p><p className="font-mono text-sm text-on-surface">{fmtCurrency(Number(p.price_usd_per_oz) * 0.985)}</p></div>
                <div><p className="text-[10px] text-on-surface-variant uppercase tracking-widest">24h High</p><p className="font-mono text-sm text-on-surface">{fmtCurrency(Number(p.price_usd_per_oz) * 1.012)}</p></div>
                <div><p className="text-[10px] text-on-surface-variant uppercase tracking-widest">Volume</p><p className="font-mono text-sm text-on-surface">12.4M oz</p></div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="glass-panel rounded-xl p-6 mt-gutter">
        <h3 className="font-display text-lg text-on-surface mb-4">Market Trends</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Safe Haven Demand", value: "Elevated", icon: "trending_up", color: "status-stored" },
            { label: "USD Strength Index", value: "104.2", icon: "currency_exchange", color: "status-transit" },
            { label: "Industrial Demand", value: "Stable", icon: "factory", color: "tertiary-fixed-dim" },
          ].map((t) => (
            <div key={t.label} className="bg-surface-container-high rounded-lg p-4 border border-glass-stroke">
              <Icon name={t.icon} className={`text-${t.color} mb-2 block`} />
              <p className="font-display text-[10px] tracking-widest text-on-surface-variant uppercase">{t.label}</p>
              <p className={`font-display text-lg text-${t.color}`}>{t.value}</p>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
