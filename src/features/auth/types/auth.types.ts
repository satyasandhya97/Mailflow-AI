export type AuthFlow = "signup" | "login";

export type SignupDraft = {
  fullName: string;
  email: string;
};

export type VerifyOtpParams = {
  email: string;
  flow: AuthFlow;
};
