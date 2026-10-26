import { formatCurrency } from "@/lib/utils";
import { Image, Text, View } from "react-native";

export default function UpcomingSubscriptionCard({
  data: { name, daysLeft, icon, price, currency },
}: {
  data: UpcomingSubscription;
}) {
  return (
    <View className="upcoming-card">
      <View className="upcoming-row">
        <Image source={icon} className="upcoming-icon" />
        <View>
          <Text className="upcoming-price">
            {formatCurrency(price, currency)}
          </Text>
          <Text className="upcoming-meta">
            {daysLeft > 1 ? `${daysLeft} days left` : `last day`}
          </Text>
        </View>
      </View>
      <Text className="upcoming-name" numberOfLines={1}>
        {name}
      </Text>
    </View>
  );
}
