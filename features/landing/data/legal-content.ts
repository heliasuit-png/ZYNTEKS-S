/**
 * Canonical legal documents for Zynteksis.
 * EN bodies are the original source text; TR bodies are locale counterparts.
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
import { cookieDocumentTr } from "@/features/landing/data/legal/tr/cookie";
import { distanceSalesDocumentTr } from "@/features/landing/data/legal/tr/distance-sales";
import { kvkkDocumentTr } from "@/features/landing/data/legal/tr/kvkk";
import { preliminaryInformationDocumentTr } from "@/features/landing/data/legal/tr/preliminary-information";
import { privacyDocumentTr } from "@/features/landing/data/legal/tr/privacy";
import { refundCancellationDocumentTr } from "@/features/landing/data/legal/tr/refund-cancellation";
import { termsDocumentTr } from "@/features/landing/data/legal/tr/terms";
import type { Locale } from "@/lib/i18n/config";

export type LegalDocumentKind =
  | "privacy"
  | "terms"
  | "cookie"
  | "kvkk"
  | "distance-sales"
  | "preliminary-information"
  | "refund-cancellation";

const DOCUMENTS_EN: Record<LegalDocumentKind, LegalDocumentBody> = {
  privacy: privacyDocument,
  terms: termsDocument,
  cookie: cookieDocument,
  kvkk: kvkkDocument,
  "distance-sales": distanceSalesDocument,
  "preliminary-information": preliminaryInformationDocument,
  "refund-cancellation": refundCancellationDocument,
};

const DOCUMENTS_TR: Record<LegalDocumentKind, LegalDocumentBody> = {
  privacy: privacyDocumentTr,
  terms: termsDocumentTr,
  cookie: cookieDocumentTr,
  kvkk: kvkkDocumentTr,
  "distance-sales": distanceSalesDocumentTr,
  "preliminary-information": preliminaryInformationDocumentTr,
  "refund-cancellation": refundCancellationDocumentTr,
};

export function getLegalDocument(
  kind: LegalDocumentKind,
  locale: Locale = "en",
): LegalDocumentBody {
  return locale === "tr" ? DOCUMENTS_TR[kind] : DOCUMENTS_EN[kind];
}
