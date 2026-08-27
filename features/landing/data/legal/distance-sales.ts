import {
  LEGAL_LAST_UPDATED,
  LEGAL_OPERATOR,
  type LegalDocumentBody,
} from "./terms";

export const distanceSalesDocument: LegalDocumentBody = {
  lastUpdated: LEGAL_LAST_UPDATED,
  intro: [
    'This Distance Sales Agreement ("Agreement") is concluded electronically between the service provider and the consumer/user purchasing a paid Zynteksis service.',
  ],
  sections: [
    {
      heading: "1. SERVICE PROVIDER",
      paragraphs: [
        `Operator / Service Provider: ${LEGAL_OPERATOR.name}`,
        `Identification / Registration No.: ${LEGAL_OPERATOR.registrationNo}`,
        `Address: ${LEGAL_OPERATOR.address}`,
        `Email: ${LEGAL_OPERATOR.email}`,
      ],
    },
    {
      heading: "2. CONSUMER",
      paragraphs: [
        "The consumer's name, surname, billing information, contact information, selected plan, order date, price, and other order-specific information shall be displayed and/or recorded during the ordering process.",
      ],
    },
    {
      heading: "3. SUBJECT OF THE AGREEMENT",
      paragraphs: [
        "The subject of this Agreement is the provision of access to the Zynteksis software platform and the digital software services selected by the consumer.",
        "Zynteksis may provide software monitoring, error tracking, performance monitoring, incident management, alerting, AI-assisted code analysis, AI-assisted error analysis, root-cause analysis, and debugging assistance depending on the selected plan.",
      ],
    },
    {
      heading: "4. CONTRACT FORMATION",
      paragraphs: [
        "The Agreement is formed electronically when the consumer completes the applicable order process and, where applicable, completes the payment process.",
        "The consumer will be presented with the applicable service details, price, billing period, cancellation/refund conditions, and other mandatory information before becoming subject to a payment obligation.",
      ],
    },
    {
      heading: "5. PRICE AND PAYMENT",
      paragraphs: [
        "The applicable price is the price displayed to the consumer immediately before the purchase.",
        "Unless otherwise expressly stated, applicable taxes and mandatory charges will be reflected in the price information presented during checkout.",
        "Where Zynteksis has not activated paid checkout functionality, no payment obligation arises merely from creating an account or using a free feature.",
      ],
    },
    {
      heading: "6. DELIVERY / PERFORMANCE",
      paragraphs: [
        "Because Zynteksis is a digital software service, performance is provided electronically.",
        "Where immediate digital service access is selected and technically available, access may begin immediately after successful order completion and payment.",
      ],
    },
    {
      heading: "7. RIGHT OF WITHDRAWAL",
      paragraphs: [
        "Where the consumer is legally entitled to a right of withdrawal, that right shall be exercised in accordance with applicable Turkish consumer legislation.",
        "For digital services, exceptions to the right of withdrawal may apply where the consumer expressly requests that performance begin before the withdrawal period expires and the statutory conditions for the exception are satisfied.",
      ],
    },
    {
      heading: "8. REFUNDS",
      paragraphs: [
        "Refunds shall be handled in accordance with applicable law and the Zynteksis Refund & Cancellation Policy.",
        "Where a refund is legally required, it shall be processed using the applicable payment method or another lawful method.",
      ],
    },
    {
      heading: "9. USER RESPONSIBILITIES",
      paragraphs: ["The consumer is responsible for:"],
      bullets: [
        "Providing accurate account information;",
        "Protecting account credentials and API keys;",
        "Ensuring that submitted code and data may lawfully be processed;",
        "Reviewing AI-generated recommendations;",
        "Testing proposed solutions before deployment; and",
        "Maintaining appropriate backups and production safeguards.",
      ],
    },
    {
      heading: "10. AI-ASSISTED SERVICE",
      paragraphs: [
        "The consumer acknowledges that AI-generated results may contain errors or incomplete information.",
        "AI analysis is provided as technical assistance and does not constitute a guarantee of a particular software outcome.",
      ],
    },
    {
      heading: "11. TERMINATION",
      paragraphs: [
        "The Agreement may be terminated in accordance with applicable law and the applicable cancellation terms.",
        "Termination does not affect rights and obligations that arose before termination.",
      ],
    },
    {
      heading: "12. DISPUTE RESOLUTION",
      paragraphs: [
        "Mandatory consumer protection, mediation, consumer arbitration committee, consumer court, and jurisdiction rules applicable under Turkish law shall remain applicable where relevant.",
      ],
    },
    {
      heading: "13. EFFECTIVE DATE",
      paragraphs: [
        "This Agreement becomes effective when the paid service order is successfully completed.",
      ],
    },
  ],
  closing: [
    "Service Provider:",
    LEGAL_OPERATOR.name,
    LEGAL_OPERATOR.registrationNo,
    LEGAL_OPERATOR.address,
    LEGAL_OPERATOR.email,
  ],
};
