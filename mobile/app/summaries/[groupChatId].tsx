import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

export default function SummaryFeedScreen() {
  const { groupChatId } = useLocalSearchParams<{ groupChatId: string }>();

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>Summary Feed for {groupChatId} — placeholder</Text>
    </View>
  );
}
