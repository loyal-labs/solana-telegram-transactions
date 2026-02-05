import { Tag } from "@irys/upload-core";
import {
  AnyVariables,
  cacheExchange,
  type Client,
  createClient,
  fetchExchange,
  type TypedDocumentNode,
} from "urql";

import {
  IRYS_GRAPHQL_ENDPOINT,
  TRANSACTIONS_BY_IDS_QUERY,
  TRANSACTIONS_BY_TAGS_QUERY,
} from "./contants";
import {
  IrysTagFilter,
  IrysTransaction,
  TransactionsByIdsQueryVariables,
  TransactionsByTagsQueryVariables,
  TransactionsQueryResult,
} from "./types";

export const irysGraphqlClient: Client = createClient({
  url: IRYS_GRAPHQL_ENDPOINT,
  exchanges: [cacheExchange, fetchExchange],
  requestPolicy: "network-only",
});

function mapEdgesToTransactions(
  edges?: Array<{ node?: IrysTransaction | null } | null>
): IrysTransaction[] {
  return (
    edges
      ?.map((edge) => edge?.node ?? null)
      .filter((node): node is IrysTransaction => node !== null) ?? []
  );
}

async function executeTransactionsQuery<Variables extends AnyVariables>(
  query: TypedDocumentNode<TransactionsQueryResult, Variables>,
  variables: Variables
): Promise<IrysTransaction[]> {
  const result = await irysGraphqlClient
    .query<TransactionsQueryResult, Variables>(query, variables)
    .toPromise();

  if (result.error) {
    throw result.error;
  }

  return mapEdgesToTransactions(result.data?.transactions?.edges);
}

async function queryTransactionsByTags(
  tags: IrysTagFilter[]
): Promise<IrysTransaction[]> {
  return executeTransactionsQuery<TransactionsByTagsQueryVariables>(
    TRANSACTIONS_BY_TAGS_QUERY,
    { tags }
  );
}

export async function queryTransactionsByIds(
  ids: string[]
): Promise<IrysTransaction[]> {
  if (!ids.length) {
    return [];
  }

  return executeTransactionsQuery<TransactionsByIdsQueryVariables>(
    TRANSACTIONS_BY_IDS_QUERY,
    { ids }
  );
}

export async function queryTransactionsByTag(
  tagName: string,
  tagValue: string
): Promise<IrysTransaction[]> {
  const name = tagName.trim();
  const value = tagValue.trim();

  if (!name || !value) {
    return [];
  }

  return queryTransactionsByTags([{ name, values: [value] }]);
}

export async function queryTransactionsByTagsWithOr(
  tagName: string,
  tagValues: string[]
): Promise<IrysTransaction[]> {
  const name = tagName.trim();
  const values = tagValues.map((value) => value.trim()).filter(Boolean);

  if (!name || !values.length) {
    return [];
  }

  return queryTransactionsByTags([{ name, values }]);
}

export async function queryTransactionsByTagsWithAnd(
  tags: Tag[]
): Promise<IrysTransaction[]> {
  const tagFilters = tags
    .map((tag) => {
      const name = tag?.name?.trim();
      const value = tag?.value?.trim();
      if (!name || !value) {
        return null;
      }
      return { name, values: [value] };
    })
    .filter((tag): tag is IrysTagFilter => tag !== null);

  if (!tagFilters.length) {
    return [];
  }

  return queryTransactionsByTags(tagFilters);
}
