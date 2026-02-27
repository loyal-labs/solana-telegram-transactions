import { desc } from "drizzle-orm";

import { db } from "@/lib/db";
import { admins } from "@/lib/generated/schema";
import { PageContainer } from "@/components/layout/page-container";
import { SectionHeader } from "@/components/layout/section-header";

import { AdminList } from "./admin-list";

export const dynamic = "force-dynamic";

export default async function AdminsPage() {
  const rows = await db
    .select()
    .from(admins)
    .orderBy(desc(admins.addedAt));

  return (
    <PageContainer>
      <SectionHeader title="Admins" breadcrumbs={[{ label: "Admins" }]} />
      <AdminList admins={rows} />
    </PageContainer>
  );
}
