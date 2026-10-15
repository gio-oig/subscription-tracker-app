import { Link, useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

export default function Subscription() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <View>
      <Text className="text-xl font-bold text-success">
        Subscription details {id}
      </Text>
      <Link href="/">Back to Subscriptions</Link>
    </View>
  );
}
