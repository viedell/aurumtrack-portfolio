import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import "@fontsource/sora/600.css";
import "@fontsource/sora/700.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/jetbrains-mono/500.css";

import { reportLovableError } from "../lib/lovable-error-reporting";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-obsidian-base px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl font-bold text-primary">404</h1>
        <h2 className="mt-4 font-display text-xl font-semibold text-on-surface">Signal lost</h2>
        <p className="mt-2 text-sm text-on-surface-variant">
          This vault corridor doesn't exist. Return to the main floor.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary-container px-4 py-2 text-sm font-semibold text-on-primary-container transition hover:bg-primary-fixed"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-obsidian-base px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-xl font-semibold text-on-surface">This page didn't load</h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          A telemetry channel dropped. Try again or return home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="rounded-md bg-primary-container px-4 py-2 text-sm font-semibold text-on-primary-container hover:bg-primary-fixed"
          >
            Try again
          </button>
          <a href="/" className="rounded-md border border-glass-stroke bg-charcoal-surface px-4 py-2 text-sm font-medium text-on-surface hover:bg-surface-container-high">
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "AurumTrack — Precision tracking for precious assets" },
      { name: "description", content: "Institutional-grade vault telemetry and portfolio intelligence for physical precious metals." },
      { name: "author", content: "AurumTrack" },
      { property: "og:title", content: "AurumTrack — Precision tracking for precious assets" },
      { property: "og:description", content: "Institutional-grade vault telemetry and portfolio intelligence for physical precious metals." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#0D0D0D" },
      { name: "twitter:title", content: "AurumTrack — Precision tracking for precious assets" },
      { name: "twitter:description", content: "Institutional-grade vault telemetry and portfolio intelligence for physical precious metals." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/ab770996-ed39-4cf0-909f-bda8005ee58f/id-preview-8db21f4f--4743e51d-ad10-4f99-97ea-ef6eee86ee59.lovable.app-1782627626144.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/ab770996-ed39-4cf0-909f-bda8005ee58f/id-preview-8db21f4f--4743e51d-ad10-4f99-97ea-ef6eee86ee59.lovable.app-1782627626144.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body className="bg-obsidian-base text-on-surface min-h-screen antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => sub.subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster theme="dark" position="top-right" toastOptions={{ style: { background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)", color: "#e5e2e1" } }} />
    </QueryClientProvider>
  );
}
