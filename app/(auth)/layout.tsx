import { AuroraBackground } from "@/components/dashboard/shell/aurora-background";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="dark relative flex min-h-screen items-center justify-center overflow-hidden bg-zt-bg px-6 py-12 text-zt-text">
      <AuroraBackground />
      <div className="relative w-full max-w-md">{children}</div>
    </main>
  );
}
