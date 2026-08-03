"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { ROUTES } from "@/lib/constants";
import { LANDING_COPY } from "@/features/landing/data/content";
import { HeroIllustration } from "@/features/landing/components/hero-illustration";

export function LandingHero() {
  const reduce = useReducedMotion();

  return (
    <section className="relative overflow-hidden px-5 pb-16 pt-14 sm:px-8 sm:pb-24 sm:pt-20">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <motion.p
            className="font-[family-name:var(--font-landing-display)] text-sm font-semibold tracking-[0.22em] text-zt-primary uppercase"
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            {LANDING_COPY.brand}
          </motion.p>
          <motion.h1
            className="mt-4 font-[family-name:var(--font-landing-display)] text-4xl font-semibold tracking-tight text-zt-text sm:text-6xl sm:leading-[1.05]"
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.05 }}
          >
            {LANDING_COPY.headline}
          </motion.h1>
          <motion.p
            className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-zt-muted sm:text-lg"
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
          >
            {LANDING_COPY.subheadline}
          </motion.p>
          <motion.div
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.16 }}
          >
            <Link
              href={ROUTES.register}
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-zt-primary px-5 text-sm font-semibold text-[#041018] transition-transform hover:-translate-y-0.5 hover:bg-zt-primary/90"
            >
              {LANDING_COPY.primaryCta}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex h-12 items-center rounded-xl border border-zt-border px-5 text-sm font-medium text-zt-text transition-colors hover:border-zt-border-strong hover:bg-white/[0.03]"
            >
              {LANDING_COPY.secondaryCta}
            </a>
          </motion.div>
        </div>

        <div className="mt-14 sm:mt-16">
          <HeroIllustration />
        </div>
      </div>
    </section>
  );
}
