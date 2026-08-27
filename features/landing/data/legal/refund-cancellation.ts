import {
  LEGAL_LAST_UPDATED,
  LEGAL_OPERATOR,
  type LegalDocumentBody,
} from "./terms";

export const refundCancellationDocument: LegalDocumentBody = {
  lastUpdated: LEGAL_LAST_UPDATED,
  intro: [
    "This Refund & Cancellation Policy explains the cancellation and refund rules applicable to Zynteksis services.",
  ],
  sections: [
    {
      heading: "1. FREE SERVICES",
      paragraphs: [
        "Free Zynteksis features may be discontinued or limited at any time in accordance with the applicable Terms of Service.",
        "No refund is applicable to services for which no payment has been made.",
      ],
    },
    {
      heading: "2. PAID SUBSCRIPTIONS",
      paragraphs: [
        "Where paid subscriptions are available, the applicable billing period and price will be displayed before purchase.",
        "Users may cancel a subscription in accordance with the cancellation options provided by Zynteksis.",
        "Unless otherwise required by applicable law, cancellation of a subscription prevents the next renewal but does not automatically create a refund for a period that has already begun.",
      ],
    },
    {
      heading: "3. STATUTORY CONSUMER RIGHTS",
      paragraphs: [
        "Nothing in this Policy limits mandatory consumer rights provided under applicable Turkish law.",
        "Where a consumer has a statutory right to withdraw from or cancel a transaction, Zynteksis will process the request in accordance with applicable law.",
      ],
    },
    {
      heading: "4. DIGITAL SERVICES",
      paragraphs: [
        "Zynteksis is a digital software service.",
        "Where legally permitted, the statutory withdrawal right for digital services may not apply after the consumer has expressly requested immediate performance and the applicable legal conditions for the withdrawal exception have been satisfied.",
      ],
    },
    {
      heading: "5. REFUND ELIGIBILITY",
      paragraphs: ["A refund may be available where:"],
      bullets: [
        "Required by applicable law;",
        "A payment was processed incorrectly;",
        "Zynteksis expressly agrees to a refund;",
        "A service was materially unavailable in circumstances giving rise to a refund under applicable law; or",
        "Another legally recognized refund right applies.",
      ],
    },
    {
      heading: "6. NON-REFUNDABLE CIRCUMSTANCES",
      paragraphs: [
        "Subject to mandatory legal rights, refunds may not be available solely because:",
      ],
      bullets: [
        "The user did not use the Service;",
        "The user did not configure the Service correctly;",
        "The user did not review AI-generated recommendations;",
        "The user changed their mind after a legally valid digital-service withdrawal exception became applicable; or",
        "The user expected the AI system to guarantee a particular software result.",
      ],
    },
    {
      heading: "7. REFUND METHOD",
      paragraphs: [
        "Approved refunds will normally be returned through the original payment method where technically and legally possible.",
        "Processing time may depend on the payment provider or financial institution.",
      ],
    },
    {
      heading: "8. CONTACT",
      paragraphs: [
        "Refund and cancellation requests may be submitted to:",
        LEGAL_OPERATOR.email,
        "Please include the account email address and relevant subscription or transaction information.",
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
