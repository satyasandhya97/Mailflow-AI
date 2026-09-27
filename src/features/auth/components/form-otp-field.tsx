"use client";

import { REGEXP_ONLY_DIGITS } from "input-otp";
import type { Control, FieldPath, FieldValues } from "react-hook-form";
import { Controller } from "react-hook-form";

import {
  Field,
  FieldDescription,
  FieldError,
} from "@/components/ui/field";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { OTP_LENGTH } from "@/features/auth/constants/auth.constants";
import { cn } from "@/lib/utils";

type FormOtpFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
  onComplete?: (code: string) => void;
  autoFocus?: boolean;
};

export function FormOtpField<T extends FieldValues>({
  control,
  name,
  label = "Verification code",
  description,
  disabled,
  className,
  onComplete,
  autoFocus,
}: FormOtpFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className={cn("text-center", className)}>
          <InputOTP
            id={field.name}
            name="one-time-code"
            autoComplete="one-time-code"
            inputMode="numeric"
            autoFocus={autoFocus}
            maxLength={OTP_LENGTH}
            pattern={REGEXP_ONLY_DIGITS}
            value={field.value ?? ""}
            onChange={field.onChange}
            onComplete={onComplete}
            disabled={disabled}
            containerClassName="justify-center "
          >
            <InputOTPGroup>
              {Array.from({ length: 4 }).map((_, index) => (
                <InputOTPSlot
                  key={index}
                  index={index}
                  className="size-10 text-base"
                />
              ))}
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              {Array.from({ length: 4 }).map((_, index) => (
                <InputOTPSlot
                  key={index + 4}
                  index={index + 4}
                  className="size-10 text-base"
                />
              ))}
            </InputOTPGroup>
          </InputOTP>
          {description ? (
            <FieldDescription className="text-center">
              {description}
            </FieldDescription>
          ) : null}
          {fieldState.error ? (
            <FieldError
              className={cn("text-center")}
              errors={[fieldState.error]}
            />
          ) : null}
        </Field>
      )}
    />
  );
}
