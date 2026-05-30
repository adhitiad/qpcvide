import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteLoaderData,
} from "react-router";

import type { Route } from "./+types/root";
import { TooltipProvider } from "~/components/ui/tooltip";
import { AntiAdBlock } from "~/components/AntiAdBlock";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";
import { PrivacyConsentBanner } from "~/components/PrivacyConsentBanner";
import "./app.css";

import { prisma } from "~/lib/db.server";
import { getUser } from "~/lib/auth.server";
import { getLocale, getDictionary, supportedLocales } from "~/lib/i18n.server";
import { I18nProvider } from "~/context/I18nContext";

export const headers: Route.HeadersFunction = () => {
  return {
    "Content-Security-Policy":
      "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://pagead2.googlesyndication.com https://connect.facebook.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; frame-src 'self' https://player4me.com https://filemoon.sx https://dood.la; connect-src 'self' https://*.supabase.co wss://*.supabase.co; font-src 'self'; media-src 'self';",
  };
};

export const meta: Route.MetaFunction = () => {
  return [
    { title: "Auiso — Global Adult Video Platform" },
    {
      name: "description",
      content:
        "Auiso is your premium global adult video platform for high-quality streaming.",
    },
    { name: "robots", content: "index, follow" },
    { property: "og:site_name", content: "Auiso" },
    { property: "og:type", content: "website" },
    { property: "og:image", content: "/logo.png" }, // Assuming a default logo exists
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:site", content: "@auiso" },
  ];
};

export async function loader({ request }: Route.LoaderArgs) {
  const authUser = await getUser(request);
  const userId = authUser?.id;

  let user = null;
  if (userId) {
    user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, email: true, role: true },
    });
  }

  const locale = await getLocale(request);
  const dictionary = await getDictionary(locale);

  return {
    googleAdsId: process.env.GOOGLE_ADS_CLIENT_ID,
    fbPixelId: process.env.FB_ADS_PIXEL_ID,
    gaMeasurementId: process.env.GA_MEASUREMENT_ID,
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    vapidPublicKey: process.env.VAPID_PUBLIC_KEY,
    user,
    origin: new URL(request.url).origin,
    pathname: new URL(request.url).pathname,
    locale,
    dictionary,
  };
}

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap",
  },
];

export const Layout = ({
  children,
  loaderData,
}: {
  children: React.ReactNode;
  loaderData?: any;
}) => {
  const routeLoaderData = useRouteLoaderData<typeof loader>("root");
  const data = loaderData || routeLoaderData || {};

  const isAgeVerified = data?.isAgeVerified ?? true;
  const googleAdsId = data?.googleAdsId;
  const fbPixelId = data?.fbPixelId;
  const gaMeasurementId = data?.gaMeasurementId;
  const locale = data?.locale || "en";
  const dictionary = data?.dictionary || {};
  const supabaseUrl = data?.supabaseUrl;
  const supabaseAnonKey = data?.supabaseAnonKey;
  const vapidPublicKey = data?.vapidPublicKey;
  const origin = data?.origin;
  const pathname = data?.pathname || "/";
  const user = data?.user;

  // Determine base path without language prefix
  const pathParts = pathname.split("/").filter(Boolean);
  if (supportedLocales.includes(pathParts[0] as any)) {
    pathParts.shift();
  }
  const cleanPath = "/" + pathParts.join("/");

  return (
    <html lang={locale} className="dark">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        
        {/* Hreflang Links */}
        {origin && supportedLocales.map((l) => (
          <link
            key={l}
            rel="alternate"
            hrefLang={l}
            href={`${origin}/${l}${cleanPath === "/" ? "" : cleanPath}`}
          />
        ))}
        {origin && (
          <link rel="alternate" hrefLang="x-default" href={`${origin}${cleanPath}`} />
        )}

        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0A0A0F" />

        {/* Global JSON-LD */}
        {origin && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: "Auiso",
                url: origin,
                potentialAction: {
                  "@type": "SearchAction",
                  target: `${origin}/search?q={search_term_string}`,
                  "query-input": "required name=search_term_string",
                },
              }),
            }}
          />
        )}

        {/* Google Analytics 4 (GA4) */}
        {gaMeasurementId && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
            ></script>
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${gaMeasurementId}', {
                    page_path: window.location.pathname,
                  });
                `,
              }}
            />
          </>
        )}

        {/* Google AdSense */}
        {googleAdsId && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${googleAdsId}`}
            crossOrigin="anonymous"
          ></script>
        )}

        {/* Facebook Pixel */}
        {fbPixelId && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${fbPixelId}');
                fbq('track', 'PageView');
              `,
            }}
          />
        )}
      </head>
      <body className="font-sans flex flex-col min-h-screen">
        <I18nProvider locale={locale} dictionary={dictionary}>
          <Header />
          <main className="flex-1 flex flex-col">
            <TooltipProvider>{children}</TooltipProvider>
          </main>
          <Footer />

          {user?.role !== "premium" && user?.role !== "admin" && (
            <AntiAdBlock />
          )}
          <PrivacyConsentBanner />
        </I18nProvider>
        <ScrollRestoration />
        <script src="/js/fingerprint.js" defer></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (document.referrer) {
                  // Only track if it looks like a search engine or external site
                  // Wait for fingerprint to be ready
                  const trackReferrer = async () => {
                    let fp = window.__auiso_fp || localStorage.getItem("auiso_fp");
                    if (!fp && window.getFingerprint) {
                      fp = await window.getFingerprint();
                    }
                    if (fp) {
                      fetch('/api/search-referrer', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ fingerprint: fp, referrerUrl: document.referrer })
                      }).catch(console.error);
                    }
                  };
                  // Small delay to ensure fingerprint.js has initialized
                  setTimeout(trackReferrer, 500);
                }
              })();
            `,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.ENV = ${JSON.stringify({
                SUPABASE_URL: supabaseUrl,
                SUPABASE_ANON_KEY: supabaseAnonKey,
                VAPID_PUBLIC_KEY: vapidPublicKey,
              })};
              
              // Unregister ALL Service Workers to clear stale PWA caches and fix reload loops
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(registrations) {
                  for(let registration of registrations) {
                    registration.unregister();
                  }
                });
              }
              // Clear all caches just in case
              if ('caches' in window) {
                caches.keys().then(function(names) {
                  for (let name of names) {
                    caches.delete(name);
                  }
                });
              }

              // Handle PWA Install Prompt
              window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                window.deferredPrompt = e;
                // You can trigger a custom UI here to show "Install App"
              });
            `,
          }}
        />
        <Scripts />
      </body>
    </html>
  );
};

export default function App({ loaderData }: Route.ComponentProps) {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-night-bg">
      <div className="text-center p-8 bg-night-card rounded-2xl border border-night-border max-w-md">
        <h1 className="text-4xl font-serif font-bold text-night-accent mb-4">
          {message}
        </h1>
        <p className="text-night-muted mb-4">{details}</p>
        {stack && (
          <pre className="w-full p-4 overflow-x-auto text-left text-sm bg-night-bg rounded-lg border border-night-border">
            <code className="text-night-muted">{stack}</code>
          </pre>
        )}
      </div>
    </main>
  );
}
