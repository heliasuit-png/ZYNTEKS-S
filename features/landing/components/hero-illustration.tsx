"use client";

import { motion, useReducedMotion } from "framer-motion";

/** Premium product illustration — CSS/SVG composition, no external assets. */
export function HeroIllustration() {
  const reduce = useReducedMotion();

  return (
    <div className="relative mx-auto w-full max-w-5xl">
      <div
        aria-hidden
        className="absolute -inset-6 rounded-[2rem] bg-gradient-to-b from-zt-primary/20 via-transparent to-transparent blur-2xl"
      />
      <motion.div
        className="relative overflow-hidden rounded-[1.4rem] border border-white/10 bg-[#0a1224]/85 shadow-[0_40px_120px_-40px_rgba(0,229,255,0.45)] backdrop-blur-xl"
        initial={reduce ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-center gap-2 border-b border-white/8 px-4 py-3">
          <span className="size-2.5 rounded-full bg-[#ff5f57]" />
          <span className="size-2.5 rounded-full bg-[#febc2e]" />
          <span className="size-2.5 rounded-full bg-[#28c840]" />
          <span className="ml-3 text-xs text-zt-muted">
            ZYNTEKSIS · Operations console
          </span>
        </div>

        <div className="grid gap-4 p-4 sm:grid-cols-[180px_1fr] sm:p-5">
          <aside className="hidden space-y-2 rounded-xl border border-white/8 bg-white/[0.03] p-3 sm:block">
            {["Dashboard", "Errors", "Health", "AI", "Status"].map((item, i) => (
              <div
                key={item}
                className={`rounded-lg px-3 py-2 text-xs ${
                  i === 0
                    ? "bg-zt-primary/15 text-zt-primary"
                    : "text-zt-muted"
                }`}
              >
                {item}
              </div>
            ))}
          </aside>

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Uptime", value: "99.98%" },
                { label: "Errors", value: "12" },
                { label: "Latency", value: "84ms" },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  className="rounded-xl border border-white/8 bg-white/[0.03] p-3"
                  animate={
                    reduce
                      ? undefined
                      : { y: [0, -3, 0] }
                  }
                  transition={{
                    duration: 3.2,
                    delay: index * 0.35,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <p className="text-[10px] tracking-wide text-zt-muted uppercase">
                    {stat.label}
                  </p>
                  <p className="mt-1 font-[family-name:var(--font-landing-display)] text-lg font-semibold text-zt-text">
                    {stat.value}
                  </p>
                </motion.div>
              ))}
            </div>

            <div className="rounded-xl border border-white/8 bg-gradient-to-br from-white/[0.04] to-transparent p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs text-zt-muted">Incident timeline</p>
                <span className="rounded-full bg-zt-success/15 px-2 py-0.5 text-[10px] text-zt-success">
                  Stable
                </span>
              </div>
              <svg
                viewBox="0 0 520 120"
                className="h-24 w-full text-zt-primary"
                role="img"
                aria-label="Decorative monitoring chart"
              >
                <defs>
                  <linearGradient id="heroFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0 80 C 60 70, 90 40, 140 48 S 220 95, 280 70 S 380 20, 440 36 S 500 70, 520 55 L 520 120 L 0 120 Z"
                  fill="url(#heroFill)"
                />
                <path
                  d="M0 80 C 60 70, 90 40, 140 48 S 220 95, 280 70 S 380 20, 440 36 S 500 70, 520 55"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                />
              </svg>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
