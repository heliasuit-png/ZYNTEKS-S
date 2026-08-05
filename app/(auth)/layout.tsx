import { AuroraBackground } from "@/components/dashboard/shell/aurora-background";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main
      data-auth-theme
      className="dark relative flex min-h-screen items-center justify-center overflow-hidden bg-[#05070c] px-4 py-10 text-[#f4f7fb] sm:px-6 sm:py-14"
    >
      <AuroraBackground />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.14),transparent_55%)]"
      />
      <div className="relative w-full max-w-md">{children}</div>
    </main>
  );
}
