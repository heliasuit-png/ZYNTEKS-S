import { BrandLoader } from "@/components/brand/brand-loader";
import { APP_NAME } from "@/lib/constants";
import { fillTemplate } from "@/lib/i18n/fill-template";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export default async function AuthLoading() {
  const { dict } = await getDictionary();

  return (
    <BrandLoader
      label={fillTemplate(dict.dashboardCommon.loadingStates.initializing, {
        app: APP_NAME,
      })}
    />
  );
}
