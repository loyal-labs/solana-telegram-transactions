// API base URL — points to the deployed Next.js app
// In development, use your local network IP or tunnel URL
// In production, use the deployed Vercel URL
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://your-app.vercel.app";

// Hardcoded identity for MVP (auth deferred)
const TELEGRAM_USER_ID = "2131567542";

export const env = {
  apiBaseUrl: API_BASE_URL,
  telegramUserId: TELEGRAM_USER_ID,
} as const;
