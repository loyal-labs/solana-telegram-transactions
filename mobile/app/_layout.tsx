import "@/global.css";

import { Stack } from "expo-router/stack";

export default function RootLayout() {
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
