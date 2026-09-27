"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { AuthCard } from "@/features/auth/components/auth-card";
import { AuthFooterLinks } from "@/features/auth/components/auth-footer-links";
import { FormTextField } from "@/features/auth/components/form-text-field";
import { useAuthNavigation } from "@/features/auth/hooks/use-auth-navigation";
import { useAuthApi } from "@/features/auth/hooks/use-auth-api";
import {
  signupSchema,
  type SignupFormValues,
} from "@/features/auth/schemas/auth.schemas";

export function SignupForm() {
  const { goToVerifyOtp } = useAuthNavigation();
  const { sendOtp, isLoading } = useAuthApi();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      email: "",
    },
    mode: "onSubmit",
  });

  async function onSubmit(values: SignupFormValues) {
    const result = await sendOtp({
      email: values.email,
      flow: "signup",
      fullName: values.fullName,
    });
    if (!result.success) {
      toast.error(result.message);
      return;
    }

    toast.success("OTP sent to your email");
    goToVerifyOtp(values.email, "signup", {
      fullName: values.fullName,
      email: values.email,
    });
  }

  return (
    <AuthCard
      title="Create your account"
      description="Enter your details. We'll send an 8-digit code to your email."
      footer={
        <AuthFooterLinks
          prompt="Already have an account?"
          linkLabel="Log in"
          href="/login"
        />
      }
    >
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <FieldGroup>
          <FormTextField
            control={form.control}
            name="fullName"
            label="Full name"
            placeholder="Jane Doe"
            autoComplete="name"
            disabled={isLoading}
          />
          <FormTextField
            control={form.control}
            name="email"
            label="Email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            disabled={isLoading}
          />
          <Button
            type="submit"
            className="h-10 w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Spinner className="mr-2" />
                Sending OTP…
              </>
            ) : (
              "Send OTP"
            )}
          </Button>
        </FieldGroup>
      </form>
    </AuthCard>
  );
}
