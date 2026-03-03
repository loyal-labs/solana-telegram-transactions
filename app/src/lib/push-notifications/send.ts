type ExpoPushMessage = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default" | null;
};

/**
 * Send push notifications via Expo Push API.
 * Docs: https://docs.expo.dev/push-notifications/sending-notifications/
 */
export async function sendExpoPushNotifications(
  messages: ExpoPushMessage[],
): Promise<void> {
  if (messages.length === 0) return;

  // Expo Push API accepts batches of up to 100
  const chunks: ExpoPushMessage[][] = [];
  for (let i = 0; i < messages.length; i += 100) {
    chunks.push(messages.slice(i, i + 100));
  }

  for (const chunk of chunks) {
    try {
      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(chunk),
      });

      if (!response.ok) {
        console.error(
          "[push] Expo Push API error:",
          response.status,
          await response.text(),
        );
      }
    } catch (error) {
      console.error("[push] Failed to send push notifications:", error);
    }
  }
}
