import type { SessionSecrets } from "@sqds/grid";
import type { EmailAuthMode } from "@loyal-labs/grid-core";

export type PendingEmailAuth = {
  authTicketId: string;
  email: string;
  mode: EmailAuthMode;
  provider?: "privy" | "turnkey";
  otpId?: string;
  sessionSecrets: SessionSecrets;
  expiresAt: string;
  createdAt: string;
};

export type CreatePendingEmailAuthInput = Omit<
  PendingEmailAuth,
  "authTicketId" | "createdAt"
>;

export interface PendingAuthStore {
  createPendingAuth(input: CreatePendingEmailAuthInput): Promise<PendingEmailAuth>;
  getPendingAuth(authTicketId: string): Promise<PendingEmailAuth | null>;
  consumePendingAuth(authTicketId: string): Promise<PendingEmailAuth | null>;
  cleanupExpired(now?: number): Promise<void>;
}

class InMemoryPendingAuthStore implements PendingAuthStore {
  private entries = new Map<string, PendingEmailAuth>();

  async createPendingAuth(
    input: CreatePendingEmailAuthInput
  ): Promise<PendingEmailAuth> {
    await this.cleanupExpired();

    const pendingAuth: PendingEmailAuth = {
      ...input,
      authTicketId: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };

    this.entries.set(pendingAuth.authTicketId, pendingAuth);
    return pendingAuth;
  }

  async getPendingAuth(authTicketId: string): Promise<PendingEmailAuth | null> {
    await this.cleanupExpired();
    return this.entries.get(authTicketId) ?? null;
  }

  async consumePendingAuth(
    authTicketId: string
  ): Promise<PendingEmailAuth | null> {
    await this.cleanupExpired();
    const entry = this.entries.get(authTicketId) ?? null;
    if (entry) {
      this.entries.delete(authTicketId);
    }
    return entry;
  }

  async cleanupExpired(now = Date.now()): Promise<void> {
    for (const [authTicketId, entry] of this.entries.entries()) {
      if (new Date(entry.expiresAt).getTime() <= now) {
        this.entries.delete(authTicketId);
      }
    }
  }
}

let pendingAuthStore: PendingAuthStore | null = null;

export function getPendingAuthStore(): PendingAuthStore {
  if (pendingAuthStore) {
    return pendingAuthStore;
  }

  pendingAuthStore = new InMemoryPendingAuthStore();
  return pendingAuthStore;
}

export function resetPendingAuthStoreForTests(): void {
  pendingAuthStore = null;
}
