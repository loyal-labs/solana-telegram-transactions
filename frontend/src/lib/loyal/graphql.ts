import {
  type Client,
  cacheExchange,
  createClient,
  fetchExchange,
  gql,
} from "urql";

export const IRYS_GRAPHQL_ENDPOINT = "https://uploader.irys.xyz/graphql";

export const irysGraphqlClient: Client = createClient({
  url: IRYS_GRAPHQL_ENDPOINT,
  exchanges: [cacheExchange, fetchExchange],
  requestPolicy: "network-only",
});

const TRANSACTIONS_BY_IDS_QUERY = gql`
  query TransactionsByIds($ids: [String!]!) {
    transactions(ids: $ids) {
      edges {
        node {
          id
          address
          token
          timestamp
          tags {
            name
            value
          }
        }
      }
    }
  }
`;

export interface IrysTransactionTag {
  name: string;
  value: string;
}

export interface IrysTransaction {
  id: string;
  address?: string | null;
  token?: string | null;
  timestamp?: number | null;
  tags?: IrysTransactionTag[] | null;
}

interface TransactionsByIdsQueryVariables {
  ids: string[];
}

interface TransactionsByIdsQueryResult {
  transactions?: {
    edges?: Array<{
      node?: IrysTransaction | null;
    } | null>;
  } | null;
}

export async function fetchTransactionsByIds(
  ids: string[]
): Promise<IrysTransaction[]> {
  if (!ids.length) {
    return [];
  }

  const result = await irysGraphqlClient
    .query<TransactionsByIdsQueryResult, TransactionsByIdsQueryVariables>(
      TRANSACTIONS_BY_IDS_QUERY,
      { ids }
    )
    .toPromise();

  if (result.error) {
    throw result.error;
  }

  return (
    result.data?.transactions?.edges
      ?.map((edge) => edge?.node ?? null)
      .filter((node): node is IrysTransaction => node !== null) ?? []
  );
}
