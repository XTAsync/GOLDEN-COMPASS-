import {
  Outlet,
  Link,
  createRootRoute,
  HeadContent,
  Scripts,
  useLocation,
} from "@tanstack/react-router";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { NotificationsProvider } from "@/hooks/useNotifications";
import { BottomNav, Sidebar } from "@/components/BottomNav";
import { Toaster } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LoadingSplash } from "@/components/LoadingSplash";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { DisclosureBlock, ModeBanner } from "@/features/settings/DisclosureBlock";

import appCss from "../styles.css?url";

const authRoutes = ["/login", "/signup", "/forgot-password", "/reset-password"];

function NotFoundComponent() {
  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ background: "var(--ink-1)" }}
    >
      <div className="max-w-md text-center">
        <h1 className="t-title" style={{ fontSize: 48 }}>
          404
        </h1>
        <h2 className="t-heading mt-4">Page not found</h2>
        <p className="t-label mt-2">The requested page does not exist.</p>
        <div className="mt-6">
          <Link to="/login" className="btn-primary">
            Return to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Golden Compass — Markets, Education & Demo Investing" },
      {
        name: "description",
        content: "Explore markets, investment education and demo investing with Golden Compass.",
      },
      { name: "author", content: "Golden Compass" },
      { property: "og:site_name", content: "Golden Compass" },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Golden Compass — Markets, Education & Demo Investing" },
      { name: "twitter:title", content: "Golden Compass — Markets, Education & Demo Investing" },
      {
        property: "og:description",
        content: "Market analysis and investing education for Kenya-focused retail investors.",
      },
      {
        name: "twitter:description",
        content: "Market analysis and investing education for Kenya-focused retail investors.",
      },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600&family=Newsreader:wght@400;500&display=swap",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              name: "Golden Compass",
              description:
                "Market analysis and investing education for Kenya-focused retail investors.",
            },
            {
              "@type": "WebSite",
              name: "Golden Compass",
              description: "Market analysis, education and demo investing.",
            },
          ],
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function AppShell() {
  const location = useLocation();
  const { loading: authLoading, user } = useAuth();
  const isAuth = authRoutes.includes(location.pathname);

  if (authLoading && !isAuth) {
    return <LoadingSplash />;
  }

  if (isAuth) {
    return <Outlet />;
  }

  return (
    <div className="app-frame">
      <Sidebar />
      <div className="app-main">
        {user && <ModeBanner />}
        <div className="app-scroll">
          <Outlet />
          <DisclosureBlock />
        </div>
        <BottomNav />
      </div>
    </div>
  );
}

function RootComponent() {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationsProvider>
          <ErrorBoundary>
            <AppShell />
          </ErrorBoundary>
          <Toaster position="top-center" theme="dark" richColors />
        </NotificationsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
