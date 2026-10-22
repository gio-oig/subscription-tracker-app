import { Link } from "expo-router";
import { styled } from "nativewind";
import { Text } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

export default function Index() {
  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-background">
      <Text className="font-jakarta-extrabold text-5xl text-success">Home</Text>

      <Link
        href="/onboarding"
        className="mt-4 rounded bg-success px-4 py-2 font-jakarta-bold"
      >
        Get Started
      </Link>

      <Link
        href="/(auth)/sign-in"
        className="mt-4 rounded bg-success px-4 py-2 font-jakarta-bold"
      >
        Sign In
      </Link>
    </SafeAreaView>
  );
}
