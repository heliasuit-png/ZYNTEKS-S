import {
  LEGAL_LAST_UPDATED,
  LEGAL_OPERATOR,
  type LegalDocumentBody,
} from "./terms";

export const preliminaryInformationDocument: LegalDocumentBody = {
  lastUpdated: LEGAL_LAST_UPDATED,
  intro: [
    "This Preliminary Information Form is provided to consumers before the conclusion of a distance contract for paid Zynteksis services.",
  ],
  sections: [
    {
      heading: "1. SERVICE PROVIDER INFORMATION",
      paragraphs: [
        `Operator / Service Provider: ${LEGAL_OPERATOR.name}`,
        `Identification / Registration No.: ${LEGAL_OPERATOR.registrationNo}`,
        `Address: ${LEGAL_OPERATOR.address}`,
        `Email: ${LEGAL_OPERATOR.email}`,
      ],
    },
    {
      heading: "2. SERVICE",
      paragraphs: [
        "Zynteksis is a software platform providing development monitoring and AI-assisted software troubleshooting capabilities.",
        "Depending on the selected plan, the service may include:",
      ],
      bullets: [
        "Error monitoring;",
        "JavaScript and React error tracking;",
        "Network monitoring;",
        "Performance and latency monitoring;",
        "Heartbeat monitoring;",
        "Incident management;",
        "Alerts and notifications;",
        "Status pages;",
        "Dashboards;",
        "AI-assisted code analysis;",
        "AI-assisted error analysis;",
        "Root-cause analysis; and",
        "Debugging assistance.",
      ],
      paragraphsAfterBullets: [
        "The exact features and limits are determined by the plan selected by the consumer.",
      ],
    },
    {
      heading: "3. PRICE",
      paragraphs: [
        "The applicable subscription price, billing period, taxes, and any applicable additional charges shall be clearly displayed before the consumer completes the purchase.",
        "The consumer will not be charged for a service that is expressly offered as free.",
      ],
    },
    {
      heading: "4. PAYMENT",
      paragraphs: [
        "Available payment methods will be displayed during the checkout process when paid subscriptions are enabled.",
        "No payment information shall be requested where the relevant Zynteksis feature is provided free of charge.",
      ],
    },
    {
      heading: "5. PERFORMANCE OF THE SERVICE",
      paragraphs: [
        "Zynteksis is a digital service. Access is provided electronically following successful account and, where applicable, subscription activation.",
      ],
    },
    {
      heading: "6. WITHDRAWAL RIGHT",
      paragraphs: [
        "Consumers may exercise any statutory withdrawal right available under applicable Turkish consumer legislation.",
        "For digital services, the statutory exceptions to the withdrawal right may apply when the legal requirements for such exception are satisfied, including where performance has begun with the consumer's express request before expiry of the withdrawal period.",
      ],
    },
    {
      heading: "7. CANCELLATION AND REFUND",
      paragraphs: [
        "Cancellation and refund conditions are explained in the Zynteksis Refund & Cancellation Policy and are subject to mandatory consumer rights under applicable law.",
      ],
    },
    {
      heading: "8. SERVICE LIMITATIONS",
      paragraphs: [
        "Zynteksis is an assistance and monitoring tool. It does not guarantee detection of every software error or incident and does not guarantee that AI-generated recommendations will resolve a particular technical issue.",
      ],
    },
    {
      heading: "9. CONSUMER RESPONSIBILITIES",
      paragraphs: [
        "The consumer is responsible for reviewing AI-generated information, testing recommendations, maintaining backups, protecting API keys, and making final technical and production decisions.",
      ],
    },
    {
      heading: "10. COMPLAINTS AND CONTACT",
      paragraphs: [
        "Consumers may contact the Service Provider at:",
        `Email: ${LEGAL_OPERATOR.email}`,
        `Address: ${LEGAL_OPERATOR.address}`,
        "Mandatory consumer dispute-resolution mechanisms under Turkish law remain applicable.",
      ],
    },
  ],
};
