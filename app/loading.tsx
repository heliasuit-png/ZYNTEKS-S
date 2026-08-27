import { BrandLoader } from "@/components/brand/brand-loader";
import { APP_NAME } from "@/lib/constants";
import { fillTemplate } from "@/lib/i18n/fill-template";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export default async function Loading() {
  const { dict } = await getDictionary();

  return (
    <div className="flex min-h-screen items-center justify-center bg-zt-bg text-zt-text">
      <BrandLoader
        label={fillTemplate(dict.dashboardCommon.loadingStates.initializing, {
          app: APP_NAME,
        })}
      />
    </div>
  );
}
