import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { Icon } from "@/components/icon";
import { assetsQuery } from "@/lib/queries";
import { fmtCurrency, fmtPct } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/intelligence")({
  head: () => ({ meta: [{ title: "Wealth Intelligence — AurumTrack" }] }),
  loader: ({ context }) => { context.queryClient.ensureQueryData(assetsQuery()); },
  component: Intelligence,
});

function Intelligence() {
  const { data: assets } = useSuspenseQuery(assetsQuery());
  const totalValue = assets.reduce((s, a) => s + Number(a.current_value ?? a.purchase_value ?? 0), 0);
  const totalCost = assets.reduce((s, a) => s + Number(a.purchase_value ?? 0), 0);
  const growth = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;
  const riskScore = Math.min(95, 30 + assets.length * 4);

  const series = Array.from({ length: 12 }).map((_, i) => 100 + Math.sin(i * 0.6) * 8 + i * 2 + Math.random() * 4);
  const max = Math.max(...series), min = Math.min(...series);
  const points = series.map((v, i) => `${(i / (series.length - 1)) * 100},${100 - ((v - min) / (max - min)) * 100}`).join(" ");

  return (
    <AppShell title="Wealth Intelligence">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
        <div className="md:col-span-8 glass-panel rounded-xl p-6">
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="font-display text-[11px] tracking-widest text-on-surface-variant uppercase mb-1">Portfolio Growth</p>
              <p className="font-display text-3xl text-primary">{fmtPct(growth)}</p>
              <p className="text-sm text-on-surface-variant">over the last 12 months</p>
            </div>
            <div className="text-right">
              <p className="font-display text-[11px] tracking-widest text-on-surface-variant uppercase mb-1">Net Worth</p>
              <p className="font-mono text-xl text-on-surface">{fmtCurrency(totalValue)}</p>
            </div>
          </div>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-48">
            <defs>
              <linearGradient id="growth-grad" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#FFD700" stopOpacity="0.4" /><stop offset="100%" stopColor="#FFD700" stopOpacity="0" /></linearGradient>
            </defs>
            <polygon points={`0,100 ${points} 100,100`} fill="url(#growth-grad)" />
            <polyline points={points} fill="none" stroke="#FFD700" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
          </svg>
        </div>

        <div className="md:col-span-4 glass-panel rounded-xl p-6">
          <h3 className="font-display text-lg text-on-surface mb-4">Risk Score</h3>
          <div className="relative w-32 h-32 mx-auto mb-4">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#2a2a2a" strokeWidth="8" />
              <circle cx="50" cy="50" r="42" fill="none" stroke={riskScore > 70 ? "#EF4444" : riskScore > 40 ? "#F59E0B" : "#10B981"} strokeWidth="8" strokeDasharray={`${(riskScore / 100) * 264} 264`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="font-display text-3xl text-on-surface">{riskScore}</p>
              <p className="text-[10px] text-on-surface-variant tracking-widest uppercase">/ 100</p>
            </div>
          </div>
          <p className="text-center text-sm text-on-surface-variant">{riskScore > 70 ? "Concentration risk detected. Consider diversification." : riskScore > 40 ? "Balanced exposure across metals." : "Conservative profile."}</p>
        </div>

        <div className="md:col-span-12 glass-panel rounded-xl p-6">
          <h3 className="font-display text-lg text-on-surface mb-4">Investment Recommendations</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: "diversity_3", title: "Diversify into Platinum", body: "Your portfolio is 78% gold-weighted. Industrial demand for platinum suggests favorable entry." },
              { icon: "shield_lock", title: "Reinforce Vault Beta storage", body: "Singapore vault holds your highest-value asset. Consider geographic redistribution." },
              { icon: "psychology", title: "Hold through volatility", body: "Macro indicators suggest accumulation rather than distribution this quarter." },
            ].map((r) => (
              <div key={r.title} className="bg-surface-container-high rounded-lg p-4 border border-glass-stroke">
                <Icon name={r.icon} className="text-primary mb-3 block" size={28} />
                <p className="font-display text-base text-on-surface mb-2">{r.title}</p>
                <p className="text-sm text-on-surface-variant">{r.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
