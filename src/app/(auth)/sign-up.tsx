import { Link } from "expo-router";
import { Text, View } from "react-native";

export default function SignUp() {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Text className="text-xl font-bold text-success">Sign Up</Text>

      <Link
        href="/(auth)/sign-in"
        className="mt-4 rounded bg-success px-4 py-2"
      >
        Already have an account?
      </Link>
    </View>
  );
}
