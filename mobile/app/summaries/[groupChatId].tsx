import type { ChatSummary } from "@loyal-labs/shared";

import * as Haptics from "expo-haptics";
import { Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator } from "react-native";

import {
  getAvatarColor,
  getFirstLetter,
} from "@/components/summaries/avatar-utils";
import { DatePicker } from "@/components/summaries/DatePicker";
import {
  getAvailableDates,
  getMessageCountForDate,
  getTopicsForDate,
  groupSummariesByDate,
  toDateKey,
} from "@/components/summaries/summary-utils";
import { TopicCard } from "@/components/summaries/TopicCard";
import { fetchSummariesByGroup } from "@/services/api";
import { Pressable, ScrollView, Text, View } from "@/tw";
import { Image } from "@/tw/image";

export default function SummaryFeedScreen() {
  const { groupChatId } = useLocalSearchParams<{ groupChatId: string }>();

  const [summaries, setSummaries] = useState<ChatSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!groupChatId) return;
    let cancelled = false;

    (async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchSummariesByGroup(groupChatId);
        if (!cancelled) setSummaries(data);
      } catch (err) {
        if (!cancelled) setError("Failed to load summaries");
        console.error(err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [groupChatId]);

  const groupTitle = useMemo(
    () => (summaries.length > 0 ? summaries[0].title : "Summary"),
    [summaries],
  );

  const summariesByDate = useMemo(
    () => groupSummariesByDate(summaries),
    [summaries],
  );

  const availableDates = useMemo(
    () => getAvailableDates(summaries),
    [summaries],
  );

  const [selectedDate, setSelectedDate] = useState<string>(() =>
    toDateKey(new Date().toISOString()),
  );

  // Set initial date to most recent with data
  useEffect(() => {
    if (availableDates.length > 0 && !availableDates.includes(selectedDate)) {
      setSelectedDate(availableDates[0]);
    }
  }, [availableDates, selectedDate]);

  const messageCount = useMemo(
    () => getMessageCountForDate(summariesByDate, selectedDate),
    [summariesByDate, selectedDate],
  );

  const topics = useMemo(
    () => getTopicsForDate(summariesByDate, selectedDate),
    [summariesByDate, selectedDate],
  );

  const handleDateSelect = useCallback((date: string) => {
    setSelectedDate(date);
  }, []);

  const handleTodayPress = useCallback(() => {
    if (process.env.EXPO_OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedDate(toDateKey(new Date().toISOString()));
  }, []);

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: "" }} />
        <View className="flex-1 items-center justify-center bg-white">
          <ActivityIndicator />
        </View>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Stack.Screen options={{ title: "Error" }} />
        <View className="flex-1 items-center justify-center bg-white">
          <Text className="text-black/50">{error}</Text>
        </View>
      </>
    );
  }

  // Group avatar
  const groupPhoto = summaries[0]?.photoBase64
    ? {
        base64: summaries[0].photoBase64,
        mimeType: summaries[0].photoMimeType ?? "image/jpeg",
      }
    : null;
  const avatarColor = getAvatarColor(groupTitle);
  const firstLetter = getFirstLetter(groupTitle);

  return (
    <>
      <Stack.Screen options={{ title: groupTitle }} />
      <ScrollView
        className="flex-1 bg-white"
        contentInsetAdjustmentBehavior="automatic"
      >
        {/* Group info header */}
        <View className="px-4 py-2 flex-row items-center gap-3">
          {groupPhoto ? (
            <Image
              source={{
                uri: `data:${groupPhoto.mimeType};base64,${groupPhoto.base64}`,
              }}
              className="w-11 h-11 rounded-full object-cover"
            />
          ) : (
            <View
              className="w-11 h-11 rounded-full items-center justify-center"
              style={{ backgroundColor: avatarColor }}
            >
              <Text className="text-base font-medium text-white">
                {firstLetter}
              </Text>
            </View>
          )}
          <View className="flex-1">
            <Text
              className="text-[17px] font-medium text-black"
              numberOfLines={1}
            >
              {groupTitle}
            </Text>
            <Text className="text-[15px] text-black/60 mt-0.5">
              {messageCount > 0
                ? `Summary of ${messageCount.toLocaleString()} messages`
                : "No messages"}
            </Text>
          </View>
          <Pressable
            className="rounded-full px-4 py-2.5 active:opacity-70"
            style={{ backgroundColor: "rgba(249,54,60,0.14)" }}
            onPress={handleTodayPress}
          >
            <Text className="text-[17px] font-medium text-black">Today</Text>
          </Pressable>
        </View>

        {/* Horizontal date picker with snap scrolling */}
        <DatePicker
          availableDates={availableDates}
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
        />

        {/* Topic cards */}
        <View className="px-4 gap-3 pb-8">
          {topics.length > 0 ? (
            topics.map((topic) => <TopicCard key={topic.id} topic={topic} />)
          ) : (
            <View className="items-center py-16">
              <Text className="text-[15px] text-black/60">
                Summary for today is being created...
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </>
  );
}
