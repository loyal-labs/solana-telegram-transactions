import { PageContainer } from "@/components/layout/page-container";
import { SectionHeader } from "@/components/layout/section-header";
import { getOverviewData } from "./overview-data";
import { OverviewLineChart } from "./overview-line-chart";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const { chartPoints, totals30d, communitiesChartPoints, communitiesTotals30d } =
    await getOverviewData();

  return (
    <PageContainer>
      <SectionHeader title="Overview" breadcrumbs={[{ label: "Overview" }]} />
      <div className="space-y-6">
        <OverviewLineChart
          title="Activity trend"
          description="Total number of summaries created in the last 30 days"
          primaryLabel="Summaries"
          secondaryLabel="Messages"
          dataKey="summaries"
          data={chartPoints}
          totals={{
            primary: totals30d.summaries,
            secondary: totals30d.messages,
          }}
          yAxisLabel="Cumulative summaries"
        />
        <OverviewLineChart
          title="Community growth"
          description="Total number of onboarded communities in the last 30 days"
          primaryLabel="Communities"
          secondaryLabel="Users"
          dataKey="communities"
          data={communitiesChartPoints}
          totals={{
            primary: communitiesTotals30d.communities,
            secondary: communitiesTotals30d.users,
          }}
          yAxisLabel="Cumulative communities"
        />
      </div>
    </PageContainer>
  );
}
