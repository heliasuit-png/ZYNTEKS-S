/**
 * Canonical legal documents for Zynteksis.
 * Bodies are exact English source text — do not paraphrase or invent wording.
 */

export type {
  LegalDocumentBody,
  LegalSection,
} from "@/features/landing/data/legal/terms";
export {
  LEGAL_LAST_UPDATED,
  LEGAL_OPERATOR,
  termsDocument,
} from "@/features/landing/data/legal/terms";
export { privacyDocument } from "@/features/landing/data/legal/privacy";
export { cookieDocument } from "@/features/landing/data/legal/cookie";
export { kvkkDocument } from "@/features/landing/data/legal/kvkk";
export { distanceSalesDocument } from "@/features/landing/data/legal/distance-sales";
export { preliminaryInformationDocument } from "@/features/landing/data/legal/preliminary-information";
export { refundCancellationDocument } from "@/features/landing/data/legal/refund-cancellation";

import type { LegalDocumentBody } from "@/features/landing/data/legal/terms";
import { cookieDocument } from "@/features/landing/data/legal/cookie";
import { distanceSalesDocument } from "@/features/landing/data/legal/distance-sales";
import { kvkkDocument } from "@/features/landing/data/legal/kvkk";
import { preliminaryInformationDocument } from "@/features/landing/data/legal/preliminary-information";
import { privacyDocument } from "@/features/landing/data/legal/privacy";
import { refundCancellationDocument } from "@/features/landing/data/legal/refund-cancellation";
import { termsDocument } from "@/features/landing/data/legal/terms";

export type LegalDocumentKind =
  | "privacy"
  | "terms"
  | "cookie"
  | "kvkk"
  | "distance-sales"
  | "preliminary-information"
  | "refund-cancellation";

export function getLegalDocument(kind: LegalDocumentKind): LegalDocumentBody {
  switch (kind) {
    case "privacy":
      return privacyDocument;
    case "terms":
      return termsDocument;
    case "cookie":
      return cookieDocument;
    case "kvkk":
      return kvkkDocument;
    case "distance-sales":
      return distanceSalesDocument;
    case "preliminary-information":
      return preliminaryInformationDocument;
    case "refund-cancellation":
      return refundCancellationDocument;
  }
}
