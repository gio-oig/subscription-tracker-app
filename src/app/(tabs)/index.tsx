import { Link } from "expo-router";
import { styled } from "nativewind";
import { Text } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

export default function Index() {
  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-background">
      <Text className="text-xl font-bold text-success">
        Welcome to Nativewind!
      </Text>

      <Link href="/onboarding" className="mt-4 rounded bg-success px-4 py-2">
        Get Started
      </Link>

      <Link
        href="/(auth)/sign-in"
        className="mt-4 rounded bg-success px-4 py-2"
      >
        Sign In
      </Link>

      <Link
        href="/subscriptions/claude"
        className="mt-4 rounded bg-success px-4 py-2"
      >
        Subscription Details
      </Link>
    </SafeAreaView>
  );
}
