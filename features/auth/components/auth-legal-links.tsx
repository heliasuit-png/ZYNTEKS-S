import Link from "next/link";

import { ROUTES } from "@/lib/constants";
import type { Dictionary } from "@/lib/i18n/dictionaries";

/** Non-blocking legal links for auth screens (no mandatory checkbox). */
export function AuthLegalLinks({ dict }: { dict: Dictionary }) {
  return (
    <p className="mt-4 text-center text-xs leading-relaxed text-zt-muted">
      {dict.auth.legalNotice}{" "}
      <Link href={ROUTES.legalTerms} className="text-zt-accent hover:underline">
        {dict.auth.terms}
      </Link>
      {", "}
      <Link
        href={ROUTES.legalPrivacy}
        className="text-zt-accent hover:underline"
      >
        {dict.auth.privacy}
      </Link>
      {" · "}
      <Link href={ROUTES.legalKvkk} className="text-zt-accent hover:underline">
        {dict.auth.kvkk}
      </Link>
      .
    </p>
  );
}
