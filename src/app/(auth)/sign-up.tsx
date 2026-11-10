import AuthButton from "@/components/auth/AuthButton";
import AuthField from "@/components/auth/AuthField";
import AuthMessage from "@/components/auth/AuthMessage";
import AuthScreen from "@/components/auth/AuthScreen";
import PasswordChecklist from "@/components/auth/PasswordChecklist";
import ResendCode from "@/components/auth/ResendCode";
import useResendCooldown from "@/hooks/useResendCooldown";
import {
  hasErrors,
  maskEmail,
  navigateToApp,
  normalizeEmail,
  parseAuthError,
  sanitizeCode,
  validateCode,
  validateEmail,
  validateNewPassword,
} from "@/lib/auth";
import { posthog, posthogLogger } from "@/lib/posthog";
import { useSignUp } from "@clerk/expo";
import { Link, router } from "expo-router";
import { useRef, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

type Step = "details" | "verify";

export default function SignUp() {
  const { signUp } = useSignUp();
  const cooldown = useResendCooldown();
  const passwordRef = useRef<TextInput>(null);

  const [step, setStep] = useState<Step>("details");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});
  const [formError, setFormError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [emailTaken, setEmailTaken] = useState(false);

  const applyError = (error: unknown) => {
    const parsed = parseAuthError(error);
    setFieldErrors(parsed.fields);
    setFormError(parsed.message);
  };

  const clearError = (field: AuthFieldName) => {
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setFormError(undefined);
  };

  const run = async (task: () => Promise<void>) => {
    if (submitting) return;
    setSubmitting(true);
    setFormError(undefined);
    try {
      await task();
    } catch (error) {
      applyError(error);
    } finally {
      setSubmitting(false);
    }
  };

  const finalize = async () => {
    const { error } = await signUp.finalize({ navigate: navigateToApp });
    if (error) return applyError(error);
    posthog?.capture("account_created");
    posthogLogger.info("account creation completed", {
      auth_flow: "sign_up",
    });
  };

  const sendCode = async () => {
    const { error } = await signUp.verifications.sendEmailCode();
    if (error) {
      applyError(error);
      return false;
    }
    cooldown.start();
    return true;
  };

  const handleSignUp = () => {
    const errors: AuthFieldErrors = {
      email: validateEmail(email),
      password: validateNewPassword(password),
    };
    if (hasErrors(errors)) return setFieldErrors(errors);

    run(async () => {
      setEmailTaken(false);
      const { error } = await signUp.password({
        emailAddress: normalizeEmail(email),
        password,
      });
      if (error) {
        applyError(error);
        setEmailTaken(
          parseAuthError(error).codes.includes("form_identifier_exists"),
        );
        return;
      }

      // Email verification may be turned off for the instance.
      if (signUp.status === "complete") return finalize();

      if (signUp.unverifiedFields.includes("email_address")) {
        if (!(await sendCode())) return;
        setCode("");
        setFieldErrors({});
        setStep("verify");
        return;
      }

      setFormError(
        "We need a bit more information to create your account. Please contact support.",
      );
    });
  };

  const handleVerify = () => {
    const codeError = validateCode(code);
    if (codeError) return setFieldErrors({ code: codeError });

    run(async () => {
      const { error } = await signUp.verifications.verifyEmailCode({ code });
      if (error) return applyError(error);

      if (signUp.status === "complete") return finalize();
      setFormError(
        "We couldn't finish creating your account. Please try again.",
      );
    });
  };

  const handleResend = () => {
    run(async () => {
      await sendCode();
    });
  };

  const backToDetails = () => {
    setStep("details");
    setCode("");
    setFieldErrors({});
    setFormError(undefined);
  };

  if (step === "verify") {
    return (
      <AuthScreen
        title="Check your inbox"
        subtitle="Enter the 6-digit code we sent to confirm your email address."
        onBack={backToDetails}
      >
        <View className="auth-form">
          <AuthMessage tone="info">
            Code sent to{" "}
            <Text className="auth-notice-strong">{maskEmail(email)}</Text>
          </AuthMessage>
          <AuthMessage message={formError} />

          <AuthField
            label="Verification code"
            value={code}
            onChangeText={(value) => {
              setCode(sanitizeCode(value));
              clearError("code");
            }}
            error={fieldErrors.code}
            placeholder="000000"
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="one-time-code"
            maxLength={6}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleVerify}
            inputClassName="auth-code-input"
          />

          <AuthButton
            label="Verify email"
            onPress={handleVerify}
            loading={submitting}
            disabled={code.length < 6}
          />

          <ResendCode
            remaining={cooldown.remaining}
            disabled={submitting}
            onResend={handleResend}
          />

          <Pressable
            onPress={backToDetails}
            hitSlop={8}
            accessibilityRole="button"
            className="items-center"
          >
            <Text className="auth-link">Use a different email</Text>
          </Pressable>
        </View>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      title="Take control of renewals"
      subtitle="Create your free account and never get surprised by a charge again."
      footer={
        <View className="auth-link-row">
          <Text className="auth-link-copy">Already have an account?</Text>
          <Link href="/(auth)/sign-in" replace asChild>
            <Pressable hitSlop={8} accessibilityRole="link">
              <Text className="auth-link">Sign in</Text>
            </Pressable>
          </Link>
        </View>
      }
    >
      <View className="auth-form">
        <AuthMessage message={formError} />

        <AuthField
          label="Email"
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            setEmailTaken(false);
            clearError("email");
          }}
          error={fieldErrors.email}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="emailAddress"
          autoComplete="email"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => passwordRef.current?.focus()}
        />

        {emailTaken && (
          <AuthButton
            label="Sign in with this email"
            variant="secondary"
            onPress={() =>
              router.replace({
                pathname: "/(auth)/sign-in",
                params: { email: normalizeEmail(email) },
              })
            }
          />
        )}

        <AuthField
          ref={passwordRef}
          label="Password"
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            clearError("password");
          }}
          error={fieldErrors.password}
          placeholder="Create a password"
          secure
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="newPassword"
          autoComplete="new-password"
          returnKeyType="go"
          onSubmitEditing={handleSignUp}
        />
        <PasswordChecklist password={password} />

        <AuthButton
          label="Create account"
          onPress={handleSignUp}
          loading={submitting}
        />

        <Text className="auth-helper text-center">
          We&apos;ll email you a code to verify it&apos;s really you.
        </Text>

        {/* Required for bot protection on web; native platforms skip it. */}
        <View nativeID="clerk-captcha" />
      </View>
    </AuthScreen>
  );
}
