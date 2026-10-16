import { Text } from "react-native";
import { styled } from "react-native-css";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

export default function Subscriptions() {
  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <Text className="text-xl font-bold text-success">Subscriptions</Text>
    </SafeAreaView>
  );
}
