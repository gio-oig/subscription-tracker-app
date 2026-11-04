import { colors } from "@/constants/theme";
import clsx from "clsx";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

export default function AuthField({
  label,
  error,
  hint,
  secure,
  inputClassName,
  onFocus,
  onBlur,
  ...inputProps
}: AuthFieldProps) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);

  return (
    <View className="auth-field">
      <Text className="auth-label">{label}</Text>

      <View
        className={clsx(
          "auth-input-wrap",
          focused && "auth-input-focused",
          error && "auth-input-error",
        )}
      >
        <TextInput
          {...inputProps}
          className={clsx("auth-input-text", inputClassName)}
          placeholderTextColor={colors.mutedForeground}
          selectionColor={colors.accent}
          secureTextEntry={secure && hidden}
          accessibilityLabel={label}
          aria-invalid={!!error}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
        />

        {secure && (
          <Pressable
            onPress={() => setHidden((value) => !value)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={hidden ? "Show password" : "Hide password"}
          >
            <Text className="auth-input-toggle">
              {hidden ? "Show" : "Hide"}
            </Text>
          </Pressable>
        )}
      </View>

      {error ? (
        <Text className="auth-error" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint ? (
        <Text className="auth-helper">{hint}</Text>
      ) : null}
    </View>
  );
}
