import Link from "next/link";

import { ROUTES } from "@/lib/constants";
import { AuroraBackground } from "@/components/dashboard/shell/aurora-background";
import { LogoMark } from "@/components/brand/logo-mark";
import { Button } from "@/components/dashboard/button";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export default async function NotFound() {
  const { dict } = await getDictionary();
  const { system } = dict;

  return (
    <main className="dark relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-zt-bg px-6 text-center text-zt-text">
      <AuroraBackground />

      <div className="relative flex flex-col items-center gap-6">
        <div className="zt-float relative flex size-20 items-center justify-center rounded-3xl border border-zt-border bg-white/[0.03] shadow-xl shadow-zt-primary/25">
          <LogoMark size={48} glow />
        </div>

        <div className="space-y-2">
          <p className="bg-gradient-to-r from-zt-accent via-white to-zt-secondary bg-clip-text text-7xl font-bold tracking-tight text-transparent sm:text-8xl">
            404
          </p>
          <h1 className="text-xl font-semibold text-zt-text">
            {system.notFoundTitle}
          </h1>
          <p className="mx-auto max-w-md text-sm text-zt-muted">
            {system.notFoundDesc}
          </p>
        </div>

        <Button asChild size="lg">
          <Link href={ROUTES.home}>{system.backHome}</Link>
        </Button>
      </div>
    </main>
  );
}
