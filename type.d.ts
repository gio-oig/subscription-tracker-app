import type { ReactNode, Ref } from "react";
import type {
  ImageSourcePropType,
  TextInput,
  TextInputProps,
} from "react-native";

declare global {
  type AuthFieldName = "email" | "password" | "code";

  type AuthFieldErrors = Partial<Record<AuthFieldName, string>>;

  interface ParsedAuthError {
    fields: AuthFieldErrors;
    codes: string[];
    message?: string;
  }

  interface AuthScreenProps {
    title: string;
    subtitle: string;
    children: ReactNode;
    footer?: ReactNode;
    onBack?: () => void;
  }

  interface AuthFieldProps extends TextInputProps {
    label: string;
    error?: string;
    hint?: string;
    secure?: boolean;
    inputClassName?: string;
    ref?: Ref<TextInput>;
  }

  interface AuthButtonProps {
    label: string;
    onPress: () => void;
    loading?: boolean;
    disabled?: boolean;
    variant?: "primary" | "secondary";
  }

  interface AuthMessageProps {
    message?: string;
    tone?: "error" | "info";
    children?: ReactNode;
  }

  interface PasswordChecklistProps {
    password: string;
  }

  interface ResendCodeProps {
    remaining: number;
    disabled?: boolean;
    onResend: () => void;
  }

  interface AppTab {
    name: string;
    title: string;
    icon: ImageSourcePropType;
  }

  interface TabIconProps {
    focused: boolean;
    icon: ImageSourcePropType;
  }

  interface Subscription {
    id: string;
    icon: ImageSourcePropType;
    name: string;
    plan?: string;
    category?: string;
    paymentMethod?: string;
    status?: string;
    startDate?: string;
    price: number;
    currency?: string;
    billing: string;
    renewalDate?: string;
    color?: string;
  }

  interface SubscriptionCardProps extends Omit<Subscription, "id"> {
    expanded: boolean;
    onPress: () => void;
    onCancelPress?: () => void;
    isCancelling?: boolean;
  }

  interface UpcomingSubscription {
    id: string;
    icon: ImageSourcePropType;
    name: string;
    price: number;
    currency?: string;
    daysLeft: number;
  }

  interface UpcomingSubscriptionCardProps extends Omit<
    UpcomingSubscription,
    "id"
  > {}

  interface ListHeadingProps {
    title: string;
  }
}

export {};
