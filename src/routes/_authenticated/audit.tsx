import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Icon } from "@/components/icon";
import { transactionsQuery } from "@/lib/queries";
import { fmtCurrency, fmtWeight, fmtDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/audit")({
  head: () => ({ meta: [{ title: "Audit Ledger — AurumTrack" }] }),
  loader: ({ context }) => { context.queryClient.ensureQueryData(transactionsQuery(100)); },
  component: AuditLedger,
});

const filters = ["all", "deposit", "withdrawal", "transfer", "registration", "ownership_change"] as const;

function AuditLedger() {
  const { data: txns } = useSuspenseQuery(transactionsQuery(100));
  const [filter, setFilter] = useState<(typeof filters)[number]>("all");
  const filtered = filter === "all" ? txns : txns.filter((t) => t.type === filter);

  return (
    <AppShell title="Audit Ledger">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-2"><Icon name="verified_user" className="text-status-stored" /><p className="text-sm text-on-surface-variant">Immutable ledger • {txns.length} records</p></div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {filters.map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-full font-display text-[10px] tracking-widest uppercase border whitespace-nowrap transition ${filter === f ? "bg-primary-container text-on-primary-container border-primary-container" : "border-glass-stroke text-on-surface-variant hover:text-primary"}`}>
              {f.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-container-high border-b border-glass-stroke">
              <tr className="text-left font-display text-[10px] tracking-widest text-on-surface-variant uppercase">
                <th className="p-4">Timestamp</th>
                <th className="p-4">Type</th>
                <th className="p-4">Asset</th>
                <th className="p-4">From → To</th>
                <th className="p-4 text-right">Weight</th>
                <th className="p-4 text-right">Value</th>
                <th className="p-4">Hash</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-on-surface-variant">No transactions recorded.</td></tr>
              ) : filtered.map((t) => (
                <tr key={t.id} className="border-b border-glass-stroke/50 hover:bg-surface-container/40 transition">
                  <td className="p-4 font-mono text-xs text-on-surface-variant whitespace-nowrap">{fmtDateTime(t.created_at)}</td>
                  <td className="p-4"><span className={`px-2 py-1 rounded-full text-[10px] font-display tracking-widest uppercase ${
                    t.type === "deposit" ? "bg-status-stored/15 text-status-stored" :
                    t.type === "withdrawal" ? "bg-status-alert/15 text-status-alert" :
                    t.type === "transfer" ? "bg-status-transit/15 text-status-transit" :
                    "bg-tertiary-container/15 text-tertiary-fixed-dim"
                  }`}>{t.type.replace("_", " ")}</span></td>
                  <td className="p-4 text-on-surface">{t.asset?.name ?? t.asset_name ?? "—"}</td>
                  <td className="p-4 text-on-surface-variant text-xs">{t.from_vault?.name ?? "—"} → {t.to_vault?.name ?? "—"}</td>
                  <td className="p-4 font-mono text-right text-on-surface">{fmtWeight(Number(t.weight_g ?? 0))}</td>
                  <td className="p-4 font-mono text-right text-primary">{fmtCurrency(Number(t.value ?? 0))}</td>
                  <td className="p-4 font-mono text-[10px] text-on-surface-variant">0x{t.id.slice(0, 8)}…</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
