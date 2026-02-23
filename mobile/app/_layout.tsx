import "@/global.css";

import * as Notifications from "expo-notifications";
import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";

import {
  registerForPushNotifications,
  registerPushToken,
} from "@/services/notifications";

export default function RootLayout() {
  const router = useRouter();

  // Register for push notifications on boot
  useEffect(() => {
    (async () => {
      const token = await registerForPushNotifications();
      if (token) {
        await registerPushToken(token);
      }
    })();
  }, []);

  // Handle notification tap while app is running
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        if (data?.screen === "summaries") {
          router.push("/");
        }
      },
    );

    return () => subscription.remove();
  }, [router]);

  return (
    <Stack
      screenOptions={{
        headerBackButtonDisplayMode: "minimal",
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: "Chat Highlights", headerLargeTitle: true }}
      />
      <Stack.Screen name="summaries/[groupChatId]" />
    </Stack>
  );
}
