export const PUBLIC_KEY_STORAGE_KEY = "solana_public_key";
export const SECRET_KEY_STORAGE_KEY = "solana_secret_key";

export const TELEGRAM_BOT_ID = process.env.NEXT_PUBLIC_TELEGRAM_BOT_ID || "";

export const TELEGRAM_PUBLIC_KEY_PROD =
  "e7bf03a2fa4602af4580703d88dda5bb59f32ed8b02a56c187fe7d34caed242d";
export const TELEGRAM_PUBLIC_KEY_PROD_BYTES = Buffer.from(
  TELEGRAM_PUBLIC_KEY_PROD,
  "hex"
);
export const TELEGRAM_PUBLIC_KEY_PROD_UINT8ARRAY = new Uint8Array(
  TELEGRAM_PUBLIC_KEY_PROD_BYTES
);

export const TELEGRAM_PUBLIC_KEYS = [
  // Test environment key
  "40055058a4ee38156a06562e52eece92a771bcd8346a8c4615cb7376eddf72ec",
  // Production key
  TELEGRAM_PUBLIC_KEY_PROD,
];

export const DEPOSIT_SEED = "deposit";
export const DEPOSIT_SEED_BYTES = Buffer.from(DEPOSIT_SEED);

export const VAULT_SEED = "vault";
export const VAULT_SEED_BYTES = Buffer.from(VAULT_SEED);

export const SESSION_SEED = "tg_session";
export const SESSION_SEED_BYTES = Buffer.from(SESSION_SEED);

// SOL price for USD conversions (hardcoded for now)
export const SOL_PRICE_USD = 180;

// Solana network fee
export const SOLANA_FEE_SOL = 0.000005;

export const LAST_AMOUNT_KEY = "lastSendAmount";
export const RECENT_RECIPIENTS_KEY = "recentRecipients";
export const MAX_RECENT_RECIPIENTS = 10;
export const DISPLAY_CURRENCY_KEY = "displayCurrency";
export const BALANCE_BG_KEY = "balanceBg";
