import { Text, View } from "react-native";

export default function AuthMessage({
  message,
  tone = "error",
  children,
}: AuthMessageProps) {
  if (!message && !children) return null;
  const isError = tone === "error";

  return (
    <View
      className={isError ? "auth-banner" : "auth-notice"}
      accessibilityRole={isError ? "alert" : undefined}
      accessibilityLiveRegion="polite"
    >
      <Text className={isError ? "auth-banner-text" : "auth-notice-text"}>
        {children ?? message}
      </Text>
    </View>
  );
}
