import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import {
  Bell,
  ChevronRight,
  CircleHelp,
  Globe,
} from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import { StyleSheet, Switch } from "react-native";

import { LogoHeader } from "@/components/LogoHeader";
import { Pressable, ScrollView, Text, View } from "@/tw";
import { Image } from "@/tw/image";

const SUPPORT_URL = "https://t.me/spacesymmetry";

const AVATARS = [
  require("../../assets/images/avatars/avatar-01.png"),
  require("../../assets/images/avatars/avatar-02.png"),
  require("../../assets/images/avatars/avatar-03.png"),
  require("../../assets/images/avatars/avatar-04.png"),
  require("../../assets/images/avatars/Avatar-05.png"),
];

const TAB_BAR_HEIGHT = 90;

function SettingsSection({ children }: { children: React.ReactNode }) {
  return <View style={styles.section}>{children}</View>;
}

type CellProps = {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  rightDetail?: string;
  showChevron?: boolean;
  toggle?: {
    value: boolean;
    onValueChange: (v: boolean) => void;
  };
  onPress?: () => void;
  disabled?: boolean;
};

function ProfileCell({
  icon,
  title,
  subtitle,
  rightDetail,
  showChevron,
  toggle,
  onPress,
  disabled,
}: CellProps) {
  const content = (
    <View style={[styles.cell, disabled && styles.cellDisabled]}>
      <View style={styles.cellLeft}>
        <View style={styles.cellIconWrap}>{icon}</View>
      </View>

      <View style={[styles.cellMiddle, subtitle ? styles.cellMiddleCompact : undefined]}>
        <Text style={styles.cellTitle}>{title}</Text>
        {subtitle && <Text style={styles.cellSubtitle}>{subtitle}</Text>}
      </View>

      {rightDetail != null && (
        <View style={styles.cellRight}>
          <Text style={styles.cellDetail}>{rightDetail}</Text>
        </View>
      )}

      {toggle && (
        <View style={styles.cellRight}>
          <Switch
            value={toggle.value}
            onValueChange={toggle.onValueChange}
            trackColor={{ false: "rgba(120,120,128,0.16)", true: "#f9363c" }}
            thumbColor="#fff"
            disabled={disabled}
          />
        </View>
      )}

      {showChevron && (
        <View style={styles.cellChevron}>
          <ChevronRight size={16} color="rgba(60,60,67,0.3)" strokeWidth={2} />
        </View>
      )}
    </View>
  );

  if (onPress && !disabled) {
    return (
      <Pressable onPress={onPress} style={styles.cellPressable}>
        {content}
      </Pressable>
    );
  }

  return content;
}

export default function ProfileScreen() {
  const [pushNotifications, setPushNotifications] = useState(true);

  const avatarSource = useMemo(
    () => AVATARS[Math.floor(Math.random() * AVATARS.length)],
    [],
  );

  const handleSupport = useCallback(() => {
    if (process.env.EXPO_OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Linking.openURL(SUPPORT_URL);
  }, []);

  const handleNotificationToggle = useCallback((value: boolean) => {
    if (process.env.EXPO_OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setPushNotifications(value);
  }, []);

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT }}
    >
      <LogoHeader />

      {/* Avatar + Name */}
      <View style={styles.header}>
        <View style={styles.avatarWrap}>
          <Image source={avatarSource} style={styles.avatar} transition={150} />
        </View>
        <View style={styles.nameContainer}>
          <Text style={styles.name}>Test User</Text>
        </View>
      </View>

      {/* Settings */}
      <View style={styles.container}>
        {/* Language + Push Notifications */}
        <SettingsSection>
          <ProfileCell
            icon={<Globe size={28} strokeWidth={1.5} color="rgba(0,0,0,0.6)" />}
            title="Language"
            rightDetail="English"
            disabled
          />
          <ProfileCell
            icon={<Bell size={28} strokeWidth={1.5} color="rgba(0,0,0,0.6)" />}
            title="Push Notifications"
            toggle={{
              value: pushNotifications,
              onValueChange: handleNotificationToggle,
            }}
          />
        </SettingsSection>

        {/* Support */}
        <SettingsSection>
          <ProfileCell
            icon={<CircleHelp size={28} strokeWidth={1.5} color="rgba(0,0,0,0.6)" />}
            title="Support"
            subtitle="Report a bug or ask any question"
            showChevron
            onPress={handleSupport}
          />
        </SettingsSection>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 32,
    gap: 16,
  },
  avatarWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#e5e5ea",
    overflow: "hidden",
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  nameContainer: {
    alignItems: "center",
    gap: 4,
  },
  name: {
    fontFamily: "Geist_600SemiBold",
    fontSize: 24,
    lineHeight: 28,
    color: "#000",
    textAlign: "center",
  },
  container: {
    paddingHorizontal: 16,
    gap: 16,
  },
  section: {
    backgroundColor: "#f2f2f7",
    borderRadius: 20,
    paddingVertical: 4,
  },
  cell: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    overflow: "hidden",
  },
  cellDisabled: {
    opacity: 0.5,
  },
  cellPressable: {
    // Pressable wraps cell for tap feedback
  },
  cellLeft: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 12,
    paddingVertical: 6,
  },
  cellIconWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingRight: 4,
    paddingVertical: 10,
  },
  cellMiddle: {
    flex: 1,
    paddingVertical: 13,
  },
  cellMiddleCompact: {
    paddingVertical: 9,
  },
  cellTitle: {
    fontFamily: "Geist_500Medium",
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.187,
    color: "#000",
  },
  cellSubtitle: {
    fontFamily: "Geist_400Regular",
    fontSize: 15,
    lineHeight: 20,
    color: "rgba(60,60,67,0.6)",
  },
  cellRight: {
    paddingLeft: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  cellDetail: {
    fontFamily: "Geist_400Regular",
    fontSize: 17,
    lineHeight: 22,
    color: "rgba(60,60,67,0.6)",
    textAlign: "right",
  },
  cellChevron: {
    paddingLeft: 12,
    justifyContent: "center",
    alignItems: "center",
    height: 40,
    paddingVertical: 8,
  },
});
