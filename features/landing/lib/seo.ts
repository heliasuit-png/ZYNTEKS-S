import type { Metadata } from "next";

import { APP_NAME } from "@/lib/constants";
import { LANDING_COPY } from "@/features/landing/data/content";

const TITLE = `${APP_NAME} — Observe. Analyze. Ship with confidence.`;
const DESCRIPTION = LANDING_COPY.subheadline;

export function buildLandingMetadata(appUrl: string): Metadata {
  const base = appUrl.replace(/\/$/, "");
  const ogImage = `${base}/opengraph-image`;

  return {
    title: {
      absolute: TITLE,
    },
    description: DESCRIPTION,
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
      title: TITLE,
      description: DESCRIPTION,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${APP_NAME} — production monitoring platform`,
        },
      ],
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: TITLE,
      description: DESCRIPTION,
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

export function buildLandingJsonLd(appUrl: string) {
  const base = appUrl.replace(/\/$/, "");
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${base}/#organization`,
        name: APP_NAME,
        url: base,
        description: DESCRIPTION,
      },
      {
        "@type": "WebSite",
        "@id": `${base}/#website`,
        url: base,
        name: APP_NAME,
        description: DESCRIPTION,
        publisher: { "@id": `${base}/#organization` },
        inLanguage: "en",
      },
      {
        "@type": "SoftwareApplication",
        name: APP_NAME,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description: DESCRIPTION,
        url: base,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          description: "Starter plan available",
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "What is ZYNTEKSIS?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "ZYNTEKSIS is a production-ready SaaS platform for error monitoring, health checks, AI-assisted analysis, notifications, and public status pages.",
            },
          },
          {
            "@type": "Question",
            name: "Do I need a payment provider?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "No payment vendor is bundled. Billing UI and plan limits ship ready; connect a PaymentProvider when you want checkout.",
            },
          },
        ],
      },
    ],
  };
}
