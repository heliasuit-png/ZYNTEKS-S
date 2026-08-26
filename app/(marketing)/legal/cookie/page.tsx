import {
  LegalDocument,
  legalMetadata,
} from "@/features/landing/components/legal-document";

export const generateMetadata = () => legalMetadata("cookie");

export default function Page() {
  return <LegalDocument kind="cookie" />;
}
