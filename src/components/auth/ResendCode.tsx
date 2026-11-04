import { Pressable, Text, View } from "react-native";

export default function ResendCode({
  remaining,
  disabled,
  onResend,
}: ResendCodeProps) {
  return (
    <View className="auth-resend-row">
      <Text className="auth-link-copy">Didn&apos;t get it?</Text>
      {remaining > 0 ? (
        <Text className="auth-link-copy">Resend in {remaining}s</Text>
      ) : (
        <Pressable
          onPress={onResend}
          disabled={disabled}
          hitSlop={8}
          accessibilityRole="button"
        >
          <Text className="auth-link">Resend code</Text>
        </Pressable>
      )}
    </View>
  );
}
