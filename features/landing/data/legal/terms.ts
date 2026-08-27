/**
 * Canonical legal document bodies (English).
 * Do not paraphrase, shorten, translate, or invent wording.
 */

export type LegalSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
  paragraphsAfterBullets?: string[];
};

export type LegalDocumentBody = {
  /** Exact "Last Updated" line value from the source document. */
  lastUpdated: string;
  intro: string[];
  sections: LegalSection[];
  closing?: string[];
};

export const LEGAL_OPERATOR = {
  name: "Aysel Nur Akıncı",
  registrationNo: "1160825918",
  address:
    "Istanbul/Silivri Mimar Sinan Mah. Fatih Sultan Mehmet Cad. No:38-R Daire:14",
  email: "Hello@heliasuit.com",
} as const;

export const LEGAL_LAST_UPDATED = "August 27, 2026";

export const termsDocument: LegalDocumentBody = {
  lastUpdated: LEGAL_LAST_UPDATED,
  intro: [
    'These Terms of Service ("Terms") govern access to and use of the Zynteksis platform ("Zynteksis", "Platform", "Service") operated by:',
    `Operator: ${LEGAL_OPERATOR.name}`,
    `Identification / Registration No.: ${LEGAL_OPERATOR.registrationNo}`,
    `Address: ${LEGAL_OPERATOR.address}`,
    `Email: ${LEGAL_OPERATOR.email}`,
    "By creating an account, accessing, or using Zynteksis, you agree to be bound by these Terms. If you do not agree with these Terms, you must not use the Service.",
  ],
  sections: [
    {
      heading: "1. Description of the Service",
      paragraphs: [
        "Zynteksis is an AI-assisted software development and monitoring platform designed to help developers and software teams identify, understand, monitor, and troubleshoot software errors and performance issues.",
        "Depending on the applicable plan and configuration, Zynteksis may provide features including:",
      ],
      bullets: [
        "Error detection and tracking;",
        "JavaScript and React error monitoring;",
        "Network and request monitoring;",
        "Performance and latency monitoring;",
        "Heartbeat and service health monitoring;",
        "Error deduplication;",
        "Retry and offline queues;",
        "Incident management;",
        "Notifications and alerting;",
        "Status pages;",
        "Project dashboards;",
        "AI-assisted error analysis;",
        "AI-assisted code analysis;",
        "Root-cause analysis;",
        "Debugging assistance; and",
        "Project-specific AI assistance based on information available within the relevant Zynteksis project.",
      ],
      paragraphsAfterBullets: [
        "Available features and usage limits may vary according to the selected plan.",
      ],
    },
    {
      heading: "2. AI-Assisted Features",
      paragraphs: [
        "Zynteksis may use artificial intelligence to analyze information supplied to or collected by the Platform.",
        "AI-generated results may include explanations, possible causes, recommendations, debugging suggestions, and proposed approaches for resolving software issues.",
        "AI-generated information is provided as an assistance tool and is not a guarantee that an identified cause, diagnosis, recommendation, or proposed solution is correct.",
        "Zynteksis does not guarantee that AI-generated output will be complete, accurate, secure, suitable for a particular purpose, or free from errors.",
        "Unless expressly stated otherwise within the Service, the Zynteksis AI assistant does not independently modify or execute the user's source code and does not claim certainty without sufficient evidence.",
        "Users remain solely responsible for reviewing, testing, validating, and deciding whether to implement any AI-generated recommendation.",
      ],
    },
    {
      heading: "3. Account Registration",
      paragraphs: [
        "You may be required to create an account to access certain features.",
        "You agree to provide accurate and current information and to keep your account information up to date.",
        "You are responsible for maintaining the confidentiality of your account credentials and API keys and for all activity performed through your account.",
        "You must notify Zynteksis promptly if you believe that your account or API key has been compromised or used without authorization.",
      ],
    },
    {
      heading: "4. API Keys and SDK Integration",
      paragraphs: [
        "Zynteksis may provide project-specific API keys, SDKs, integration credentials, or similar technical credentials.",
        "You are responsible for using such credentials securely.",
        "You must not intentionally expose, publish, distribute, sell, or otherwise disclose private API keys or credentials to unauthorized persons.",
        "You are responsible for the applications, repositories, environments, systems, and data connected to your Zynteksis account.",
      ],
    },
    {
      heading: "5. User Content and Data",
      paragraphs: [
        'You retain ownership of the code, logs, error information, project information, and other content that you submit to or make available through Zynteksis ("User Content"), subject to the rights necessary for Zynteksis to provide the Service.',
        "You grant Zynteksis a limited, non-exclusive right to process User Content solely to provide, maintain, secure, improve, and support the Service, and to generate the requested analyses and functionality.",
        "Zynteksis does not acquire ownership of your source code merely because you use the Service.",
        "You are responsible for ensuring that you have the necessary rights and permissions to submit User Content to Zynteksis.",
      ],
    },
    {
      heading: "6. Prohibited Use",
      paragraphs: ["You must not:"],
      bullets: [
        "Use Zynteksis for unlawful purposes;",
        "Attempt to gain unauthorized access to the Platform or another user's account;",
        "Interfere with or disrupt the Service;",
        "Circumvent usage limits or security mechanisms;",
        "Reverse engineer or attempt to extract protected source code or confidential components of the Service, except where permitted by applicable law;",
        "Abuse API keys, SDKs, or integrations;",
        "Upload malicious code, malware, or content intended to compromise the Platform;",
        "Use the Service to violate another person's rights;",
        "Use Zynteksis to conduct unauthorized security testing against systems you do not own or have permission to test; or",
        "Use the Service in a manner that could reasonably cause significant harm to Zynteksis, its infrastructure, or other users.",
      ],
    },
    {
      heading: "7. Third-Party Services",
      paragraphs: [
        "Zynteksis may rely on third-party infrastructure, APIs, hosting providers, analytics providers, authentication services, AI providers, or other technology providers.",
        "The availability and operation of third-party services may affect certain Zynteksis features.",
        "Where applicable, your use of third-party services may also be subject to their own terms and privacy policies.",
      ],
    },
    {
      heading: "8. Service Availability",
      paragraphs: [
        "Zynteksis will make reasonable efforts to keep the Service available and operational.",
        "However, uninterrupted or error-free availability is not guaranteed.",
        "The Service may be temporarily unavailable due to maintenance, updates, technical failures, security incidents, infrastructure problems, third-party service failures, or circumstances beyond reasonable control.",
      ],
    },
    {
      heading: "9. Intellectual Property",
      paragraphs: [
        "Zynteksis and its software, design, branding, interfaces, documentation, technology, and other original materials are owned by or licensed to the Operator and are protected by applicable intellectual property laws.",
        "Except for the limited rights expressly granted under these Terms, no ownership rights are transferred to you.",
      ],
    },
    {
      heading: "10. Fees and Paid Plans",
      paragraphs: [
        "Certain features may be offered under paid subscription plans.",
        "Where paid plans are available, the applicable price, billing period, included limits, and other commercial terms will be displayed before purchase.",
        "No payment is required for features that are expressly offered as free.",
        "Zynteksis may change its plans, pricing, limits, or features in accordance with applicable law. Changes affecting existing paid subscriptions will be communicated as required by applicable law.",
      ],
    },
    {
      heading: "11. Cancellation and Termination",
      paragraphs: [
        "You may stop using Zynteksis at any time.",
        "Zynteksis may suspend or terminate access where reasonably necessary to protect the Platform, comply with applicable law, prevent abuse, address security risks, or where a user materially breaches these Terms.",
        "Where appropriate, Zynteksis may provide notice and an opportunity to remedy a breach.",
      ],
    },
    {
      heading: "12. Disclaimer",
      paragraphs: [
        "Zynteksis is a software assistance and monitoring platform.",
        "Zynteksis does not guarantee that:",
      ],
      bullets: [
        "all software errors will be detected;",
        "all incidents will be identified;",
        "AI-generated analyses will be correct;",
        "proposed solutions will resolve a particular problem;",
        "monitoring data will always be complete or available; or",
        "use of the Service will prevent software failures, security incidents, downtime, data loss, or other technical problems.",
      ],
      paragraphsAfterBullets: [
        "You remain responsible for your software, infrastructure, deployments, backups, security controls, and production decisions.",
      ],
    },
    {
      heading: "13. Limitation of Liability",
      paragraphs: [
        "To the maximum extent permitted by applicable law, Zynteksis shall not be liable for indirect, incidental, special, consequential, or loss-of-profit damages arising from or related to use of the Service.",
        "Nothing in these Terms excludes or limits liability where such exclusion or limitation is prohibited by applicable law.",
      ],
    },
    {
      heading: "14. Indemnification",
      paragraphs: [
        "To the extent permitted by applicable law, you agree to be responsible for claims arising from your unlawful use of the Service, violation of these Terms, infringement of third-party rights, or User Content that you submit to the Platform.",
      ],
    },
    {
      heading: "15. Changes to These Terms",
      paragraphs: [
        "Zynteksis may update these Terms from time to time.",
        'The updated version will be published on the Platform with an updated "Last Updated" date.',
        "Where required by applicable law, material changes will be communicated to users through appropriate means.",
      ],
    },
    {
      heading: "16. Governing Law",
      paragraphs: [
        "These Terms shall be governed by the laws of the Republic of Türkiye, without prejudice to mandatory consumer protection rights that cannot lawfully be waived.",
        "For consumer transactions, mandatory jurisdiction and dispute-resolution rules applicable under Turkish law shall apply.",
      ],
    },
    {
      heading: "17. Contact",
      paragraphs: [
        "For questions regarding these Terms, please contact:",
        LEGAL_OPERATOR.name,
        `Email: ${LEGAL_OPERATOR.email}`,
        `Address: ${LEGAL_OPERATOR.address}`,
      ],
    },
  ],
  closing: [
    "By creating an account or using Zynteksis, you acknowledge that you have read and understood these Terms.",
  ],
};
