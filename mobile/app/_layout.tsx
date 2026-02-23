import { Stack } from "expo-router/stack";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerBackButtonDisplayMode: "minimal",
      }}
    >
      <Stack.Screen name="index" options={{ title: "Chat Highlights" }} />
      <Stack.Screen
        name="summaries/[groupChatId]"
        options={{ title: "Summary" }}
      />
    </Stack>
  );
}
