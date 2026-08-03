import Link from "next/link";
import { Github, Linkedin, Twitter } from "lucide-react";

import { APP_NAME, ROUTES } from "@/lib/constants";

const PRODUCT = [
  { href: "#features", label: "Features" },
  { href: "#sdk", label: "SDK" },
  { href: "#pricing", label: "Pricing" },
  { href: ROUTES.pricing, label: "Plans" },
] as const;

const COMPANY = [
  { href: ROUTES.docs, label: "Documentation" },
  { href: ROUTES.privacy, label: "Privacy" },
  { href: ROUTES.terms, label: "Terms" },
  { href: ROUTES.contact, label: "Contact" },
] as const;

export function LandingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-zt-border px-5 pt-14 pb-10 sm:px-8">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="font-[family-name:var(--font-landing-display)] text-lg font-semibold text-zt-text">
            {APP_NAME}
          </p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-zt-muted">
            Production monitoring, AI analysis, and status pages — packaged as
            complete SaaS source for teams that want ownership.
          </p>
          <div className="mt-5 flex gap-3">
            <SocialChip label="GitHub" icon={Github} />
            <SocialChip label="X / Twitter" icon={Twitter} />
            <SocialChip label="LinkedIn" icon={Linkedin} />
          </div>
          <p className="mt-2 text-[11px] text-zt-muted">
            Social profiles are not linked yet — add your URLs before launch.
          </p>
        </div>

        <FooterColumn title="Product" links={PRODUCT} />
        <FooterColumn title="Company" links={COMPANY} />
      </div>

      <div className="mx-auto mt-12 flex max-w-6xl flex-col gap-2 border-t border-zt-border pt-6 text-xs text-zt-muted sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {year} {APP_NAME}. All rights reserved.
        </p>
        <p>
          <Link href={ROUTES.login} className="hover:text-zt-text">
            Sign in
          </Link>
          {" · "}
          <Link href={ROUTES.register} className="hover:text-zt-text">
            Start free
          </Link>
        </p>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: readonly { href: string; label: string }[];
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-zt-text">{title}</p>
      <ul className="mt-4 space-y-2">
        {links.map((link) => (
          <li key={link.href + link.label}>
            {link.href.startsWith("#") ? (
              <a
                href={link.href}
                className="text-sm text-zt-muted transition-colors hover:text-zt-text"
              >
                {link.label}
              </a>
            ) : (
              <Link
                href={link.href}
                className="text-sm text-zt-muted transition-colors hover:text-zt-text"
              >
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SocialChip({
  label,
  icon: Icon,
}: {
  label: string;
  icon: typeof Github;
}) {
  return (
    <span
      role="img"
      aria-label={`${label} (not linked yet)`}
      title={`${label} — add your profile URL before launch`}
      className="inline-flex size-10 items-center justify-center rounded-xl border border-zt-border text-zt-muted"
    >
      <Icon className="size-4" aria-hidden />
    </span>
  );
}
