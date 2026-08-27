import type { Metadata } from "next";
import Link from "next/link";

import { DASHBOARD_ROUTES, ROUTES } from "@/lib/constants";
import { LegalPage } from "@/features/landing/components/legal-page";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getDictionary();
  return {
    title: dict.docs.title,
    description: dict.docs.intro,
    alternates: { canonical: "/docs" },
    openGraph: {
      title: dict.docs.title,
      description: dict.docs.intro,
      url: "/docs",
    },
  };
}

export default async function DocsPage() {
  const { dict } = await getDictionary();
  const d = dict.docs;

  return (
    <LegalPage title={d.title}>
      <p>{d.intro}</p>

      <h2 className="pt-4 text-lg font-semibold text-zt-text">
        {d.createAccountTitle}
      </h2>
      <p>
        <Link className="text-zt-primary hover:underline" href={ROUTES.register}>
          {d.registerLink}
        </Link>{" "}
        {d.createAccountOr}{" "}
        <Link className="text-zt-primary hover:underline" href={ROUTES.login}>
          {d.signInLink}
        </Link>
        . {d.createAccountBody}
      </p>

      <h2 className="pt-4 text-lg font-semibold text-zt-text">
        {d.createProjectTitle}
      </h2>
      <p>
        {d.createProjectBody} (
        <Link
          className="text-zt-primary hover:underline"
          href={DASHBOARD_ROUTES.projects}
        >
          {d.projectsLink}
        </Link>
        )
      </p>

      <h2 className="pt-4 text-lg font-semibold text-zt-text">
        {d.generateKeyTitle}
      </h2>
      <p>
        {d.generateKeyBody} (
        <Link
          className="text-zt-primary hover:underline"
          href={DASHBOARD_ROUTES.apiKeys}
        >
          {d.apiKeysLink}
        </Link>
        )
      </p>

      <h2 className="pt-4 text-lg font-semibold text-zt-text">
        {d.installSdkTitle}
      </h2>
      <p>{d.installSdkBody}</p>
      <pre className="mt-2 overflow-x-auto rounded-lg border border-zt-border bg-black/30 p-3 font-mono text-xs text-zt-text">
{`cd sdk && npm install && npm run build
npm install /absolute/path/to/zynteksis/sdk`}
      </pre>
      <p className="mt-2">
        {d.installSdkInit}{" "}
        <Link className="text-zt-primary hover:underline" href="/#sdk">
          {d.sdkSectionLink}
        </Link>
        .
      </p>

      <h2 className="pt-4 text-lg font-semibold text-zt-text">
        {d.serverIngestTitle}
      </h2>
      <p>{d.serverIngestBody}</p>

      <h2 className="pt-4 text-lg font-semibold text-zt-text">{d.operateTitle}</h2>
      <ul className="list-disc space-y-2 pl-5">
        <li>{d.operateErrors}</li>
        <li>{d.operateAi}</li>
        <li>{d.operateStatus}</li>
        <li>
          <Link
            className="text-zt-primary hover:underline"
            href={DASHBOARD_ROUTES.billing}
          >
            {d.billingLink}
          </Link>
          {" — "}
          {d.operateBilling}
        </li>
      </ul>

      <h2 className="pt-4 text-lg font-semibold text-zt-text">
        {d.troubleshootingTitle}
      </h2>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <strong className="text-zt-text">{d.trouble401Title}</strong> —{" "}
          {d.trouble401Body}
        </li>
        <li>
          <strong className="text-zt-text">{d.troubleNoDataTitle}</strong> —{" "}
          {d.troubleNoDataBody}
        </li>
        <li>
          <strong className="text-zt-text">{d.troubleRateTitle}</strong> —{" "}
          {d.troubleRateBody}
        </li>
      </ul>
    </LegalPage>
  );
}
