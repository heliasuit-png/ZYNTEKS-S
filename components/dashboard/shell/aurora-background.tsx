/**
 * Ambient animated background for the dashboard: a slow mesh-gradient aurora, a
 * faint moving grid, a twinkling starfield and a subtle film-grain noise layer.
 * Pure CSS/SVG — no libraries and no JavaScript — and fully disabled under
 * `prefers-reduced-motion`.
 *
 * Rendered as a fixed, non-interactive layer behind all content so the glass
 * surfaces above it read as translucent.
 */
export function AuroraBackground() {
  return (
    <div
      aria-hidden
      className="zt-aurora pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Mesh-gradient aurora blobs */}
      <div
        className="zt-aurora__blob zt-anim-aurora-1 -left-40 -top-40 size-[36rem]"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, #00e5ff, transparent 60%)",
          opacity: 0.55,
        }}
      />
      <div
        className="zt-aurora__blob zt-anim-aurora-2 -right-48 top-10 size-[40rem]"
        style={{
          background:
            "radial-gradient(circle at 70% 30%, #7c3aed, transparent 60%)",
          opacity: 0.55,
        }}
      />
      <div
        className="zt-aurora__blob zt-anim-aurora-3 bottom-[-20rem] left-1/3 size-[34rem]"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, #3b82f6, transparent 62%)",
          opacity: 0.4,
        }}
      />
      <div
        className="zt-aurora__blob zt-anim-aurora-2 right-1/4 top-1/2 size-[26rem]"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, #ff4fd8, transparent 60%)",
          opacity: 0.22,
        }}
      />

      {/* Twinkling stars + soft grid + film grain */}
      <div className="zt-stars" />
      <div className="zt-aurora__grid" />
      <div className="zt-noise" />

      {/* Vignette to keep the edges calm and focus attention on content. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_100%_at_50%_-10%,transparent_40%,#050816_92%)]" />
    </div>
  );
}
