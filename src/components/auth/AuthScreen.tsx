import { BRAND } from "@/constants/data";
import { icons } from "@/constants/icons";
import { styled } from "nativewind";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

export default function AuthScreen({
  title,
  subtitle,
  children,
  footer,
  onBack,
}: AuthScreenProps) {
  return (
    <SafeAreaView className="auth-safe-area">
      <KeyboardAvoidingView
        className="auth-screen"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          className="auth-scroll"
          contentContainerClassName="auth-content"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {onBack && (
            <Pressable
              onPress={onBack}
              className="auth-back"
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Image source={icons.back} className="auth-back-icon" />
            </Pressable>
          )}

          <View className="auth-brand-block">
            <View className="auth-logo-wrap">
              <Image source={icons.logo} className="auth-logo-image" />
              <View>
                <Text className="auth-wordmark">{BRAND.name}</Text>
                <Text className="auth-wordmark-sub">{BRAND.tagline}</Text>
              </View>
            </View>

            <Text className="auth-title" accessibilityRole="header">
              {title}
            </Text>
            <Text className="auth-subtitle">{subtitle}</Text>
          </View>

          <View className="auth-card">{children}</View>

          {footer}

          <Text className="auth-trust">
            Your session is encrypted and stored securely on this device.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
