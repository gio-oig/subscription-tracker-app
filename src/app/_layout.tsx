import "@/global.css";
import { ClerkProvider, useAuth, useUser } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { PostHogProvider, usePostHog } from "posthog-react-native";
import { useEffect, useRef } from "react";

import { posthog } from "@/lib/posthog";

SplashScreen.preventAutoHideAsync();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error(
    "Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY. Add it to your .env file.",
  );
}

function PostHogIdentity() {
  const posthog = usePostHog();
  const { isLoaded, user } = useUser();
  const identifiedUserId = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      identifiedUserId.current = undefined;
      return;
    }

    if (identifiedUserId.current === user.id) return;

    const email = user.primaryEmailAddress?.emailAddress;
    posthog.identify(user.id, {
      $set: email ? { email } : {},
    });
    identifiedUserId.current = user.id;
  }, [isLoaded, posthog, user]);

  return null;
}

function RootNavigator({ fontsReady }: { fontsReady: boolean }) {
  const { isLoaded, isSignedIn } = useAuth();
  const ready = fontsReady && isLoaded;

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  // Keep the splash screen up until we know which stack to show,
  // so signed-in users never see a flash of the auth screens.
  if (!ready) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!isSignedIn}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="subscriptions/[id]" />
      </Stack.Protected>

      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>

      <Stack.Screen name="onboarding" />
    </Stack>
  );
}

export default function RootLayout() {
  const [loadedFonts, fontError] = useFonts({
    "PlusJakartaSans-Light": require("../../assets/fonts/PlusJakartaSans-Light.ttf"),
    "PlusJakartaSans-Regular": require("../../assets/fonts/PlusJakartaSans-Regular.ttf"),
    "PlusJakartaSans-Medium": require("../../assets/fonts/PlusJakartaSans-Medium.ttf"),
    "PlusJakartaSans-SemiBold": require("../../assets/fonts/PlusJakartaSans-SemiBold.ttf"),
    "PlusJakartaSans-Bold": require("../../assets/fonts/PlusJakartaSans-Bold.ttf"),
    "PlusJakartaSans-ExtraBold": require("../../assets/fonts/PlusJakartaSans-ExtraBold.ttf"),
  });

  const navigator = <RootNavigator fontsReady={loadedFonts || !!fontError} />;

  return (
    <ClerkProvider publishableKey={publishableKey!} tokenCache={tokenCache}>
      {posthog ? (
        <PostHogProvider client={posthog}>
          <PostHogIdentity />
          {navigator}
        </PostHogProvider>
      ) : (
        navigator
      )}
    </ClerkProvider>
  );
}
