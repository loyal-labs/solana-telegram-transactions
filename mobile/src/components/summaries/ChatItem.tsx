import { Image } from "@/tw/image";
import { Pressable, Text, View } from "@/tw";

import { getAvatarColor, getFirstLetter } from "./avatar-utils";

type ChatItemProps = {
  title: string;
  subtitle?: string;
  photoBase64?: string;
  photoMimeType?: string;
  onPress: () => void;
};

export function ChatItem({
  title,
  subtitle,
  photoBase64,
  photoMimeType,
  onPress,
}: ChatItemProps) {
  const avatarColor = getAvatarColor(title);
  const firstLetter = getFirstLetter(title);

  const photoUri = photoBase64
    ? `data:${photoMimeType ?? "image/jpeg"};base64,${photoBase64}`
    : null;

  return (
    <Pressable
      className="flex-row items-center px-4 py-1.5 active:opacity-80"
      onPress={onPress}
    >
      {/* Avatar */}
      {photoUri ? (
        <Image
          source={{ uri: photoUri }}
          className="w-12 h-12 rounded-full object-cover"
        />
      ) : (
        <View
          className="w-12 h-12 rounded-full items-center justify-center"
          style={{ backgroundColor: avatarColor }}
        >
          <Text className="text-lg font-medium text-white">{firstLetter}</Text>
        </View>
      )}

      {/* Text content */}
      <View className="flex-1 ml-3 py-2.5">
        <Text className="text-base font-medium text-black" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text
            className="text-[13px] text-black/50 mt-0.5"
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}
