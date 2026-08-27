import {
  LegalDocument,
  legalMetadata,
} from "@/features/landing/components/legal-document";

export const generateMetadata = () => legalMetadata("distance-sales");

export default function Page() {
  return <LegalDocument kind="distance-sales" />;
}
