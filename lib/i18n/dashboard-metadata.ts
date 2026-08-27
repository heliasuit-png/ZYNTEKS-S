import type { Metadata } from "next";

import { getDictionary } from "@/lib/i18n/get-dictionary";
import type { Dictionary } from "@/lib/i18n/dictionaries";

type DashboardPageKey = keyof Dictionary["dashboard"]["pageTitles"];

export async function dashboardPageMetadata(
  key: DashboardPageKey,
): Promise<Metadata> {
  const { dict } = await getDictionary();
  const page = dict.dashboard.pageTitles[key];
  return {
    title: page.title,
    description: page.description,
  };
}
