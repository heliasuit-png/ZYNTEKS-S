"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";

import { FAQ_ITEMS } from "@/features/landing/data/content";
import { LandingSection } from "@/features/landing/components/section";
import { Reveal } from "@/features/landing/components/reveal";
import { cn } from "@/lib/utils";

export function LandingFaq() {
  const [openId, setOpenId] = useState<number | null>(0);
  const reduce = useReducedMotion();

  return (
    <LandingSection
      id="faq"
      eyebrow="FAQ"
      title="Answers before you ask sales"
      description="Straight answers about the platform, billing architecture, SDK, and self-hosting."
      narrow
    >
      <Reveal>
        <div className="space-y-3">
          {FAQ_ITEMS.map((item, index) => {
            const open = openId === index;
            return (
              <div
                key={item.q}
                className="overflow-hidden rounded-2xl border border-zt-border bg-white/[0.02]"
              >
                <h3>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                    aria-expanded={open}
                    onClick={() => setOpenId(open ? null : index)}
                  >
                    <span className="font-medium text-zt-text">{item.q}</span>
                    <ChevronDown
                      className={cn(
                        "size-5 shrink-0 text-zt-muted transition-transform duration-300",
                        open && "rotate-180",
                      )}
                      aria-hidden
                    />
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {open ? (
                    <motion.div
                      key="content"
                      initial={reduce ? false : { height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={reduce ? undefined : { height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <p className="border-t border-zt-border px-5 py-4 text-sm leading-relaxed text-zt-muted">
                        {item.a}
                      </p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </Reveal>
    </LandingSection>
  );
}
