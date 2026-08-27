import {
  LEGAL_LAST_UPDATED,
  LEGAL_OPERATOR,
  type LegalDocumentBody,
} from "./terms";

export const kvkkDocument: LegalDocumentBody = {
  lastUpdated: LEGAL_LAST_UPDATED,
  intro: [
    'This KVKK Disclosure Notice has been prepared in accordance with the Turkish Law No. 6698 on the Protection of Personal Data ("KVKK") and applicable secondary legislation.',
  ],
  sections: [
    {
      heading: "1. DATA CONTROLLER",
      paragraphs: [
        "Under KVKK, the data controller is:",
        LEGAL_OPERATOR.name,
        `Identification / Registration No.: ${LEGAL_OPERATOR.registrationNo}`,
        `Address: ${LEGAL_OPERATOR.address}`,
        `Email: ${LEGAL_OPERATOR.email}`,
      ],
    },
    {
      heading: "2. PERSONAL DATA PROCESSED",
      paragraphs: [
        "Depending on the relationship with Zynteksis and the services used, the following categories of personal data may be processed:",
      ],
      bullets: [
        "Identity information;",
        "Contact information;",
        "Account and authentication information;",
        "Transaction and subscription information, where applicable;",
        "Customer support communications;",
        "IP address and technical identifiers;",
        "Device and browser information;",
        "Security and access logs;",
        "Project-related information;",
        "Application error and performance information; and",
        "Other personal data necessary for the provision and security of the Service.",
      ],
    },
    {
      heading: "3. PURPOSES OF PROCESSING",
      paragraphs: [
        "Personal data may be processed for the following purposes:",
      ],
      bullets: [
        "Creating and managing user accounts;",
        "Providing Zynteksis services;",
        "Monitoring and analyzing software errors and performance;",
        "Providing AI-assisted technical analysis;",
        "Providing customer support;",
        "Ensuring information and system security;",
        "Preventing unauthorized access and abuse;",
        "Managing subscriptions and transactions where applicable;",
        "Fulfilling legal obligations;",
        "Establishing, exercising, or protecting legal rights; and",
        "Improving the security, reliability, and functionality of Zynteksis.",
      ],
    },
    {
      heading: "4. METHODS OF COLLECTION",
      paragraphs: ["Personal data may be collected electronically through:"],
      bullets: [
        "Zynteksis account registration;",
        "Website forms;",
        "Authentication systems;",
        "SDKs and APIs;",
        "Application and system logs;",
        "Customer support communications;",
        "Subscription and payment processes where applicable;",
        "Cookies and similar technologies; and",
        "Other electronic interactions with Zynteksis.",
      ],
    },
    {
      heading: "5. LEGAL GROUNDS",
      paragraphs: [
        "Personal data may be processed on the legal grounds permitted under Articles 5 and 6 of KVKK, including where applicable:",
      ],
      bullets: [
        "Explicitly provided legal conditions permit processing;",
        "Processing is necessary for the establishment or performance of a contract;",
        "Processing is necessary for compliance with a legal obligation;",
        "Processing is necessary for the establishment, exercise, or protection of a right;",
        "Processing is necessary for legitimate interests where permitted by law and where the fundamental rights of the data subject are not disproportionately affected; and",
        "Explicit consent is obtained where required by law.",
      ],
    },
    {
      heading: "6. TRANSFERS OF PERSONAL DATA",
      paragraphs: [
        "Personal data may be transferred, where necessary and legally permitted, to:",
      ],
      bullets: [
        "Hosting and cloud service providers;",
        "Infrastructure and technology providers;",
        "Authentication and security providers;",
        "AI service providers;",
        "Analytics providers;",
        "Customer support providers;",
        "Payment service providers where applicable;",
        "Authorized public institutions and authorities where legally required; and",
        "Professional advisers or service providers where necessary to protect legal rights.",
      ],
      paragraphsAfterBullets: [
        "Where international transfers occur, applicable legal requirements and safeguards will be applied.",
      ],
    },
    {
      heading: "7. DATA RETENTION",
      paragraphs: [
        "Personal data is retained for the periods required or permitted by applicable law and for as long as necessary for the purposes for which it was collected.",
        "Retention periods may differ depending on the category of data and processing purpose.",
      ],
    },
    {
      heading: "8. RIGHTS OF THE DATA SUBJECT",
      paragraphs: [
        "Under Article 11 of KVKK, data subjects may have the right to:",
      ],
      bullets: [
        "Learn whether their personal data is processed;",
        "Request information if personal data has been processed;",
        "Learn the purpose of processing and whether the data is used in accordance with that purpose;",
        "Know the third parties to whom personal data is transferred domestically or abroad;",
        "Request correction of incomplete or inaccurate personal data;",
        "Request deletion or destruction of personal data under the conditions set out by law;",
        "Request notification of correction, deletion, or destruction to third parties where applicable;",
        "Object to an outcome arising against the person through analysis of processed data exclusively by automated systems;",
        "Request compensation for damages arising from unlawful processing of personal data.",
      ],
    },
    {
      heading: "9. EXERCISING YOUR RIGHTS",
      paragraphs: [
        "Requests concerning your rights under KVKK may be submitted to:",
        LEGAL_OPERATOR.name,
        `Email: ${LEGAL_OPERATOR.email}`,
        `Address: ${LEGAL_OPERATOR.address}`,
        "Applications will be handled in accordance with the procedures and deadlines provided under applicable KVKK legislation.",
      ],
    },
    {
      heading: "10. IMPORTANT NOTICE",
      paragraphs: [
        "This Disclosure Notice is intended to inform data subjects about the processing of personal data.",
        "Where separate explicit consent is legally required, such consent will be requested separately from this Disclosure Notice.",
      ],
    },
  ],
};
