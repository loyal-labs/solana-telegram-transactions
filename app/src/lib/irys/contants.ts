import { gql, type TypedDocumentNode } from "urql";

import {
  TransactionsByIdsQueryVariables,
  TransactionsByTagsQueryVariables,
  TransactionsQueryResult,
} from "./types";

export const IRYS_MUTABLE_URL = "https://gateway.irys.xyz/mutable/";
export const IRYS_GRAPHQL_ENDPOINT = "https://uploader.irys.xyz/graphql";

// GraphQL queries
const TRANSACTION_FIELDS = `
          id
          address
          token
          timestamp
          tags {
            name
            value
          }
`;

export const TRANSACTIONS_BY_IDS_QUERY: TypedDocumentNode<
  TransactionsQueryResult,
  TransactionsByIdsQueryVariables
> = gql`
  query TransactionsByIds($ids: [String!]!) {
    transactions(ids: $ids) {
      edges {
        node {
          ${TRANSACTION_FIELDS}
        }
      }
    }
  }
`;

export const TRANSACTIONS_BY_TAGS_QUERY: TypedDocumentNode<
  TransactionsQueryResult,
  TransactionsByTagsQueryVariables
> = gql`
  query TransactionsByTags($tags: [TagFilter!]!) {
    transactions(tags: $tags) {
      edges {
        node {
          ${TRANSACTION_FIELDS}
        }
      }
    }
  }
`;
