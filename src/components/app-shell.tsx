import { Link, useRouter } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Icon } from "./icon";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

const navItems = [
  { to: "/portfolio", icon: "dashboard", label: "Portfolio" },
  { to: "/assets", icon: "inventory_2", label: "Assets" },
  { to: "/market", icon: "trending_up", label: "Market" },
  { to: "/intelligence", icon: "insights", label: "Intel" },
  { to: "/vault", icon: "account_balance", label: "Vault" },
  { to: "/withdraw", icon: "outbox", label: "Withdraw" },
  { to: "/location", icon: "pin_drop", label: "Location" },
  { to: "/audit", icon: "receipt_long", label: "Audit" },
  { to: "/security", icon: "shield", label: "Security" },
  { to: "/admin", icon: "admin_panel_settings", label: "Admin" },
  { to: "/profile", icon: "person", label: "Profile" },
] as const;

const mobileNav = [
  { to: "/portfolio", icon: "dashboard", label: "Dashboard" },
  { to: "/market", icon: "trending_up", label: "Market" },
  { to: "/assets", icon: "inventory_2", label: "Assets" },
  { to: "/security", icon: "notifications", label: "Alerts" },
  { to: "/profile", icon: "person", label: "Profile" },
] as const;

export function AppShell({ children, title }: { children: ReactNode; title?: string }) {
  const router = useRouter();
  const qc = useQueryClient();

  async function handleSignOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    router.navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-obsidian-base text-on-surface relative">
      {/* Top bar */}
      <nav className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-margin-mobile md:px-margin-desktop h-16 bg-charcoal-surface/80 backdrop-blur-md border-b border-glass-stroke">
        <Link to="/portfolio" className="flex items-center gap-3">
          <Icon name="shield" filled className="text-primary text-[28px]" />
          <span className="font-display font-bold tracking-[0.18em] text-primary uppercase text-sm md:text-base">AurumTrack</span>
        </Link>
        {title && <h1 className="hidden md:block font-display text-xl text-on-surface">{title}</h1>}
        <div className="flex items-center gap-2">
          <Link to="/security" className="relative p-2 rounded-full text-on-surface-variant hover:bg-glass-stroke hover:text-primary transition">
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-status-alert rounded-full border border-charcoal-surface" />
            <Icon name="notifications_active" />
          </Link>
          <Link to="/profile" className="p-2 rounded-full text-on-surface-variant hover:bg-glass-stroke hover:text-primary transition">
            <Icon name="person" />
          </Link>
          <button onClick={handleSignOut} className="hidden md:inline-flex p-2 rounded-full text-on-surface-variant hover:bg-glass-stroke hover:text-status-alert transition" aria-label="Sign out">
            <Icon name="logout" />
          </button>
        </div>
      </nav>

      {/* Desktop side rail */}
      <aside className="hidden md:flex fixed left-0 top-16 bottom-0 w-20 flex-col items-center py-6 gap-1 bg-charcoal-surface/70 backdrop-blur-md border-r border-glass-stroke z-30 overflow-y-auto no-scrollbar">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="flex flex-col items-center justify-center w-16 py-3 rounded-lg text-on-surface-variant/70 hover:text-primary hover:bg-glass-stroke transition group"
            activeProps={{ className: "flex flex-col items-center justify-center w-16 py-3 rounded-lg text-primary bg-primary-container/10 glow-gold" }}
          >
            <Icon name={item.icon} />
            <span className="font-display text-[10px] tracking-widest mt-1 uppercase">{item.label}</span>
          </Link>
        ))}
      </aside>

      {/* Main */}
      <main className="pt-20 pb-28 md:pb-12 md:pl-24 max-w-container-max mx-auto px-margin-mobile md:px-8">
        {title && (
          <header className="md:hidden mb-6">
            <h1 className="font-display text-2xl text-on-surface">{title}</h1>
          </header>
        )}
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex justify-around items-center px-4 py-2 bg-charcoal-surface/90 backdrop-blur-xl border-t border-glass-stroke rounded-t-xl">
        {mobileNav.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="flex flex-col items-center justify-center px-3 py-1 text-secondary/60 hover:text-primary/80 active:scale-90 transition"
            activeProps={{ className: "flex flex-col items-center justify-center px-3 py-1 text-primary bg-primary-container/10 rounded-xl glow-gold" }}
          >
            <Icon name={item.icon} />
            <span className="font-display text-[10px] tracking-widest mt-1 uppercase">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function GlassCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={`glass-panel rounded-xl ${className ?? ""}`}>{children}</div>
  );
}
