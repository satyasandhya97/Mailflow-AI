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
  loginSchema,
  type LoginFormValues,
} from "@/features/auth/schemas/auth.schemas";

export function LoginForm() {
  const { goToVerifyOtp } = useAuthNavigation();
  const { sendOtp, isLoading } = useAuthApi();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
    },
    mode: "onSubmit",
  });

  async function onSubmit(values: LoginFormValues) {
    const result = await sendOtp({
      email: values.email,
      flow: "login",
    });
    if (!result.success) {
      toast.error(result.message);
      return;
    }

    toast.success("OTP sent to your email");
    goToVerifyOtp(values.email, "login");
  }

  return (
    <AuthCard
      title="Welcome back"
      description="Enter your email and we'll send you an 8-digit login code."
      footer={
        <AuthFooterLinks
          prompt="Don't have an account?"
          linkLabel="Sign up"
          href="/signup"
        />
      }
    >
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <FieldGroup>
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
