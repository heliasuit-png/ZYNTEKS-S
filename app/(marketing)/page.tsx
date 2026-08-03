import dynamic from "next/dynamic";
import type { Metadata } from "next";

import { env } from "@/lib/env";
import { LandingHero } from "@/features/landing/components/landing-hero";
import {
  buildLandingJsonLd,
  buildLandingMetadata,
} from "@/features/landing/lib/seo";

export const metadata: Metadata = buildLandingMetadata(env.NEXT_PUBLIC_APP_URL);

const LandingFeatures = dynamic(
  () =>
    import("@/features/landing/components/landing-features").then(
      (m) => m.LandingFeatures,
    ),
  { ssr: true },
);
const LandingHowItWorks = dynamic(
  () =>
    import("@/features/landing/components/landing-how-it-works").then(
      (m) => m.LandingHowItWorks,
    ),
  { ssr: true },
);
const LandingAi = dynamic(
  () =>
    import("@/features/landing/components/landing-ai").then((m) => m.LandingAi),
  { ssr: true },
);
const LandingMonitoring = dynamic(
  () =>
    import("@/features/landing/components/landing-monitoring").then(
      (m) => m.LandingMonitoring,
    ),
  { ssr: true },
);
const LandingSdk = dynamic(
  () =>
    import("@/features/landing/components/landing-sdk").then(
      (m) => m.LandingSdk,
    ),
  { ssr: true },
);
const LandingStatus = dynamic(
  () =>
    import("@/features/landing/components/landing-status").then(
      (m) => m.LandingStatus,
    ),
  { ssr: true },
);
const LandingPricing = dynamic(
  () =>
    import("@/features/landing/components/landing-pricing").then(
      (m) => m.LandingPricing,
    ),
  { ssr: true },
);
const LandingFaq = dynamic(
  () =>
    import("@/features/landing/components/landing-faq").then(
      (m) => m.LandingFaq,
    ),
  { ssr: true },
);
const LandingTestimonials = dynamic(
  () =>
    import("@/features/landing/components/landing-testimonials").then(
      (m) => m.LandingTestimonials,
    ),
  { ssr: true },
);

export default function HomePage() {
  const jsonLd = buildLandingJsonLd(env.NEXT_PUBLIC_APP_URL);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <LandingHero />
      <LandingFeatures />
      <LandingHowItWorks />
      <LandingAi />
      <LandingMonitoring />
      <LandingSdk />
      <LandingStatus />
      <LandingPricing />
      <LandingFaq />
      <LandingTestimonials />
    </>
  );
}
