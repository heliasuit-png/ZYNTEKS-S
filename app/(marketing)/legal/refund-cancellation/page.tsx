import {
  LegalDocument,
  legalMetadata,
} from "@/features/landing/components/legal-document";

export const generateMetadata = () => legalMetadata("refund-cancellation");

export default function Page() {
  return <LegalDocument kind="refund-cancellation" />;
}
