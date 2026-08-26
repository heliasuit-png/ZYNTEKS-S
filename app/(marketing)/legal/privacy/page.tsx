import {
  LegalDocument,
  legalMetadata,
} from "@/features/landing/components/legal-document";

export const generateMetadata = () => legalMetadata("privacy");

export default function Page() {
  return <LegalDocument kind="privacy" />;
}
