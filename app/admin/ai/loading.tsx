import { AdminLoadingSkeleton } from "@/features/admin/components/ui/admin-loading-skeleton";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export default async function AdminAiLoading() {
  const { dict } = await getDictionary();
  return <AdminLoadingSkeleton label={dict.admin.loading.ai} />;
}
