import { BrandLoader } from "@/components/brand/brand-loader";

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zt-bg text-zt-text">
      <BrandLoader />
    </div>
  );
}
