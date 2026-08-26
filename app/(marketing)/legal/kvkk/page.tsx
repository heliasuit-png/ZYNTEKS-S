import {
  LegalDocument,
  legalMetadata,
} from "@/features/landing/components/legal-document";

export const generateMetadata = () => legalMetadata("kvkk");

export default function Page() {
  return <LegalDocument kind="kvkk" />;
}
