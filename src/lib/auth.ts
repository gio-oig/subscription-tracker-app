import { isClerkAPIResponseError, isClerkRuntimeError } from "@clerk/expo";
import { router } from "expo-router";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const CODE_PATTERN = /^\d{6}$/;
const GENERIC_ERROR = "Something went wrong on our end. Please try again.";

export const PASSWORD_RULES = [
  {
    id: "length",
    label: "At least 8 characters",
    test: (v: string) => v.length >= 8,
  },
  {
    id: "letter",
    label: "Contains a letter",
    test: (v: string) => /[A-Za-z]/.test(v),
  },
  {
    id: "number",
    label: "Contains a number",
    test: (v: string) => /\d/.test(v),
  },
] as const;

export const normalizeEmail = (value: string) => value.trim().toLowerCase();

export const validateEmail = (value: string): string | undefined => {
  if (!value.trim()) return "Enter your email address.";
  if (!EMAIL_PATTERN.test(value.trim()))
    return "That email doesn't look quite right.";
};

export const validateNewPassword = (value: string): string | undefined => {
  console.log(value);

  if (!value) return "Create a password.";
  if (!PASSWORD_RULES.every((rule) => rule.test(value))) {
    return "Your password needs to meet all the requirements below.";
  }
};

export const validateCode = (value: string): string | undefined => {
  if (!CODE_PATTERN.test(value)) return "Enter the 6-digit code.";
};

export const hasErrors = (errors: AuthFieldErrors) =>
  Object.values(errors).some(Boolean);

// Keep only digits so pasted codes like "123 456" still work.
export const sanitizeCode = (value: string) =>
  value.replace(/\D/g, "").slice(0, 6);

export const maskEmail = (value: string) => {
  const [name, domain] = normalizeEmail(value).split("@");
  if (!name || !domain) return value;
  return `${name.slice(0, 2)}${"•".repeat(Math.max(name.length - 2, 1))}@${domain}`;
};

// Replace server copy with friendlier, brand-voiced messages where we know the code.
const FRIENDLY_MESSAGES: Record<string, string> = {
  form_identifier_not_found: "We couldn't find an account with that email.",
  form_password_incorrect: "That password isn't right. Try again or reset it.",
  form_identifier_exists:
    "An account with this email already exists. Sign in instead.",
  form_password_pwned:
    "This password has appeared in a data breach. Please choose a different one.",
  form_password_length_too_short:
    "Your password must be at least 8 characters.",
  form_password_validation_failed:
    "That password isn't right. Try again or reset it.",
  form_code_incorrect: "That code isn't right. Check your email and try again.",
  verification_expired: "This code has expired. Request a new one below.",
  verification_failed: "Too many incorrect attempts. Request a new code.",
  too_many_requests: "Too many attempts. Please wait a moment and try again.",
  user_locked:
    "Your account is temporarily locked after too many attempts. Try again later.",
  session_exists: "You're already signed in.",
  strategy_for_user_invalid:
    "This account doesn't use a password. Try another sign-in method.",
};

const PARAM_TO_FIELD: Record<string, AuthFieldName> = {
  email_address: "email",
  identifier: "email",
  password: "password",
  new_password: "password",
  code: "code",
};

export function parseAuthError(error: unknown): ParsedAuthError {
  if (isClerkAPIResponseError(error)) {
    const parsed: ParsedAuthError = { fields: {}, codes: [] };

    for (const item of error.errors) {
      // in parseAuthError, inside the loop
      if (__DEV__) console.log(item.code, item.longMessage, item.meta);

      parsed.codes.push(item.code);
      const text =
        FRIENDLY_MESSAGES[item.code] ?? item.longMessage ?? item.message;
      const field = item.meta?.paramName
        ? PARAM_TO_FIELD[item.meta.paramName]
        : undefined;

      if (field && !parsed.fields[field]) parsed.fields[field] = text;
      else parsed.message ??= text;
    }

    return parsed;
  }

  if (isClerkRuntimeError(error) && error.code === "network_error") {
    return {
      fields: {},
      codes: [error.code],
      message: "You appear to be offline. Check your connection and try again.",
    };
  }

  if (__DEV__) console.warn("[auth]", error);
  return { fields: {}, codes: [], message: GENERIC_ERROR };
}

// Passed to `finalize()` once a session is created. The root layout's
// protected routes also react to the new session, so this is a fast path.
export const navigateToApp = () => {
  router.replace("/");
};
