import { Pressable, Text, View } from "@/tw";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { Eye, EyeOff } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const VALID_PASSWORD = "qwerty";
const REVEAL_DURATION = 800;

function maskWithReveal(
  password: string,
  revealIndex: number,
): string {
  if (!password) return "";
  return password
    .split("")
    .map((char, i) => (i === revealIndex ? char : "\u2022"))
    .join("");
}

export default function PasswordScreen() {
  const router = useRouter();
  const { bottom } = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [revealIndex, setRevealIndex] = useState(-1);
  const revealTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    return () => clearTimeout(revealTimerRef.current);
  }, []);

  const handleChangeText = useCallback(
    (text: string) => {
      if (error) setError(false);

      // Detect new character appended
      if (!showPassword && text.length > password.length) {
        const newIndex = text.length - 1;
        setRevealIndex(newIndex);
        clearTimeout(revealTimerRef.current);
        revealTimerRef.current = setTimeout(
          () => setRevealIndex(-1),
          REVEAL_DURATION,
        );
      } else {
        setRevealIndex(-1);
        clearTimeout(revealTimerRef.current);
      }

      setPassword(text);
    },
    [error, password.length, showPassword],
  );

  const handleContinue = useCallback(() => {
    if (!password) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    Keyboard.dismiss();

    if (password === VALID_PASSWORD) {
      router.dismissAll();
      router.replace("/");
    } else {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      setError(true);
    }
  }, [password, router]);

  const handleToggleShow = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowPassword((prev) => !prev);
    setRevealIndex(-1);
    clearTimeout(revealTimerRef.current);
  }, []);

  const hasValue = password.length > 0;
  const EyeIcon = showPassword ? Eye : EyeOff;

  // Display value: show mode = real text, hide mode = masked with brief reveal
  const displayValue = showPassword
    ? password
    : revealIndex >= 0
      ? maskWithReveal(password, revealIndex)
      : "\u2022".repeat(password.length);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <Pressable
        style={styles.content}
        onPress={() => inputRef.current?.focus()}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Enter Password</Text>
          <Text style={styles.subtitle}>
            You have Two-Step Verification enabled, so your Telegram account is
            protected with an additional password
          </Text>
        </View>

        <View style={styles.inputWrapper}>
          <View
            style={[
              styles.inputContainer,
              error && styles.inputContainerError,
            ]}
          >
            {/* Hidden input captures real typing */}
            <TextInput
              ref={inputRef}
              style={styles.hiddenInput}
              value={password}
              onChangeText={handleChangeText}
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
              selectionColor="#000"
            />
            {/* Visible display with custom masking */}
            <Pressable
              style={styles.visibleInput}
              onPress={() => inputRef.current?.focus()}
            >
              {hasValue ? (
                <Text style={styles.inputText}>{displayValue}</Text>
              ) : (
                <Text style={styles.placeholder}>Password</Text>
              )}
            </Pressable>
            <Pressable style={styles.eyeIcon} onPress={handleToggleShow}>
              <EyeIcon
                size={24}
                color="rgba(60,60,67,0.3)"
                strokeWidth={1.5}
              />
            </Pressable>
          </View>
          {error && (
            <View style={styles.hint}>
              <Text style={styles.errorText}>
                Invalid password. Please, try again
              </Text>
            </View>
          )}
        </View>
      </Pressable>

      <View style={styles.buttonBody}>
        <LinearGradient
          colors={["rgba(255,255,255,0)", "#fff"]}
          style={styles.gradient}
        />
        <View style={[styles.buttonWrap, { paddingBottom: bottom + 24 }]}>
          <Pressable
            style={[styles.button, !hasValue && styles.buttonDisabled]}
            onPress={handleContinue}
            disabled={!hasValue}
          >
            <Text style={styles.buttonText}>Continue</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 48,
    gap: 32,
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    gap: 4,
  },
  title: {
    fontFamily: "Geist_600SemiBold",
    fontSize: 22,
    lineHeight: 28,
    color: "#000",
    textAlign: "center",
  },
  subtitle: {
    fontFamily: "Geist_400Regular",
    fontSize: 17,
    lineHeight: 22,
    color: "rgba(60,60,67,0.6)",
    textAlign: "center",
  },
  inputWrapper: {
    width: "100%",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2f2f7",
    borderRadius: 47,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "transparent",
  },
  inputContainerError: {
    borderColor: "#F9363C",
  },
  hiddenInput: {
    position: "absolute",
    opacity: 0,
    width: 1,
    height: 1,
  },
  visibleInput: {
    flex: 1,
    paddingVertical: 15,
    justifyContent: "center",
  },
  inputText: {
    fontFamily: "Geist_400Regular",
    fontSize: 17,
    lineHeight: 22,
    color: "#000",
  },
  placeholder: {
    fontFamily: "Geist_400Regular",
    fontSize: 17,
    lineHeight: 22,
    color: "rgba(60,60,67,0.6)",
  },
  eyeIcon: {
    paddingLeft: 12,
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  hint: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
  },
  errorText: {
    fontFamily: "Geist_400Regular",
    fontSize: 13,
    lineHeight: 16,
    color: "#F9363C",
  },
  buttonBody: {},
  gradient: {
    height: 16,
  },
  buttonWrap: {
    backgroundColor: "#fff",
    paddingHorizontal: 32,
  },
  button: {
    height: 50,
    backgroundColor: "#000",
    borderRadius: 78,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  buttonDisabled: {
    backgroundColor: "#d0d0d2",
  },
  buttonText: {
    fontFamily: "Geist_400Regular",
    fontSize: 17,
    lineHeight: 22,
    color: "#fff",
  },
});
