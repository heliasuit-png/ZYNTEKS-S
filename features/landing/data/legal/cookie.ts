import {
  LEGAL_LAST_UPDATED,
  LEGAL_OPERATOR,
  type LegalDocumentBody,
} from "./terms";

export const cookieDocument: LegalDocumentBody = {
  lastUpdated: LEGAL_LAST_UPDATED,
  intro: [
    "This Cookie Policy explains how Zynteksis uses cookies and similar technologies on its website and platform.",
  ],
  sections: [
    {
      heading: "1. WHAT ARE COOKIES?",
      paragraphs: [
        "Cookies are small data files stored on a user's device when visiting a website or using an online service.",
        "They may be used to remember preferences, maintain sessions, provide security, and understand how a service is used.",
      ],
    },
    {
      heading: "2. TYPES OF COOKIES",
      paragraphs: [
        "Zynteksis may use the following categories of cookies:",
        "Strictly Necessary Cookies",
        "These cookies are required for core functionality such as:",
      ],
      bullets: [
        "Authentication;",
        "Account sessions;",
        "Security;",
        "Load balancing;",
        "User preferences necessary for the Service; and",
        "Other essential technical functions.",
      ],
      paragraphsAfterBullets: [
        "These cookies may be used without consent where permitted by applicable law because they are necessary to provide the requested service.",
        "Analytics Cookies",
        "Where enabled, analytics cookies may help Zynteksis understand how users interact with the website and improve performance and usability.",
        "Where required by applicable law, non-essential analytics cookies will only be activated after the required consent has been obtained.",
        "Preference Cookies",
        "These cookies may remember user preferences such as language or interface settings.",
        "Marketing Cookies",
        "Zynteksis will not activate non-essential marketing or advertising cookies unless the applicable legal requirements, including consent where required, have been satisfied.",
      ],
    },
    {
      heading: "3. COOKIE CONSENT",
      paragraphs: [
        "Where consent is legally required, users will be provided with an appropriate cookie consent mechanism.",
        "Users may change or withdraw their cookie preferences through the available cookie-management controls.",
      ],
    },
    {
      heading: "4. THIRD-PARTY TECHNOLOGIES",
      paragraphs: [
        "Certain third-party providers may use cookies or similar technologies when their services are integrated into Zynteksis.",
        "The applicable third-party privacy and cookie policies may also apply.",
      ],
    },
    {
      heading: "5. BROWSER CONTROLS",
      paragraphs: [
        "Users may configure their browsers to block or delete cookies.",
        "Blocking necessary cookies may affect the functionality or availability of certain Zynteksis features.",
      ],
    },
    {
      heading: "6. PERSONAL DATA",
      paragraphs: [
        "Where cookies or similar technologies process information that qualifies as personal data under applicable law, such processing is subject to the applicable privacy and data-protection requirements.",
      ],
    },
    {
      heading: "7. CONTACT",
      paragraphs: [
        "For questions regarding cookies or privacy:",
        LEGAL_OPERATOR.name,
        `Email: ${LEGAL_OPERATOR.email}`,
        `Address: ${LEGAL_OPERATOR.address}`,
      ],
    },
  ],
};
