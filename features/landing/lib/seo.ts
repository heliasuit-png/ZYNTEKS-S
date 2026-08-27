import type { Metadata } from "next";

import { APP_NAME } from "@/lib/constants";
import { dictionaries } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";

export function buildLandingMetadata(
  appUrl: string,
  locale: Locale = "en",
): Metadata {
  const dict = dictionaries[locale] ?? dictionaries.en;
  const title = `${APP_NAME} — ${dict.landing.hero.headline}`;
  const description = dict.landing.hero.subheadline;
  const base = appUrl.replace(/\/$/, "");
  const ogImage = `${base}/opengraph-image`;

  return {
    title: {
      absolute: title,
    },
    description,
    applicationName: APP_NAME,
    keywords: [
      "SaaS monitoring",
      "error monitoring",
      "status pages",
      "AI assistant",
      "API keys",
      "health checks",
      "ZYNTEKSIS",
    ],
    authors: [{ name: APP_NAME }],
    creator: APP_NAME,
    metadataBase: new URL(base),
    alternates: {
      canonical: base,
    },
    openGraph: {
      type: "website",
      url: base,
      siteName: APP_NAME,
      title,
      description,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${APP_NAME} — production monitoring platform`,
        },
      ],
      locale: locale === "tr" ? "tr_TR" : "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
  };
}

export function buildLandingJsonLd(appUrl: string, locale: Locale = "en") {
  const dict = dictionaries[locale] ?? dictionaries.en;
  const description = dict.landing.hero.subheadline;
  const faq = dict.landing.faq.items;
  const base = appUrl.replace(/\/$/, "");
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${base}/#organization`,
        name: APP_NAME,
        url: base,
        description,
      },
      {
        "@type": "WebSite",
        "@id": `${base}/#website`,
        url: base,
        name: APP_NAME,
        description,
        publisher: { "@id": `${base}/#organization` },
        inLanguage: locale,
      },
      {
        "@type": "SoftwareApplication",
        name: APP_NAME,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description,
        url: base,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          description: dict.landing.seo.starterPlanAvailable,
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: faq.slice(0, 2).map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.a,
          },
        })),
      },
    ],
  };
}
