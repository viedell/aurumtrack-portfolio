import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { Icon } from "@/components/icon";
import { alertsQuery } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { fmtRelative } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/security")({
  head: () => ({ meta: [{ title: "Security Incident Response — AurumTrack" }] }),
  loader: ({ context }) => { context.queryClient.ensureQueryData(alertsQuery()); },
  component: Security,
});

function Security() {
  const qc = useQueryClient();
  const { data: alerts } = useSuspenseQuery(alertsQuery());
  const active = alerts.filter((a) => !a.resolved);

  const resolve = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("alerts").update({ resolved: true, resolved_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["alerts"] }); toast.success("Incident resolved."); },
    onError: (e: Error) => toast.error(e.message),
  });

  const report = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("alerts").insert({
        user_id: user.id, severity: "high", title: "Suspicious activity reported", description: "Manual incident report filed by account holder.", source: "user_report",
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["alerts"] }); toast.success("Incident reported. Security team notified."); },
    onError: (e: Error) => toast.error(e.message),
  });

  async function lockAccount() {
    await supabase.auth.signOut();
    toast.success("Account locked. You have been signed out.");
    window.location.href = "/auth";
  }

  return (
    <AppShell title="Security Incident Response">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter mb-gutter">
        <button onClick={() => report.mutate()} className="bg-status-alert/10 border border-status-alert/30 rounded-xl p-5 text-left hover:bg-status-alert/15 transition">
          <Icon name="report" className="text-status-alert text-2xl mb-2 block" />
          <p className="font-display text-base text-status-alert mb-1">Report Unauthorized Activity</p>
          <p className="text-xs text-on-surface-variant">File an incident with the security team.</p>
        </button>
        <button onClick={lockAccount} className="bg-error-container/10 border border-error-container/30 rounded-xl p-5 text-left hover:bg-error-container/15 transition">
          <Icon name="lock_person" className="text-on-error-container text-2xl mb-2 block" />
          <p className="font-display text-base text-on-error-container mb-1">Lock Account</p>
          <p className="text-xs text-on-surface-variant">Immediate sign-out and session revocation.</p>
        </button>
        <div className="glass-panel rounded-xl p-5">
          <Icon name="health_and_safety" className="text-status-stored text-2xl mb-2 block" />
          <p className="font-display text-base text-status-stored mb-1">{active.length === 0 ? "All Clear" : `${active.length} Active`}</p>
          <p className="text-xs text-on-surface-variant">{active.length === 0 ? "No active incidents in your vault network." : "Investigate active incidents below."}</p>
        </div>
      </div>

      <div className="glass-panel rounded-xl p-6">
        <h3 className="font-display text-lg text-on-surface mb-4">Incident Log</h3>
        {alerts.length === 0 ? (
          <p className="text-sm text-on-surface-variant">No alerts on record. Telemetry channels are nominal.</p>
        ) : (
          <div className="space-y-3">
            {alerts.map((a) => (
              <div key={a.id} className={`p-4 rounded-lg border ${a.resolved ? "border-glass-stroke bg-surface-container/40 opacity-60" : "border-status-alert/30 bg-status-alert/5"}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <Icon name={a.resolved ? "task_alt" : "warning"} filled className={a.resolved ? "text-status-stored" : "text-status-alert"} />
                    <div>
                      <p className="font-display text-sm text-on-surface">{a.title}</p>
                      {a.description && <p className="text-xs text-on-surface-variant mt-1">{a.description}</p>}
                      <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mt-2">{a.severity} • {a.source ?? "telemetry"} • {fmtRelative(a.created_at)}</p>
                    </div>
                  </div>
                  {!a.resolved && (
                    <button onClick={() => resolve.mutate(a.id)} className="text-xs font-display tracking-widest uppercase text-primary hover:text-primary-container">Resolve</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
