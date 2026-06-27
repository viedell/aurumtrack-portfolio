export function fmtCurrency(value: number | null | undefined, opts: { compact?: boolean } = {}) {
  if (value == null || isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: opts.compact ? "compact" : "standard",
    maximumFractionDigits: opts.compact ? 1 : 2,
  }).format(value);
}

export function fmtWeight(grams: number | null | undefined) {
  if (grams == null || isNaN(grams)) return "—";
  if (grams >= 1000) return `${(grams / 1000).toFixed(2)} kg`;
  return `${grams.toFixed(0)} g`;
}

export function fmtPct(pct: number | null | undefined) {
  if (pct == null || isNaN(pct)) return "—";
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
}

export function fmtRelative(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 7 * 86400) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString();
}

export function fmtDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}
