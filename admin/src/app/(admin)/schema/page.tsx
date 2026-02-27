import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/layout/section-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Column = {
  name: string;
  type: string;
  pk?: boolean;
  nullable?: boolean;
  unique?: boolean;
  default?: string;
  fk?: string;
  note?: string;
};

type TableDefinition = {
  name: string;
  description: string;
  columns: Column[];
  indexes: string[];
};

type RelationDefinition = {
  from: string;
  to: string;
  onDelete: string;
};

const tables: TableDefinition[] = [
  {
    name: "admins",
    description:
      "Global admins whitelist. Must be both here AND a Telegram group admin to activate communities.",
    columns: [
      { name: "id", type: "uuid", pk: true, default: "random" },
      { name: "telegram_id", type: "bigint", nullable: false, unique: true },
      { name: "username", type: "text", nullable: true },
      { name: "display_name", type: "text", nullable: false },
      { name: "added_at", type: "timestamptz", nullable: false, default: "now()" },
      { name: "added_by", type: "text", nullable: true },
      { name: "notes", type: "text", nullable: true },
    ],
    indexes: ["admins_telegram_id_idx (unique) on telegram_id"],
  },
  {
    name: "users",
    description:
      "Telegram users who post messages. Created automatically on first message.",
    columns: [
      { name: "id", type: "uuid", pk: true, default: "random" },
      { name: "telegram_id", type: "bigint", nullable: false, unique: true },
      { name: "username", type: "text", nullable: true },
      { name: "display_name", type: "text", nullable: false },
      { name: "avatar_url", type: "text", nullable: true },
      { name: "settings", type: "jsonb", nullable: false, default: "{}" },
      { name: "created_at", type: "timestamptz", nullable: false, default: "now()" },
      { name: "updated_at", type: "timestamptz", nullable: false, default: "now()" },
    ],
    indexes: ["users_telegram_id_idx (unique) on telegram_id"],
  },
  {
    name: "communities",
    description:
      "Telegram group chats activated for message tracking. Only whitelisted admins can activate.",
    columns: [
      { name: "id", type: "uuid", pk: true, default: "random" },
      { name: "chat_id", type: "bigint", nullable: false, unique: true },
      { name: "chat_title", type: "text", nullable: false },
      { name: "activated_by", type: "bigint", nullable: false },
      { name: "is_active", type: "boolean", nullable: false, default: "true" },
      { name: "settings", type: "jsonb", nullable: false, default: "{}" },
      { name: "activated_at", type: "timestamptz", nullable: false, default: "now()" },
      { name: "updated_at", type: "timestamptz", nullable: false, default: "now()" },
    ],
    indexes: [
      "communities_chat_id_idx (unique) on chat_id",
      "communities_is_active_idx on is_active",
    ],
  },
  {
    name: "community_members",
    description: "Many-to-many: which users belong to which communities.",
    columns: [
      { name: "id", type: "uuid", pk: true, default: "random" },
      { name: "community_id", type: "uuid", nullable: false, fk: "communities.id" },
      { name: "user_id", type: "uuid", nullable: false, fk: "users.id" },
      { name: "joined_at", type: "timestamptz", nullable: false, default: "now()" },
    ],
    indexes: [
      "community_members_unique_idx (unique) on (community_id, user_id)",
      "community_members_user_id_idx on user_id",
    ],
  },
  {
    name: "messages",
    description:
      "Chat messages from tracked communities. High-volume table with composite indexes for date-range queries.",
    columns: [
      { name: "id", type: "uuid", pk: true, default: "random" },
      { name: "community_id", type: "uuid", nullable: false, fk: "communities.id" },
      { name: "user_id", type: "uuid", nullable: false, fk: "users.id" },
      { name: "telegram_message_id", type: "bigint", nullable: false },
      { name: "content", type: "text", nullable: false },
      { name: "created_at", type: "timestamptz", nullable: false, default: "now()" },
    ],
    indexes: [
      "messages_community_created_idx on (community_id, created_at)",
      "messages_community_telegram_id_idx (unique) on (community_id, telegram_message_id)",
      "messages_user_id_idx on user_id",
    ],
  },
  {
    name: "summaries",
    description:
      "Daily AI-generated chat summaries organized by topics. Topics stored as JSONB array.",
    columns: [
      { name: "id", type: "uuid", pk: true, default: "random" },
      { name: "community_id", type: "uuid", nullable: false, fk: "communities.id" },
      { name: "chat_title", type: "text", nullable: false },
      { name: "message_count", type: "integer", nullable: false },
      { name: "from_message_id", type: "bigint", nullable: true },
      { name: "to_message_id", type: "bigint", nullable: true },
      {
        name: "topics",
        type: "jsonb",
        nullable: false,
        note: "Array of { title, content, sources[] }",
      },
      { name: "oneliner", type: "text", nullable: false },
      { name: "created_at", type: "timestamptz", nullable: false, default: "now()" },
    ],
    indexes: ["summaries_community_created_idx on (community_id, created_at)"],
  },
  {
    name: "business_connections",
    description:
      "Telegram Business connections — bot connections to user business accounts. One per user, soft-deleted via is_enabled.",
    columns: [
      { name: "id", type: "uuid", pk: true, default: "random" },
      { name: "user_id", type: "uuid", nullable: false, fk: "users.id" },
      { name: "business_connection_id", type: "text", nullable: false },
      { name: "user_chat_id", type: "bigint", nullable: false },
      { name: "is_enabled", type: "boolean", nullable: false, default: "true" },
      {
        name: "rights",
        type: "jsonb",
        nullable: false,
        default: "{}",
        note: "BusinessBotRights: can_reply, can_read_messages, etc.",
      },
      { name: "connected_at", type: "timestamptz", nullable: false },
      { name: "created_at", type: "timestamptz", nullable: false, default: "now()" },
      { name: "updated_at", type: "timestamptz", nullable: false, default: "now()" },
    ],
    indexes: [
      "business_connections_user_id_idx (unique) on user_id",
      "business_connections_is_enabled_idx on is_enabled",
    ],
  },
  {
    name: "bot_threads",
    description:
      "Bot conversation threads — a session between user and bot. Supports Telegram threaded messages.",
    columns: [
      { name: "id", type: "uuid", pk: true, default: "random" },
      { name: "user_id", type: "uuid", nullable: false, fk: "users.id" },
      { name: "telegram_chat_id", type: "bigint", nullable: false },
      { name: "telegram_thread_id", type: "integer", nullable: true },
      { name: "title", type: "text", nullable: true },
      {
        name: "status",
        type: "text",
        nullable: false,
        default: "'active'",
        note: "active | archived | closed",
      },
      { name: "created_at", type: "timestamptz", nullable: false, default: "now()" },
      { name: "updated_at", type: "timestamptz", nullable: false, default: "now()" },
    ],
    indexes: [
      "bot_threads_user_id_idx on user_id",
      "bot_threads_telegram_unique_idx (unique) on (telegram_chat_id, telegram_thread_id)",
      "bot_threads_status_idx on status",
    ],
  },
  {
    name: "bot_messages",
    description:
      "Individual messages within bot threads. Content is encrypted as JSONB.",
    columns: [
      { name: "id", type: "uuid", pk: true, default: "random" },
      { name: "thread_id", type: "uuid", nullable: false, fk: "bot_threads.id" },
      {
        name: "sender_type",
        type: "text",
        nullable: false,
        note: "user | bot | system",
      },
      {
        name: "encrypted_content",
        type: "jsonb",
        nullable: false,
        note: "EncryptedMessageContent: { type, ciphertext, iv, metadata? }",
      },
      { name: "telegram_message_id", type: "bigint", nullable: true },
      { name: "created_at", type: "timestamptz", nullable: false, default: "now()" },
    ],
    indexes: [
      "bot_messages_thread_created_idx on (thread_id, created_at)",
      "bot_messages_telegram_id_idx on telegram_message_id",
    ],
  },
];

const relations: RelationDefinition[] = [
  { from: "community_members.community_id", to: "communities.id", onDelete: "cascade" },
  { from: "community_members.user_id", to: "users.id", onDelete: "cascade" },
  { from: "messages.community_id", to: "communities.id", onDelete: "cascade" },
  { from: "messages.user_id", to: "users.id", onDelete: "cascade" },
  { from: "summaries.community_id", to: "communities.id", onDelete: "cascade" },
  { from: "business_connections.user_id", to: "users.id", onDelete: "cascade" },
  { from: "bot_threads.user_id", to: "users.id", onDelete: "cascade" },
  { from: "bot_messages.thread_id", to: "bot_threads.id", onDelete: "cascade" },
];

function TableDefinitionLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <a
      href={`#${to}`}
      className="text-xs font-medium text-muted-foreground underline underline-offset-2 hover:text-foreground"
    >
      {children}
    </a>
  );
}

function ConstraintPills({ column }: { column: Column }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {column.pk && <Badge className="rounded-sm">PK</Badge>}
      {column.unique && <Badge variant="secondary">UNIQUE</Badge>}
      {column.nullable === false && !column.pk && <Badge variant="outline">NOT NULL</Badge>}
      {column.fk && <Badge variant="outline">FK</Badge>}
    </div>
  );
}

export default function SchemaPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <SectionHeader
        title="Database Schema"
        breadcrumbs={[{ label: "Schemas" }]}
        subtitle="Full schema reference used by the summaries admin and shared app workflows."
      />

      <div className="space-y-6">
        {tables.map((table) => {
          const incomingRelations = relations.filter(
            (relation) => relation.to.split(".")[0] === table.name
          );
          const outgoingRelations = relations.filter(
            (relation) => relation.from.split(".")[0] === table.name
          );

          return (
            <Card id={table.name} key={table.name}>
              <CardHeader>
                <CardTitle className="font-mono text-2xl">{table.name}</CardTitle>
                <CardDescription>{table.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div>
                  <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Columns
                  </h2>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Column</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Constraints</TableHead>
                        <TableHead>Default</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {table.columns.map((column) => {
                        return (
                          <TableRow key={column.name}>
                            <TableCell className="font-mono text-xs font-semibold text-foreground">
                              {column.name}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              {column.type}
                            </TableCell>
                            <TableCell>
                              <ConstraintPills column={column} />
                            </TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              {column.default ?? "—"}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              <div className="space-y-1">
                                {column.fk ? (
                                  <div>
                                    <span className="mr-1">FK:</span>
                                    <TableDefinitionLink to={column.fk.split(".")[0]}>{column.fk}</TableDefinitionLink>
                                  </div>
                                ) : null}
                                {column.note ? <p>{column.note}</p> : null}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                <div className="rounded-md border border-border p-4">
                  <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Relationships
                  </h2>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    {outgoingRelations.length === 0 && incomingRelations.length === 0 ? (
                      <p className="text-xs">No direct FK relationships for this table.</p>
                    ) : null}
                    {outgoingRelations.map((relation) => (
                      <p key={`${relation.from}-${relation.to}`}>out: {relation.from} → {relation.to}</p>
                    ))}
                    {incomingRelations.map((relation) => (
                      <p key={`${relation.from}-${relation.to}`}>
                        in: {relation.from} references {relation.to}
                      </p>
                    ))}
                  </div>
                </div>

                <div>
                  <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Indexes
                  </h2>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {table.indexes.length === 0 ? (
                      <li className="text-xs">No explicit indexes listed.</li>
                    ) : null}
                    {table.indexes.map((index) => (
                      <li
                        key={index}
                        className="rounded border border-dashed border-border px-3 py-2 text-xs text-foreground"
                      >
                        {index}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </main>
  );
}
