import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Icon } from "@/components/icon";

export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) throw redirect({ to: "/portfolio" });
  },
  head: () => ({
    meta: [
      { title: "AurumTrack — Precision tracking for precious assets" },
      { name: "description", content: "Institutional-grade security meets real-time IoT surveillance. A digital twin for your physical wealth repository." },
      { property: "og:title", content: "AurumTrack — Precision tracking for precious assets" },
      { property: "og:description", content: "A digital twin for your physical wealth repository." },
    ],
  }),
  component: Welcome,
});

function Welcome() {
  return (
    <div className="min-h-screen bg-obsidian-base text-on-surface relative overflow-hidden">
      {/* Cinematic background */}
      <div className="absolute inset-0 z-0">
        <div
          className="w-full h-full bg-cover bg-center opacity-40 mix-blend-luminosity"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 30% 30%, rgba(255,215,0,0.25), transparent 55%), radial-gradient(ellipse at 70% 70%, rgba(121,245,255,0.10), transparent 55%), linear-gradient(180deg, #1A1A1A, #0D0D0D)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian-base via-obsidian-base/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-obsidian-base via-transparent to-obsidian-base opacity-80" />
      </div>

      <main className="relative z-10 flex flex-col h-screen max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-10 md:py-12 justify-between">
        {/* Header */}
        <header className="flex justify-between items-center w-full">
          <div className="flex items-center gap-3">
            <Icon name="shield" filled className="text-primary text-[32px]" />
            <h1 className="font-display text-primary tracking-[0.2em] uppercase font-bold text-xl md:text-2xl">AurumTrack</h1>
          </div>
          <Link to="/auth" className="font-display text-sm tracking-widest text-on-surface-variant hover:text-primary uppercase">
            Sign in
          </Link>
        </header>

        {/* Hero */}
        <div className="flex flex-col items-center justify-center text-center max-w-3xl mx-auto space-y-6">
          <h2 className="font-display font-bold text-primary drop-shadow-2xl text-[32px] leading-[1.2] md:text-[56px] md:leading-[1.05] md:tracking-[-0.02em]">
            Precision tracking for precious assets.
          </h2>
          <p className="text-on-surface-variant max-w-xl mx-auto opacity-80 text-lg leading-relaxed">
            Institutional-grade security meets real-time IoT surveillance. A digital twin for your physical wealth repository.
          </p>
          <div className="pt-6">
            <Link
              to="/auth"
              className="inline-flex items-center gap-3 bg-primary-container text-on-primary-container font-display font-semibold text-xl px-8 py-4 rounded-lg shadow-[0_0_30px_rgba(255,215,0,0.25)] hover:bg-primary-fixed hover:scale-105 transition-all duration-300"
            >
              Get Started
              <Icon name="arrow_forward" size={20} />
            </Link>
          </div>
        </div>

        {/* Bottom context card */}
        <div className="glass-panel rounded-xl p-6 md:p-8 max-w-2xl mx-auto w-full">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-surface-container flex items-center justify-center border border-glass-stroke">
              <Icon name="radar" className="text-primary animate-pulse" />
            </div>
            <div className="flex-1">
              <h3 className="font-display text-lg text-primary mb-2">IoT + Finance Integration</h3>
              <p className="text-sm text-on-surface-variant opacity-80 leading-relaxed">
                Secure encrypted telemetry between physical vaults and your digital dashboard. Monitor temperature, kinetic shock and geospatial anomalies in real time.
              </p>
            </div>
            <div className="flex-shrink-0 grid grid-cols-2 gap-2 w-full md:w-auto">
              <div className="bg-surface-container-high border border-glass-stroke p-3 rounded-lg flex flex-col items-center">
                <Icon name="lock" className="text-status-stored text-[20px] mb-1" />
                <span className="font-display text-[10px] tracking-widest text-on-surface-variant uppercase">Secure</span>
              </div>
              <div className="bg-surface-container-high border border-glass-stroke p-3 rounded-lg flex flex-col items-center">
                <Icon name="speed" className="text-tertiary-fixed text-[20px] mb-1" />
                <span className="font-display text-[10px] tracking-widest text-on-surface-variant uppercase">Real-time</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
