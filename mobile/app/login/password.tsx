import { Pressable, Text, View } from "@/tw";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Eye, EyeOff } from "lucide-react-native";
import { useCallback, useRef, useState } from "react";
import { Keyboard, StyleSheet, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const VALID_PASSWORD = "qwerty";

export default function PasswordScreen() {
  const router = useRouter();
  const { bottom } = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);

  const handleChangeText = useCallback(
    (text: string) => {
      if (error) setError(false);
      setPassword(text);
    },
    [error],
  );

  const handleContinue = useCallback(() => {
    if (!password) return;
    Keyboard.dismiss();

    if (password === VALID_PASSWORD) {
      router.dismissAll();
      router.replace("/");
    } else {
      setError(true);
    }
  }, [password, router]);

  const hasValue = password.length > 0;
  const EyeIcon = showPassword ? Eye : EyeOff;

  return (
    <View className="flex-1 bg-white">
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
            style={[styles.inputContainer, error && styles.inputContainerError]}
          >
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={password}
              onChangeText={handleChangeText}
              placeholder="Password"
              placeholderTextColor="rgba(60,60,67,0.6)"
              secureTextEntry={!showPassword}
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
              selectionColor="#000"
            />
            <Pressable
              style={styles.eyeIcon}
              onPress={() => setShowPassword((prev) => !prev)}
            >
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
        <View
          style={[styles.buttonWrap, { paddingBottom: Math.max(bottom, 24) }]}
        >
          <Pressable
            style={[styles.button, !hasValue && styles.buttonDisabled]}
            onPress={handleContinue}
            disabled={!hasValue}
          >
            <Text style={styles.buttonText}>Continue</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  input: {
    flex: 1,
    fontFamily: "Geist_400Regular",
    fontSize: 17,
    lineHeight: 22,
    color: "#000",
    paddingVertical: 15,
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
  buttonBody: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
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
