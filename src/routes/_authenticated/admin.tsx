import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { Icon } from "@/components/icon";
import { rolesQuery, vaultsQuery, assetsQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "System Administration — AurumTrack" }] }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(rolesQuery());
    context.queryClient.ensureQueryData(vaultsQuery());
    context.queryClient.ensureQueryData(assetsQuery());
  },
  component: Admin,
});

function Admin() {
  const { data: roles } = useSuspenseQuery(rolesQuery());
  const { data: vaults } = useSuspenseQuery(vaultsQuery());
  const { data: assets } = useSuspenseQuery(assetsQuery());
  const isAdmin = roles.includes("admin");

  if (!isAdmin) {
    return (
      <AppShell title="System Administration">
        <div className="glass-panel rounded-xl p-10 text-center max-w-lg mx-auto">
          <Icon name="admin_panel_settings" className="text-on-surface-variant text-5xl mb-4 block" />
          <p className="font-display text-lg text-on-surface mb-2">Administrator Access Required</p>
          <p className="text-sm text-on-surface-variant">You currently hold the <span className="font-mono text-primary">{roles.join(", ") || "user"}</span> role. Contact a system administrator to request elevated privileges.</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="System Administration">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter mb-gutter">
        {[
          { label: "Active Users", value: "—", icon: "group", color: "primary" },
          { label: "Vaults", value: String(vaults.length), icon: "account_balance", color: "tertiary-fixed-dim" },
          { label: "Assets Tracked", value: String(assets.length), icon: "inventory_2", color: "status-stored" },
          { label: "System Health", value: "99.9%", icon: "monitor_heart", color: "status-stored" },
        ].map((s) => (
          <div key={s.label} className="glass-panel rounded-xl p-5">
            <Icon name={s.icon} className={`text-${s.color} mb-2 block`} />
            <p className="font-display text-[10px] tracking-widest text-on-surface-variant uppercase">{s.label}</p>
            <p className="font-display text-2xl text-on-surface">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
        <div className="glass-panel rounded-xl p-6">
          <h3 className="font-display text-lg text-on-surface mb-4">Vault Configuration</h3>
          <div className="space-y-3">
            {vaults.map((v) => (
              <div key={v.id} className="p-3 rounded-lg border border-glass-stroke bg-surface-container-high flex items-center justify-between">
                <div>
                  <p className="font-display text-sm text-primary">{v.name}</p>
                  <p className="font-mono text-xs text-on-surface-variant">{v.code} • {v.location}</p>
                </div>
                <span className="px-2 py-1 rounded-full text-[10px] font-display tracking-widest uppercase bg-status-stored/15 text-status-stored">Active</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-xl p-6">
          <h3 className="font-display text-lg text-on-surface mb-4">System Health</h3>
          {[
            { label: "API Gateway", status: "Operational" },
            { label: "Telemetry Stream", status: "Operational" },
            { label: "Blockchain Anchor", status: "Operational" },
            { label: "IoT Sensors", status: "Operational" },
          ].map((s) => (
            <div key={s.label} className="flex items-center justify-between py-3 border-b border-glass-stroke last:border-0">
              <span className="text-sm text-on-surface-variant">{s.label}</span>
              <span className="flex items-center gap-2 text-status-stored text-xs font-display tracking-widest uppercase">
                <span className="w-2 h-2 rounded-full bg-status-stored animate-pulse" /> {s.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
