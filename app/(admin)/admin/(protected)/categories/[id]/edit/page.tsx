export const dynamic = 'force-dynamic'
import { redirect } from "next/navigation";

export default async function AdminEditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/admin/categories?edit=${id}`);
}
