import {
  LEGAL_LAST_UPDATED,
  LEGAL_OPERATOR,
  type LegalDocumentBody,
} from "./terms";

export const privacyDocument: LegalDocumentBody = {
  lastUpdated: LEGAL_LAST_UPDATED,
  intro: [
    "This Privacy Policy explains how Zynteksis processes personal information in connection with the Zynteksis website, platform, applications, SDKs, APIs, and related services.",
  ],
  sections: [
    {
      heading: "1. DATA CONTROLLER",
      paragraphs: [
        `Data Controller: ${LEGAL_OPERATOR.name}`,
        `Identification / Registration No.: ${LEGAL_OPERATOR.registrationNo}`,
        `Address: ${LEGAL_OPERATOR.address}`,
        `Email: ${LEGAL_OPERATOR.email}`,
      ],
    },
    {
      heading: "2. INFORMATION WE MAY PROCESS",
      paragraphs: [
        "Depending on how you use Zynteksis, we may process:",
      ],
      bullets: [
        "Name and surname;",
        "Email address;",
        "Account credentials and authentication information;",
        "Project and workspace information;",
        "Subscription and transaction information, where paid services are enabled;",
        "Technical logs;",
        "IP address and device information;",
        "Browser and operating system information;",
        "Error reports;",
        "Application performance information;",
        "Network/request information;",
        "Incident information;",
        "Heartbeat and service-health information;",
        "Information submitted through support communications; and",
        "Other information necessary to provide the requested Service.",
      ],
    },
    {
      heading: "3. SOURCE CODE AND TECHNICAL DATA",
      paragraphs: [
        "When users integrate their applications with Zynteksis, technical information such as errors, stack traces, logs, request information, performance data, framework information, release information, and related project context may be processed.",
        "Users should not submit passwords, authentication secrets, private keys, payment card information, or other unnecessary sensitive information through error logs or application payloads.",
      ],
    },
    {
      heading: "4. PURPOSES OF PROCESSING",
      paragraphs: ["Personal data may be processed for:"],
      bullets: [
        "Creating and managing user accounts;",
        "Providing and operating Zynteksis;",
        "Monitoring application errors and performance;",
        "Providing requested AI-assisted analysis;",
        "Providing customer support;",
        "Maintaining security;",
        "Detecting abuse and unauthorized activity;",
        "Preventing fraud;",
        "Managing subscriptions where applicable;",
        "Processing legally required records;",
        "Improving reliability and functionality of the Service; and",
        "Complying with legal obligations.",
      ],
    },
    {
      heading: "5. LEGAL BASES",
      paragraphs: [
        "Personal data may be processed where necessary under applicable law, including where:",
      ],
      bullets: [
        "Processing is necessary for the performance or establishment of a contract;",
        "Processing is necessary for compliance with a legal obligation;",
        "Processing is necessary for the establishment, exercise, or protection of a legal right;",
        "Processing is necessary for the legitimate interests of the data controller, where permitted and balanced against the rights of the individual; or",
        "Explicit consent is legally required and has been obtained.",
      ],
    },
    {
      heading: "6. AI PROCESSING",
      paragraphs: [
        "Zynteksis may use AI technologies to analyze technical information supplied through the Service.",
        "AI processing may be used to generate explanations, identify possible causes, recommend debugging approaches, and assist users in understanding technical problems.",
        "AI output is not guaranteed to be accurate or complete.",
        "Where third-party AI providers are used to provide a requested feature, relevant information may be processed by those providers as necessary to deliver the feature and subject to applicable contractual and legal safeguards.",
      ],
    },
    {
      heading: "7. DATA SHARING",
      paragraphs: [
        "Personal data may be shared with service providers and technology providers where necessary to operate Zynteksis, including providers of:",
      ],
      bullets: [
        "Hosting and cloud infrastructure;",
        "Authentication;",
        "Database services;",
        "AI processing;",
        "Security;",
        "Analytics;",
        "Customer support;",
        "Payment processing, where applicable; and",
        "Other infrastructure required to provide the Service.",
      ],
      paragraphsAfterBullets: [
        "Data may also be disclosed where required by law or to protect legal rights and security.",
      ],
    },
    {
      heading: "8. INTERNATIONAL TRANSFERS",
      paragraphs: [
        "Where personal data is transferred outside Türkiye, Zynteksis will apply the transfer mechanisms and safeguards required under applicable data-protection law.",
      ],
    },
    {
      heading: "9. DATA SECURITY",
      paragraphs: [
        "Zynteksis applies reasonable technical and organizational measures intended to protect personal information against unauthorized access, loss, misuse, alteration, or disclosure.",
        "However, no internet-based service can guarantee absolute security.",
      ],
    },
    {
      heading: "10. DATA RETENTION",
      paragraphs: [
        "Personal data is retained only for as long as reasonably necessary for the purposes described in this Policy, contractual requirements, legal obligations, dispute resolution, security, and legitimate business needs.",
        "Retention periods may vary depending on the type and purpose of the data.",
      ],
    },
    {
      heading: "11. USER RIGHTS",
      paragraphs: [
        "Subject to applicable law, individuals may have rights including:",
      ],
      bullets: [
        "Learning whether personal data is processed;",
        "Requesting information regarding processing;",
        "Learning the purposes of processing and recipients;",
        "Requesting correction of inaccurate or incomplete data;",
        "Requesting deletion or destruction where legally applicable;",
        "Requesting notification of corrections or deletions to relevant recipients where required;",
        "Objecting to certain processing;",
        "Requesting restriction or limitation where applicable; and",
        "Exercising other rights provided by applicable data-protection law.",
      ],
      paragraphsAfterBullets: [
        "Requests may be submitted to:",
        LEGAL_OPERATOR.email,
      ],
    },
    {
      heading: "12. CHANGES",
      paragraphs: [
        "This Privacy Policy may be updated from time to time. The latest version will be published on the Zynteksis website.",
      ],
    },
    {
      heading: "13. CONTACT",
      paragraphs: [
        LEGAL_OPERATOR.name,
        LEGAL_OPERATOR.registrationNo,
        LEGAL_OPERATOR.address,
        LEGAL_OPERATOR.email,
      ],
    },
  ],
};
