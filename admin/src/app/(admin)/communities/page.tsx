import { unstable_cache } from "next/cache";
import Link from "next/link";
import { count, desc, inArray } from "drizzle-orm";
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon, XIcon } from "lucide-react";

import { getDatabase } from "@/lib/core/database";
import { CACHE_TAGS, DATA_CACHE_TTL_SECONDS } from "@/lib/data-cache";
import { communities, summaries } from "@loyal-labs/db-core/schema";
import { PageContainer } from "@/components/layout/page-container";
import { SectionHeader } from "@/components/layout/section-header";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

const COMMUNITY_PAGE_SIZE = 20;

type HomePageProps = {
  searchParams?: Promise<{
    page?: string | string[];
  }>;
};

type PaginationToken = number | "start-ellipsis" | "end-ellipsis";
type HomeCommunityRow = {
  id: string;
  chatTitle: string;
  chatId: string;
  isActive: boolean;
  summaryNotificationsEnabled: boolean;
  isPublic: boolean;
};

type HomePageData = {
  rows: HomeCommunityRow[];
  summaryCountByCommunityId: Record<string, number>;
  currentPage: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

function parsePageParam(value: string | undefined): number {
  if (!value) return 1;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
}

function getPaginationTokens(currentPage: number, totalPages: number): PaginationToken[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const tokens: PaginationToken[] = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) {
    tokens.push("start-ellipsis");
  }

  for (let page = start; page <= end; page += 1) {
    tokens.push(page);
  }

  if (end < totalPages - 1) {
    tokens.push("end-ellipsis");
  }

  tokens.push(totalPages);
  return tokens;
}

function getPageHref(page: number) {
  return page > 1 ? `/communities?page=${page}` : "/communities";
}

async function loadHomePageData(requestedPage: number): Promise<HomePageData> {
  const db = getDatabase();
  const [totals] = await db
    .select({
      count: count(),
    })
    .from(communities);

  const totalCount = Number(totals?.count) || 0;
  const totalPages = totalCount > 0 ? Math.ceil(totalCount / COMMUNITY_PAGE_SIZE) : 1;
  const currentPage = Math.min(Math.max(requestedPage, 1), totalPages);
  const offset = (currentPage - 1) * COMMUNITY_PAGE_SIZE;

  const rows = await db
    .select({
      id: communities.id,
      chatTitle: communities.chatTitle,
      chatId: communities.chatId,
      isActive: communities.isActive,
      summaryNotificationsEnabled: communities.summaryNotificationsEnabled,
      isPublic: communities.isPublic,
    })
    .from(communities)
    .orderBy(desc(communities.activatedAt), desc(communities.id))
    .limit(COMMUNITY_PAGE_SIZE)
    .offset(offset);

  const serializedRows: HomeCommunityRow[] = rows.map((row) => ({
    ...row,
    chatId: row.chatId.toString(),
  }));

  const communityIds = serializedRows.map((row) => row.id);

  const summaryCounts =
    communityIds.length > 0
      ? await db
          .select({
            communityId: summaries.communityId,
            count: count(),
          })
          .from(summaries)
          .where(inArray(summaries.communityId, communityIds))
          .groupBy(summaries.communityId)
      : [];

  const summaryCountByCommunityId: Record<string, number> = Object.fromEntries(
    summaryCounts.map((row) => [row.communityId, Number(row.count) || 0]),
  );

  return {
    rows: serializedRows,
    summaryCountByCommunityId,
    currentPage,
    totalPages,
    hasPreviousPage: currentPage > 1,
    hasNextPage: currentPage < totalPages,
  };
}

async function getHomePageData(requestedPage: number): Promise<HomePageData> {
  const getCachedHomePageData = unstable_cache(
    async () => loadHomePageData(requestedPage),
    ["communities-page-data", String(requestedPage)],
    {
      revalidate: DATA_CACHE_TTL_SECONDS,
      tags: [CACHE_TAGS.communitiesList],
    },
  );

  return getCachedHomePageData();
}

export default async function Home({ searchParams }: HomePageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const pageParam = Array.isArray(resolvedSearchParams.page)
    ? resolvedSearchParams.page[0]
    : resolvedSearchParams.page;
  const requestedPage = parsePageParam(pageParam);
  const {
    rows,
    summaryCountByCommunityId,
    currentPage,
    totalPages,
    hasPreviousPage,
    hasNextPage,
  } = await getHomePageData(requestedPage);
  const paginationTokens = getPaginationTokens(currentPage, totalPages);

  return (
    <PageContainer>
      <SectionHeader title="Communities" breadcrumbs={[{ label: "Communities" }]} />

      {rows.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Telegram ID</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Notifications</TableHead>
                <TableHead>Public</TableHead>
                <TableHead className="text-right">Summaries</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((community) => (
                <TableRow key={community.id}>
                  <TableCell className="max-w-[26rem] truncate font-medium">
                    <Link
                      href={`/communities/${community.id}`}
                      className="underline underline-offset-2 hover:text-foreground/80"
                    >
                      {community.chatTitle}
                    </Link>
                  </TableCell>
                  <TableCell>{String(community.chatId)}</TableCell>
                  <TableCell>
                    {community.isActive ? (
                      <CheckIcon aria-label="Active" className="size-4 text-foreground" />
                    ) : (
                      <XIcon aria-label="Inactive" className="size-4 text-muted-foreground" />
                    )}
                  </TableCell>
                  <TableCell>
                    {community.summaryNotificationsEnabled ? (
                      <CheckIcon aria-label="Notifications on" className="size-4 text-foreground" />
                    ) : (
                      <XIcon aria-label="Notifications off" className="size-4 text-muted-foreground" />
                    )}
                  </TableCell>
                  <TableCell>
                    {community.isPublic ? (
                      <CheckIcon aria-label="Public" className="size-4 text-foreground" />
                    ) : (
                      <XIcon aria-label="Private" className="size-4 text-muted-foreground" />
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {summaryCountByCommunityId[community.id] ?? 0}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="border-t border-border px-4 py-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>

              <Pagination className="mx-0 w-auto justify-start sm:justify-end">
                <PaginationContent>
                  <PaginationItem>
                    {hasPreviousPage ? (
                      <PaginationLink asChild size="default" className="gap-1 pl-2.5">
                        <Link href={getPageHref(currentPage - 1)} prefetch={false}>
                          <ChevronLeftIcon className="size-4" />
                          <span>Previous</span>
                        </Link>
                      </PaginationLink>
                    ) : (
                      <PaginationLink
                        size="default"
                        aria-disabled="true"
                        className="pointer-events-none gap-1 pl-2.5 opacity-50"
                      >
                        <ChevronLeftIcon className="size-4" />
                        <span>Previous</span>
                      </PaginationLink>
                    )}
                  </PaginationItem>

                  {paginationTokens.map((token) => {
                    if (token === "start-ellipsis" || token === "end-ellipsis") {
                      return (
                        <PaginationItem key={token}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }

                    return (
                      <PaginationItem key={token}>
                        <PaginationLink asChild isActive={token === currentPage}>
                          <Link href={getPageHref(token)} prefetch={false}>
                            {token}
                          </Link>
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}

                  <PaginationItem>
                    {hasNextPage ? (
                      <PaginationLink asChild size="default" className="gap-1 pr-2.5">
                        <Link href={getPageHref(currentPage + 1)} prefetch={false}>
                          <span>Next</span>
                          <ChevronRightIcon className="size-4" />
                        </Link>
                      </PaginationLink>
                    ) : (
                      <PaginationLink
                        size="default"
                        aria-disabled="true"
                        className="pointer-events-none gap-1 pr-2.5 opacity-50"
                      >
                        <span>Next</span>
                        <ChevronRightIcon className="size-4" />
                      </PaginationLink>
                    )}
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card p-10 text-center text-muted-foreground">
          No communities found
        </div>
      )}
    </PageContainer>
  );
}
