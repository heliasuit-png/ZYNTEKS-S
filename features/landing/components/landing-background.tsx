/**
 * Full-bleed animated atmosphere for the marketing landing page.
 * CSS-only motion; disabled under prefers-reduced-motion via globals.
 */
export function LandingBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#04070f]"
    >
      <div
        className="zt-anim-aurora-1 absolute -left-32 -top-24 size-[42rem] rounded-full opacity-50 blur-3xl"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, rgba(0,229,255,0.55), transparent 62%)",
        }}
      />
      <div
        className="zt-anim-aurora-2 absolute -right-40 top-0 size-[46rem] rounded-full opacity-45 blur-3xl"
        style={{
          background:
            "radial-gradient(circle at 70% 35%, rgba(59,130,246,0.5), transparent 60%)",
        }}
      />
      <div
        className="zt-anim-aurora-3 absolute bottom-[-18rem] left-1/4 size-[38rem] rounded-full opacity-35 blur-3xl"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(0,255,136,0.28), transparent 62%)",
        }}
      />
      <div className="zt-stars absolute inset-0 opacity-70" />
      <div className="zt-aurora__grid absolute inset-0 opacity-40" />
      <div className="zt-noise absolute inset-0 opacity-40" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_-10%,transparent_35%,#04070f_88%)]" />
    </div>
  );
}
