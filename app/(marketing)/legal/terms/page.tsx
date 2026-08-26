import {
  LegalDocument,
  legalMetadata,
} from "@/features/landing/components/legal-document";

export const generateMetadata = () => legalMetadata("terms");

export default function Page() {
  return <LegalDocument kind="terms" />;
}
