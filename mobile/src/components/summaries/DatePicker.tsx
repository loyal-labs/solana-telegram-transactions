import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { FlatList, useWindowDimensions } from "react-native";

import { Pressable, Text, View } from "@/tw";

type DatePickerProps = {
  availableDates: string[];
  selectedDate: string;
  onDateSelect: (date: string) => void;
};

const ITEM_WIDTH = 56;

function getDayNumber(dateStr: string): number {
  return new Date(dateStr + "T12:00:00").getDate();
}

function generateDateRange(pastDays = 30, futureDays = 7): string[] {
  const dates: string[] = [];
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  for (let i = pastDays - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split("T")[0]);
  }
  for (let i = 1; i <= futureDays; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}

function isFutureDate(dateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dateStr + "T00:00:00") > today;
}

export function DatePicker({
  availableDates,
  selectedDate,
  onDateSelect,
}: DatePickerProps) {
  const { width: screenWidth } = useWindowDimensions();
  const flatListRef = useRef<FlatList>(null);
  const availableDateSet = useMemo(
    () => new Set(availableDates),
    [availableDates],
  );
  const todayKey = useMemo(() => new Date().toISOString().split("T")[0], []);

  const dates = useMemo(() => generateDateRange(), []);

  // Scroll to selected date
  useEffect(() => {
    const index = dates.indexOf(selectedDate);
    if (index !== -1) {
      flatListRef.current?.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0.5,
      });
    }
  }, [selectedDate, dates]);

  const handleDatePress = useCallback(
    (date: string) => {
      const hasData = availableDateSet.has(date);
      const isToday = date === todayKey;
      const isFuture = isFutureDate(date);

      if (isFuture || (!hasData && !isToday)) {
        if (process.env.EXPO_OS === "ios") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        return;
      }

      if (date === selectedDate) return;

      if (process.env.EXPO_OS === "ios") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onDateSelect(date);
    },
    [availableDateSet, selectedDate, onDateSelect, todayKey],
  );

  const renderItem = useCallback(
    ({ item: date }: { item: string }) => {
      const isSelected = date === selectedDate;
      const hasData = availableDateSet.has(date);
      const isFuture = isFutureDate(date);
      const isToday = date === todayKey;
      const isSelectable = !isFuture && (hasData || isToday);

      return (
        <Pressable
          className="items-center justify-center"
          style={{ width: ITEM_WIDTH, height: 40 }}
          onPress={() => handleDatePress(date)}
        >
          <View
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{
              backgroundColor: isSelected
                ? "rgba(249,54,60,0.14)"
                : "transparent",
            }}
          >
            <Text
              className="text-[17px] font-medium text-center"
              style={{
                color: isSelected
                  ? "#000"
                  : isSelectable
                    ? "rgba(60,60,67,0.6)"
                    : "rgba(60,60,67,0.3)",
              }}
            >
              {getDayNumber(date)}
            </Text>
          </View>

          {/* Red dot for dates with data */}
          {hasData && !isFuture && (
            <View
              className="absolute top-0 items-center justify-center"
              style={{ width: 16, height: 16 }}
            >
              <View className="w-1 h-1 rounded-full bg-[#f9363c]" />
            </View>
          )}
        </Pressable>
      );
    },
    [selectedDate, availableDateSet, todayKey, handleDatePress],
  );

  const sideInset = (screenWidth - ITEM_WIDTH) / 2;

  return (
    <View className="py-2">
      <FlatList
        ref={flatListRef}
        data={dates}
        renderItem={renderItem}
        keyExtractor={(item) => item}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={ITEM_WIDTH}
        decelerationRate="fast"
        contentContainerStyle={{
          paddingHorizontal: sideInset,
        }}
        getItemLayout={(_, index) => ({
          length: ITEM_WIDTH,
          offset: ITEM_WIDTH * index,
          index,
        })}
        onScrollToIndexFailed={() => {
          // Silently ignore -- happens when list isn't laid out yet
        }}
      />
    </View>
  );
}
