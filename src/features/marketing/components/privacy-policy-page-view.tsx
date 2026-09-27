import Link from "next/link";

import { LegalDocument } from "@/features/marketing/components/legal-document";
import {
  GOOGLE_API_SERVICES_USER_DATA_POLICY_URL,
  GOOGLE_OAUTH_SCOPES,
} from "@/features/marketing/constants/google-oauth-scopes";
import {
  MARKETING_APP_NAME,
  MARKETING_ROUTES,
  MARKETING_SUPPORT_EMAIL,
} from "@/features/marketing/constants/marketing-routes";

export function PrivacyPolicyPageView() {
  return (
    <LegalDocument
      title="Privacy Policy"
      eyebrow="Legal"
      lastUpdated="June 18, 2026"
    >
      <section className="space-y-4">
        <p>
          This Privacy Policy explains how {MARKETING_APP_NAME} (&quot;we&quot;,
          &quot;us&quot;, or &quot;our&quot;) collects, uses, stores, and protects
          information when you use our website and application at{" "}
          <strong>corsair-workspace.vercel.app</strong>.
        </p>
      </section>

      <section className="space-y-4">
        <h2>Google API Services User Data Policy</h2>
        <p>
          {MARKETING_APP_NAME}&apos;s use and transfer to any other app of
          information received from Google APIs will adhere to the{" "}
          <a
            href={GOOGLE_API_SERVICES_USER_DATA_POLICY_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Google API Services User Data Policy
          </a>
          , including the Limited Use requirements.
        </p>
        <p>Under those requirements, we commit that Google user data will:</p>
        <ul>
          <li>
            Be used only to provide or improve user-facing features that are
            prominent in {MARKETING_APP_NAME}&apos;s user interface.
          </li>
          <li>
            Not be transferred to third parties except as necessary to provide or
            improve those features, comply with applicable law, or as part of a
            merger or acquisition with notice to users.
          </li>
          <li>Not be used for serving advertisements.</li>
          <li>
            Not allow humans to read the data unless you give affirmative consent
            for a specific message, it is necessary for security purposes, to
            comply with applicable law, or the data is aggregated and anonymized
            for internal operations.
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2>Information we collect</h2>
        <p>When you use {MARKETING_APP_NAME}, we may collect:</p>
        <ul>
          <li>
            Account information such as your name and email address when you sign
            up or log in with email verification (OTP).
          </li>
          <li>
            Google account data that you explicitly authorize through OAuth when
            connecting Gmail or Google Calendar plugins.
          </li>
          <li>
            Cached copies of Gmail messages, labels, threads, drafts, and Google
            Calendar events needed to provide inbox, calendar, agent, and task
            features.
          </li>
          <li>
            Technical information such as session data, logs, and usage events
            required to operate and secure the service.
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2>Google OAuth scopes we request</h2>
        <p>
          When you connect Gmail or Google Calendar, Google shows you the exact
          permissions before you approve. Depending on the plugins you connect, we
          may request the following scopes:
        </p>
        <ul>
          {GOOGLE_OAUTH_SCOPES.map((item) => (
            <li key={item.scope}>
              <strong>{item.name}</strong> (<code>{item.scope}</code>) —{" "}
              {item.purpose}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4">
        <h2>How we use Google user data</h2>
        <p>
          We use Google user data only to provide features you request inside{" "}
          {MARKETING_APP_NAME}, including:
        </p>
        <ul>
          <li>Displaying and searching your Gmail inbox, sent mail, drafts, and labels.</li>
          <li>Composing, updating, and sending email when you take those actions.</li>
          <li>Archiving, starring, labeling, or trashing messages you manage in the app.</li>
          <li>Displaying your calendar week, event details, and availability.</li>
          <li>Creating, updating, deleting calendar events and sending invites you request.</li>
          <li>
            Powering AI agent and automated task features within your workspace
            using the data you have authorized.
          </li>
          <li>
            Receiving webhook notifications from Google to keep synced data up to
            date.
          </li>
        </ul>
        <p>
          We do not sell Google user data. We do not use Google user data for
          advertising or creditworthiness decisions.
        </p>
      </section>

      <section className="space-y-4">
        <h2>How we use other information</h2>
        <ul>
          <li>To authenticate you and maintain your workspace account.</li>
          <li>To maintain security, prevent abuse, and improve reliability.</li>
          <li>To respond to support requests and legal obligations.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2>Data storage and security</h2>
        <p>
          Integration credentials (OAuth refresh tokens) are encrypted and stored
          per user. Cached Gmail and Calendar data is stored in our database
          infrastructure (Supabase Postgres) while your account and plugin
          connections remain active so the product can function.
        </p>
        <p>
          Each workspace user has separate integration credentials and cached data
          scoped to their account. We do not share one user&apos;s Google data with
          another user.
        </p>
      </section>

      <section className="space-y-4">
        <h2>Data retention and deletion</h2>
        <p>
          We retain Google user data while your plugin connections remain active.
          You may disconnect Gmail or Google Calendar at any time from the Plugins
          page, which stops future syncing. You may also revoke access from your{" "}
          <a
            href="https://myaccount.google.com/permissions"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google Account permissions
          </a>{" "}
          page.
        </p>
        <p>
          To request account or data deletion support, contact us at{" "}
          <a href={`mailto:${MARKETING_SUPPORT_EMAIL}`}>
            {MARKETING_SUPPORT_EMAIL}
          </a>
          .
        </p>
      </section>

      <section className="space-y-4">
        <h2>Sharing and third parties</h2>
        <p>
          We share data only with service providers necessary to operate the app
          (such as hosting and database infrastructure) and with Google when you
          choose to connect Google integrations. AI model providers may process
          content you explicitly submit to agent features; we do not sell personal
          information.
        </p>
      </section>

      <section className="space-y-4">
        <h2>Your choices</h2>
        <ul>
          <li>Disconnect Gmail or Google Calendar at any time from the Plugins page.</li>
          <li>Revoke Google access from your Google Account security settings.</li>
          <li>Contact us to request account or data deletion support.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2>Contact us</h2>
        <p>
          If you have questions about this Privacy Policy or your data, contact us
          at{" "}
          <a href={`mailto:${MARKETING_SUPPORT_EMAIL}`}>
            {MARKETING_SUPPORT_EMAIL}
          </a>
          .
        </p>
        <p>
          See also our{" "}
          <Link href={MARKETING_ROUTES.termsAndConditions}>
            Terms &amp; Conditions
          </Link>
          .
        </p>
      </section>
    </LegalDocument>
  );
}
