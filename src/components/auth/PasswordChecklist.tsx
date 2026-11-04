import { PASSWORD_RULES } from "@/lib/auth";
import clsx from "clsx";
import { Text, View } from "react-native";

export default function PasswordChecklist({
  password,
}: PasswordChecklistProps) {
  return (
    <View className="auth-rules">
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(password);
        return (
          <View key={rule.id} className="auth-rule-row">
            <View
              className={clsx("auth-rule-dot", met && "auth-rule-dot-met")}
            />
            <Text
              className={clsx("auth-rule-text", met && "auth-rule-text-met")}
              accessibilityLabel={`${rule.label}${met ? ", done" : ""}`}
            >
              {rule.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
