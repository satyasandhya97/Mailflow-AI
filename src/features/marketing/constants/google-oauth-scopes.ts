/** Declared Google OAuth scopes — keep in sync with Google Cloud OAuth consent screen. */
export const GOOGLE_OAUTH_SCOPES = [
  {
    scope: "openid",
    name: "OpenID Connect",
    purpose: "Authenticate your Google account during plugin connection.",
  },
  {
    scope: "email",
    name: "Email address",
    purpose: "Identify which Google account you connected to your workspace.",
  },
  {
    scope: "profile",
    name: "Basic profile",
    purpose: "Display your name on connected plugin status where applicable.",
  },
  {
    scope: "https://www.googleapis.com/auth/gmail.modify",
    name: "Gmail modify",
    purpose:
      "Read, search, organize, compose, send, and manage messages and labels in your Gmail inbox.",
  },
  {
    scope: "https://www.googleapis.com/auth/gmail.compose",
    name: "Gmail compose",
    purpose: "Create and update email drafts inside Mailflow AI.",
  },
  {
    scope: "https://www.googleapis.com/auth/gmail.send",
    name: "Gmail send",
    purpose: "Send email on your behalf when you explicitly request it.",
  },
  {
    scope: "https://www.googleapis.com/auth/calendar",
    name: "Google Calendar",
    purpose:
      "View your calendars, events, and availability; create, update, and delete events; send meeting invites.",
  },
  {
    scope: "https://www.googleapis.com/auth/calendar.events",
    name: "Calendar events",
    purpose:
      "Sync and manage calendar events shown in the workspace and used by the AI agent for scheduling.",
  },
] as const;

export const GOOGLE_API_SERVICES_USER_DATA_POLICY_URL =
  "https://developers.google.com/terms/api-services-user-data-policy";
