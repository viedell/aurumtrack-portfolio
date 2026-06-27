import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Icon } from "@/components/icon";
import { assetsQuery } from "@/lib/queries";
import { fmtCurrency, fmtWeight } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/assets")({
  head: () => ({ meta: [{ title: "Your Assets — AurumTrack" }] }),
  loader: ({ context }) => { context.queryClient.ensureQueryData(assetsQuery()); },
  component: AssetsPage,
});

const types = ["all", "gold", "silver", "platinum", "palladium", "diamond", "other"] as const;

function AssetsPage() {
  const { data: assets } = useSuspenseQuery(assetsQuery());
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<(typeof types)[number]>("all");

  const filtered = assets.filter((a) => {
    if (filter !== "all" && a.asset_type !== filter) return false;
    if (search && !`${a.name} ${a.serial_number}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const statusBadge: Record<string, string> = {
    stored: "bg-status-stored/15 text-status-stored",
    in_transit: "bg-status-transit/15 text-status-transit",
    withdrawn: "bg-surface-container-high text-on-surface-variant",
    pending: "bg-tertiary-container/15 text-tertiary-fixed-dim",
  };

  return (
    <AppShell title="Your Assets">
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary/50" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or serial number"
            className="w-full bg-charcoal-surface/80 border border-glass-stroke rounded-lg py-3 pl-10 pr-4 text-on-surface font-mono text-sm placeholder:text-secondary/40 focus:outline-none focus:border-secondary"
          />
        </div>
        <Link to="/register" className="inline-flex items-center justify-center gap-2 bg-primary-container text-on-primary-container px-5 py-3 rounded-lg font-display text-sm uppercase tracking-widest hover:bg-primary-fixed transition glow-gold">
          <Icon name="add" /> Register
        </Link>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 no-scrollbar">
        {types.map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-4 py-2 rounded-full font-display text-xs tracking-widest uppercase border transition shrink-0 ${
              filter === t ? "bg-primary-container text-on-primary-container border-primary-container" : "border-glass-stroke text-on-surface-variant hover:text-primary"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="glass-panel rounded-xl p-12 text-center">
          <Icon name="inventory_2" className="text-on-surface-variant text-5xl mb-4 block" />
          <p className="font-display text-lg text-on-surface mb-2">No assets found</p>
          <p className="text-sm text-on-surface-variant mb-4">
            {assets.length === 0 ? "Start by registering your first physical asset." : "Try a different filter or search term."}
          </p>
          {assets.length === 0 && (
            <Link to="/register" className="inline-flex items-center gap-2 bg-primary-container text-on-primary-container px-5 py-3 rounded-lg font-display text-sm uppercase tracking-widest">
              <Icon name="add" /> Register asset
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
          {filtered.map((a) => (
            <Link
              key={a.id} to="/assets/$id" params={{ id: a.id }}
              className="glass-panel rounded-xl p-5 hover:bg-charcoal-surface transition group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-lg bg-primary-container/15 border border-primary-container/30 flex items-center justify-center text-primary">
                  <Icon name={a.asset_type === "diamond" ? "diamond" : a.asset_type === "silver" ? "circle" : "toll"} />
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-display tracking-widest uppercase ${statusBadge[a.status] ?? statusBadge.pending}`}>
                  {a.status.replace("_", " ")}
                </span>
              </div>
              <p className="font-display text-base text-on-surface group-hover:text-primary transition truncate">{a.name}</p>
              <p className="font-mono text-xs text-on-surface-variant mb-3 truncate">SN: {a.serial_number}</p>
              <div className="flex justify-between items-end pt-3 border-t border-glass-stroke">
                <div>
                  <p className="font-display text-[10px] tracking-widest text-on-surface-variant uppercase">Weight</p>
                  <p className="font-mono text-sm text-on-surface">{fmtWeight(Number(a.weight_g))}</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-[10px] tracking-widest text-on-surface-variant uppercase">Value</p>
                  <p className="font-mono text-sm text-primary">{fmtCurrency(Number(a.current_value ?? a.purchase_value))}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
