import { Tag } from "@irys/upload-core";

export interface IrysTransaction {
  id: string;
  address?: string | null;
  token?: string | null;
  timestamp?: number | null;
  tags?: Tag[] | null;
}

export interface IrysTagFilter {
  name: string;
  values: string[];
}

export interface TransactionsByIdsQueryVariables {
  ids: string[];
}

export interface TransactionsByTagsQueryVariables {
  tags: IrysTagFilter[];
}

export interface TransactionsQueryResult {
  transactions?: {
    edges?: Array<{
      node?: IrysTransaction | null;
    } | null>;
  } | null;
}

export type TransactionsByIdsQueryResult = TransactionsQueryResult;
export type TransactionsByTagsQueryResult = TransactionsQueryResult;
