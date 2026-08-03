import type { Metadata } from "next";

import { APP_NAME } from "@/lib/constants";
import { LegalPage } from "@/features/landing/components/legal-page";

export const metadata: Metadata = {
  title: "Privacy",
  description: `Privacy policy for ${APP_NAME}.`,
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <p>
        {APP_NAME} is designed to be self-hosted. When you operate an instance,
        you control the database, storage, and email provider. This policy
        describes the default product expectations for that deployment model.
      </p>
      <h2 className="pt-4 text-lg font-semibold text-zt-text">Data we process</h2>
      <p>
        Account profiles, workspace membership, projects, API key metadata,
        telemetry ingested through the SDK (errors, heartbeats, performance),
        incidents, notifications, AI conversation history, and audit logs.
      </p>
      <h2 className="pt-4 text-lg font-semibold text-zt-text">Purpose</h2>
      <p>
        Data is used to authenticate users, enforce plan limits, provide
        monitoring and AI assistance, deliver notifications, and maintain
        security audit trails.
      </p>
      <h2 className="pt-4 text-lg font-semibold text-zt-text">Storage &amp; security</h2>
      <p>
        Secrets belong in environment variables. API key secrets are hashed at
        rest. Access to workspace data is constrained by authentication and row
        level security policies in the database.
      </p>
      <h2 className="pt-4 text-lg font-semibold text-zt-text">Third parties</h2>
      <p>
        Optional integrations (for example Resend for email, OpenAI for the AI
        assistant, or a payment provider you connect later) process only the
        data required for that integration under your configuration.
      </p>
      <h2 className="pt-4 text-lg font-semibold text-zt-text">Contact</h2>
      <p>
        Privacy questions:{" "}
        <a className="text-zt-primary hover:underline" href="mailto:privacy@zynteksis.com">
          privacy@zynteksis.com
        </a>
      </p>
    </LegalPage>
  );
}
