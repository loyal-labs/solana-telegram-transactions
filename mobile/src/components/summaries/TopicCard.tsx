import type { Topic } from "@loyal-labs/shared";

import { Text, View } from "@/tw";

import { SourceAvatars } from "./SourceAvatars";

export function TopicCard({ topic }: { topic: Topic }) {
  return (
    <View
      className="bg-[#F2F2F7] overflow-hidden p-4"
      style={{ borderRadius: 26, borderCurve: "continuous" }}
    >
      <Text className="font-semibold text-black text-xl pb-3" selectable>
        {topic.title}
      </Text>
      <Text className="text-[15px] leading-5 text-black/80" selectable>
        {topic.content}
      </Text>
      <SourceAvatars sources={topic.sources} />
    </View>
  );
}
