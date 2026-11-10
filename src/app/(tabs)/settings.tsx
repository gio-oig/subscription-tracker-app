import { useAuth, useUser } from "@clerk/expo";
import clsx from "clsx";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";
import { styled } from "react-native-css";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/constants/theme";
import { posthog, posthogLogger } from "@/lib/posthog";

const SafeAreaView = styled(RNSafeAreaView);

export default function Settings() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      // The root layout's protected routes send the user back to sign-in.
      await signOut();
      posthog?.capture("user_signed_out");
      posthogLogger.info("authentication session ended", {
        auth_flow: "sign_out",
      });
      posthog?.reset();
    } catch {
      setSigningOut(false);
      Alert.alert(
        "Couldn't sign out",
        "Please check your connection and try again.",
      );
    }
  };

  const confirmSignOut = () => {
    Alert.alert(
      "Sign out?",
      "You'll need to sign in again to see your subscriptions.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Sign out", style: "destructive", onPress: handleSignOut },
      ],
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <Text className="list-title">Settings</Text>

      <View className="auth-card gap-1">
        <Text className="auth-label">Signed in as</Text>
        <Text className="auth-helper" numberOfLines={1}>
          {user?.primaryEmailAddress?.emailAddress ?? "—"}
        </Text>
      </View>

      <Pressable
        onPress={confirmSignOut}
        disabled={signingOut}
        accessibilityRole="button"
        className={clsx("sub-cancel mt-6", signingOut && "sub-cancel-disabled")}
      >
        {signingOut ? (
          <ActivityIndicator color={colors.background} />
        ) : (
          <Text className="sub-cancel-text">Sign out</Text>
        )}
      </Pressable>
    </SafeAreaView>
  );
}
