import type { Metadata } from "next";
import { APP_NAME } from "@/lib/constants";

export const SITE_DESCRIPTION =
  "Kings Madden League — built on competition, driven by brotherhood. Standings, approvals, XP, reputation, and league storylines.";

/** Default share image (absolute path under /public). */
export const DEFAULT_OG_IMAGE_PATH = "/brand/kml-icon.png";

export function getSiteUrl() {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "https://kingsmaddenleague.com";
}

/** Resolve a site-relative or absolute image URL for Open Graph. */
export function absoluteUrl(pathOrUrl: string) {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${getSiteUrl()}${path}`;
}

type ShareMetadataInput = {
  title?: string;
  description?: string;
  path?: string;
  image?: string | null;
  type?: "website" | "article";
};

export function buildShareMetadata({
  title,
  description = SITE_DESCRIPTION,
  path = "/",
  image,
  type = "website",
}: ShareMetadataInput = {}): Metadata {
  const url = absoluteUrl(path);
  const imageUrl = absoluteUrl(image || DEFAULT_OG_IMAGE_PATH);
  const ogTitle = title ? `${title} · ${APP_NAME}` : APP_NAME;

  return {
    title: title || undefined,
    description,
    alternates: { canonical: url },
    openGraph: {
      type,
      siteName: APP_NAME,
      title: ogTitle,
      description,
      url,
      images: [
        {
          url: imageUrl,
          alt: title ? `${title} — ${APP_NAME}` : APP_NAME,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
      images: [imageUrl],
    },
  };
}
