import type { Metadata } from "next";
import { IBM_Plex_Sans, Oswald } from "next/font/google";
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

const display = Oswald({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
});

const body = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
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
  icons: {
    icon: [{ url: "/brand/kml-icon.png", type: "image/png" }],
    shortcut: "/brand/kml-icon.png",
    apple: "/brand/kml-icon.png",
  },
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
