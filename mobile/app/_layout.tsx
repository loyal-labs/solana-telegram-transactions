import "@/global.css";

import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import {
  addNotificationResponseListener,
  registerForPushNotifications,
  registerPushToken,
  setupNotificationHandler,
} from "@/services/notifications";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    Geist_400Regular: require("@expo-google-fonts/geist/400Regular/Geist_400Regular.ttf"),
    Geist_500Medium: require("@expo-google-fonts/geist/500Medium/Geist_500Medium.ttf"),
    Geist_600SemiBold: require("@expo-google-fonts/geist/600SemiBold/Geist_600SemiBold.ttf"),
    Geist_700Bold: require("@expo-google-fonts/geist/700Bold/Geist_700Bold.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // Register for push notifications on boot
  useEffect(() => {
    (async () => {
      await setupNotificationHandler();
      const token = await registerForPushNotifications();
      if (token) {
        await registerPushToken(token);
      }
    })();
  }, []);

  // Handle notification tap while app is running
  useEffect(() => {
    let cleanup: (() => void) | null = null;

    addNotificationResponseListener((data) => {
      if (data?.screen === "summaries") {
        router.push("/");
      }
    }).then((remove) => {
      cleanup = remove;
    });

    return () => cleanup?.();
  }, [router]);

  if (!fontsLoaded) {
    return (
      <GestureHandlerRootView
        style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
      >
        <ActivityIndicator />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
    </GestureHandlerRootView>
  );
}
