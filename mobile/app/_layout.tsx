import "@/global.css";

import { Stack } from "expo-router/stack";
import { useEffect } from "react";

import {
  registerForPushNotifications,
  registerPushToken,
} from "@/services/notifications";

export default function RootLayout() {
  useEffect(() => {
    (async () => {
      const token = await registerForPushNotifications();
      if (token) {
        await registerPushToken(token);
      }
    })();
  }, []);

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
