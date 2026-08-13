import type { Metadata } from "next";
import localFont from "next/font/local";
import { ThemeProvider } from "@/components/theme-provider";
import { SiteHeader } from "@/components/layout/site-header";
import { ViewAsUserBanner } from "@/components/layout/view-mode-toggle";
import {
  getSessionUser,
  isActualCommissioner,
  isCommissioner,
  isViewingAsUser,
} from "@/lib/auth";
import { APP_NAME } from "@/lib/constants";
import {
  buildShareMetadata,
  DEFAULT_OG_IMAGE_PATH,
  getSiteUrl,
  SITE_DESCRIPTION,
} from "@/lib/site";
import "./globals.css";

// Self-hosted so production builds do not depend on fonts.gstatic.com.
const display = localFont({
  src: [
    { path: "../fonts/oswald/oswald-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/oswald/oswald-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/oswald/oswald-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-display",
  display: "swap",
});

const body = localFont({
  src: [
    {
      path: "../fonts/ibm-plex-sans/ibm-plex-sans-400.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/ibm-plex-sans/ibm-plex-sans-500.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../fonts/ibm-plex-sans/ibm-plex-sans-600.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../fonts/ibm-plex-sans/ibm-plex-sans-700.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-body",
  display: "swap",
});

const share = buildShareMetadata({
  description: SITE_DESCRIPTION,
  path: "/",
  image: DEFAULT_OG_IMAGE_PATH,
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: APP_NAME,
    template: `%s · ${APP_NAME}`,
  },
  description: SITE_DESCRIPTION,
  // Favicon / apple icons come from src/app/icon.png + apple-icon.png (Next file convention).
  openGraph: share.openGraph,
  twitter: share.twitter,
};

// League pages read live DB state; never prerender against Postgres at build time.
export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getSessionUser();
  const viewingAsUser = user ? await isViewingAsUser() : false;
  const showAdmin = user ? await isCommissioner(user) : false;
  const canToggleViewMode = Boolean(user && isActualCommissioner(user));

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${display.variable} ${body.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <SiteHeader
            user={user}
            showAdmin={showAdmin}
            canToggleViewMode={canToggleViewMode}
            viewingAsUser={viewingAsUser}
          />
          {viewingAsUser && canToggleViewMode ? <ViewAsUserBanner /> : null}
          <main className="mx-auto max-w-6xl px-4 py-5 sm:py-8">
            <div key={user?.id ?? "guest"} className="animate-enter">
              {children}
            </div>
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
