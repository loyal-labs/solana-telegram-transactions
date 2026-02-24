import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useState } from "react";
import { RefreshControl } from "react-native";

import { ChatItem } from "@/components/summaries/ChatItem";
import { ChatListSkeleton } from "@/components/summaries/ChatListSkeleton";
import {
  fetchSummaries,
  transformSummariesToGroups,
  type GroupChat,
} from "@/services/api";
import { Pressable, ScrollView, Text, View } from "@/tw";

export default function SummariesListScreen() {
  const router = useRouter();
  const [groups, setGroups] = useState<GroupChat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSummaries = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setIsLoading(true);
      setError(null);
      const summaries = await fetchSummaries();
      setGroups(transformSummariesToGroups(summaries));
    } catch (err) {
      setError("Failed to load summaries");
      console.error(err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSummaries();
  }, [loadSummaries]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadSummaries(true);
  }, [loadSummaries]);

  const handleGroupPress = useCallback(
    (group: GroupChat) => {
      if (process.env.EXPO_OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      router.push(`/summaries/${group.id}`);
    },
    [router],
  );

  if (isLoading) {
    return (
      <ScrollView
        className="flex-1 bg-white"
        contentInsetAdjustmentBehavior="automatic"
      >
        <ChatListSkeleton count={5} />
      </ScrollView>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-white gap-4">
        <Text className="text-black/50">{error}</Text>
        <Pressable
          className="px-4 py-2 bg-black/5 rounded-lg"
          onPress={() => loadSummaries()}
        >
          <Text className="text-sm text-black">Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (groups.length === 0) {
    return (
      <ScrollView
        className="flex-1 bg-white"
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        <View className="items-center justify-center py-16">
          <Text className="text-black/50">No summaries available</Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
      }
    >
      {groups.map((group) => (
        <ChatItem
          key={group.id}
          title={group.title}
          subtitle={group.subtitle}
          photoBase64={group.photoBase64}
          photoMimeType={group.photoMimeType}
          onPress={() => handleGroupPress(group)}
        />
      ))}
    </ScrollView>
  );
}
