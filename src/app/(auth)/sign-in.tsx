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
import { useSignIn } from "@clerk/expo";
import { Link, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

type Step = "credentials" | "second-factor" | "reset";
type SecondFactor = "email_code" | "phone_code" | "totp";

const SECOND_FACTOR_COPY: Record<
  SecondFactor,
  { title: string; subtitle: string }
> = {
  email_code: {
    title: "Confirm it's you",
    subtitle: "We emailed you a 6-digit code to keep your account safe.",
  },
  phone_code: {
    title: "Confirm it's you",
    subtitle: "We texted a 6-digit code to the phone number on your account.",
  },
  totp: {
    title: "Two-step verification",
    subtitle: "Open your authenticator app and enter the 6-digit code.",
  },
};

export default function SignIn() {
  const { signIn } = useSignIn();
  const params = useLocalSearchParams<{ email?: string }>();
  const cooldown = useResendCooldown();
  const passwordRef = useRef<TextInput>(null);

  const [step, setStep] = useState<Step>("credentials");
  const [secondFactor, setSecondFactor] = useState<SecondFactor>("email_code");
  const [email, setEmail] = useState(params.email ?? "");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});
  const [formError, setFormError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

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
    const { error } = await signIn.finalize({ navigate: navigateToApp });
    if (error) applyError(error);
  };

  const sendSecondFactorCode = async (strategy: SecondFactor) => {
    if (strategy === "totp") return true;
    const { error } =
      strategy === "email_code"
        ? await signIn.mfa.sendEmailCode()
        : await signIn.mfa.sendPhoneCode();
    if (error) {
      applyError(error);
      return false;
    }
    cooldown.start();
    return true;
  };

  // Routes the attempt to whatever Clerk asks for next after a password step.
  const continueSignIn = async () => {
    if (signIn.status === "complete") return finalize();

    if (
      signIn.status === "needs_second_factor" ||
      signIn.status === "needs_client_trust"
    ) {
      const available = signIn.supportedSecondFactors.map(
        (factor) => factor.strategy,
      );
      const strategy = (["email_code", "totp", "phone_code"] as const).find(
        (s) => available.includes(s),
      );

      if (!strategy) {
        setFormError(
          "Your account uses a verification method this app doesn't support yet. Please contact support.",
        );
        return;
      }

      if (!(await sendSecondFactorCode(strategy))) return;
      setSecondFactor(strategy);
      setCode("");
      setFieldErrors({});
      setStep("second-factor");
      return;
    }

    setFormError("We couldn't finish signing you in. Please try again.");
  };

  const handleSignIn = () => {
    const errors: AuthFieldErrors = {
      email: validateEmail(email),
      password: password ? undefined : "Enter your password.",
    };
    if (hasErrors(errors)) return setFieldErrors(errors);

    run(async () => {
      const { error } = await signIn.password({
        emailAddress: normalizeEmail(email),
        password,
      });
      if (error) return applyError(error);
      await continueSignIn();
    });
  };

  const handleVerifySecondFactor = () => {
    const codeError = validateCode(code);
    if (codeError) return setFieldErrors({ code: codeError });

    run(async () => {
      const { error } =
        secondFactor === "email_code"
          ? await signIn.mfa.verifyEmailCode({ code })
          : secondFactor === "phone_code"
            ? await signIn.mfa.verifyPhoneCode({ code })
            : await signIn.mfa.verifyTOTP({ code });
      if (error) return applyError(error);

      if (signIn.status === "complete") return finalize();
      setFormError("We couldn't verify that code. Please try again.");
    });
  };

  const handleForgotPassword = () => {
    const emailError = validateEmail(email);
    if (emailError) {
      return setFieldErrors({
        email: "Enter your email above and we'll send you a reset code.",
      });
    }

    run(async () => {
      const { error } = await signIn.create({
        identifier: normalizeEmail(email),
      });
      if (error) return applyError(error);

      const { error: sendError } =
        await signIn.resetPasswordEmailCode.sendCode();
      if (sendError) return applyError(sendError);

      cooldown.start();
      setCode("");
      setNewPassword("");
      setFieldErrors({});
      setStep("reset");
    });
  };

  const handleResetPassword = () => {
    const errors: AuthFieldErrors = {
      code: validateCode(code),
      password: validateNewPassword(newPassword),
    };
    if (hasErrors(errors)) return setFieldErrors(errors);

    run(async () => {
      // A code that was already accepted can't be verified twice, so skip
      // straight to the password if a previous submit got that far.
      if (signIn.firstFactorVerification.status !== "verified") {
        const { error } = await signIn.resetPasswordEmailCode.verifyCode({
          code,
        });
        if (error) return applyError(error);
      }

      const { error } = await signIn.resetPasswordEmailCode.submitPassword({
        password: newPassword,
        signOutOfOtherSessions: true,
      });
      if (error) return applyError(error);

      await continueSignIn();
    });
  };

  const handleResend = () => {
    run(async () => {
      if (step === "reset") {
        const { error } = await signIn.resetPasswordEmailCode.sendCode();
        if (error) return applyError(error);
        cooldown.start();
        return;
      }
      await sendSecondFactorCode(secondFactor);
    });
  };

  const backToCredentials = () => {
    void signIn.reset();
    setStep("credentials");
    setCode("");
    setPassword("");
    setFieldErrors({});
    setFormError(undefined);
  };

  if (step === "second-factor") {
    const copy = SECOND_FACTOR_COPY[secondFactor];
    return (
      <AuthScreen
        title={copy.title}
        subtitle={copy.subtitle}
        onBack={backToCredentials}
      >
        <View className="auth-form">
          {secondFactor === "email_code" && (
            <AuthMessage tone="info">
              Code sent to{" "}
              <Text className="auth-notice-strong">{maskEmail(email)}</Text>
            </AuthMessage>
          )}
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
            onSubmitEditing={handleVerifySecondFactor}
            inputClassName="auth-code-input"
          />

          <AuthButton
            label="Verify and continue"
            onPress={handleVerifySecondFactor}
            loading={submitting}
            disabled={code.length < 6}
          />

          {secondFactor !== "totp" && (
            <ResendCode
              remaining={cooldown.remaining}
              disabled={submitting}
              onResend={handleResend}
            />
          )}
        </View>
      </AuthScreen>
    );
  }

  if (step === "reset") {
    return (
      <AuthScreen
        title="Reset your password"
        subtitle="Enter the code we emailed you and choose a new password."
        onBack={backToCredentials}
      >
        <View className="auth-form">
          <AuthMessage tone="info">
            Code sent to{" "}
            <Text className="auth-notice-strong">{maskEmail(email)}</Text>
          </AuthMessage>
          <AuthMessage message={formError} />

          <AuthField
            label="Reset code"
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
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            inputClassName="auth-code-input"
          />

          <AuthField
            ref={passwordRef}
            label="New password"
            value={newPassword}
            onChangeText={(value) => {
              setNewPassword(value);
              clearError("password");
            }}
            error={fieldErrors.password}
            placeholder="Create a new password"
            secure
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="newPassword"
            autoComplete="new-password"
            returnKeyType="done"
            onSubmitEditing={handleResetPassword}
          />
          <PasswordChecklist password={newPassword} />

          <AuthButton
            label="Update password"
            onPress={handleResetPassword}
            loading={submitting}
          />

          <ResendCode
            remaining={cooldown.remaining}
            disabled={submitting}
            onResend={handleResend}
          />
        </View>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      title="Welcome back"
      subtitle="Sign in to see every renewal, charge, and trial in one place."
      footer={
        <View className="auth-link-row">
          <Text className="auth-link-copy">New here?</Text>
          <Link href="/(auth)/sign-up" replace asChild>
            <Pressable hitSlop={8} accessibilityRole="link">
              <Text className="auth-link">Create an account</Text>
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

        <AuthField
          ref={passwordRef}
          label="Password"
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            clearError("password");
          }}
          error={fieldErrors.password}
          placeholder="Enter your password"
          secure
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="password"
          autoComplete="current-password"
          returnKeyType="go"
          onSubmitEditing={handleSignIn}
        />

        <View className="auth-row-end">
          <Pressable
            onPress={handleForgotPassword}
            disabled={submitting}
            hitSlop={8}
            accessibilityRole="button"
          >
            <Text className="auth-link">Forgot password?</Text>
          </Pressable>
        </View>

        <AuthButton
          label="Sign in"
          onPress={handleSignIn}
          loading={submitting}
        />
      </View>
    </AuthScreen>
  );
}
