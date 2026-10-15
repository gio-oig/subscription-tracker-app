import { Link } from "expo-router";
import { Text, View } from "react-native";

export default function SignIn() {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Text className="text-xl font-bold text-success">Sign In</Text>

      <Link
        href="/(auth)/sign-up"
        className="mt-4 rounded bg-success px-4 py-2"
      >
        Create Account
      </Link>
    </View>
  );
}
