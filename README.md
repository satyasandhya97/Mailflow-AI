<div align="center">
  <h1>Mailflow AI</h1>
  <p>Your email, calendar, and AI agents in one clean, powerful workspace.</p>
</div>

Mailflow AI is a modern, production-grade SaaS application that unifies your Gmail inbox and Google Calendar with intelligent AI agents. Built with a beautiful **Black & Olive theme**, it helps you triage emails, schedule meetings, and automate workflows effortlessly without ever switching tabs.

## 🚀 Key Features

- **Unified Inbox & Calendar:** Manage your Google Calendar events and Gmail inbox from a single, fast, and modern interface.
- **AI Agent Workflows:** Powered by Gemini / Groq and the AI SDK, your personal assistant can summarize threads, draft replies, and execute complex scheduling tasks.
- **Real-Time Sync:** Leverages WebSockets and Google Webhooks (Pub/Sub) to keep your workspace instantly synced with your Google account.
- **Per-User Secure OAuth:** Each user securely connects their own Google Account, with credentials heavily encrypted and securely stored using Corsair integration pipelines.
- **Automated Task Board:** Create recurring or event-driven agent tasks on a Kanban board, running automatically in the background.
- **Beautiful UI:** Custom-built components with Tailwind CSS using a sleek, premium dark aesthetic.

## 🛠 Tech Stack

- **Framework:** [Next.js 15 (App Router)](https://nextjs.org/)
- **API & Data Fetching:** [tRPC](https://trpc.io/) + [React Query](https://tanstack.com/query/latest)
- **Database ORM:** [Drizzle ORM](https://orm.drizzle.team/)
- **Database Provider:** PostgreSQL (e.g., Supabase / Neon)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) + Custom Design System
- **AI Integration:** [Vercel AI SDK](https://sdk.vercel.ai/docs)
- **Integrations Framework:** [@corsair-dev/gmail](https://npmjs.com/package/@corsair-dev/gmail) & `@corsair-dev/googlecalendar`
- **Authentication:** Custom secure session & OTP-based magic links

---

## 💻 Getting Started (Local Development)

### 1. Prerequisites
- **Node.js** v20+
- **pnpm** v10+ (`npm install -g pnpm`)
- **PostgreSQL Database** (We recommend [Supabase](https://supabase.com/))
- **Google Cloud Console Account** (for OAuth and APIs)

### 2. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/your-username/Mailflow-AI.git
cd Mailflow-AI
pnpm install
```

### 3. Environment Variables

Copy the example environment file and fill in your keys:

```bash
cp .env.example .env
```

You will need to generate a few secrets and configure your database URLs. 
```bash
# Generate secrets for AUTH_SECRET, CRON_SECRET, and AGENT_MCP_INTERNAL_SECRET:
openssl rand -base64 32
```

### 4. Database Setup

Once your `DATABASE_URL` and `DIRECT_URL` are configured in `.env`, push the schema to your database:

```bash
pnpm db:push
```

### 5. Google Cloud Configuration

To connect Gmail and Google Calendar, you must create an OAuth application in GCP:
1. Go to the [Google Cloud Console](https://console.cloud.google.com/projectcreate) and create a new project.
2. Enable the **Gmail API** and **Google Calendar API**.
3. Setup the **OAuth Consent Screen** (If developing locally, set it to "Testing" and add your own email to the "Test users" list).
4. Create **OAuth 2.0 Client IDs** (Web application) and set the redirect URI to:
   `http://localhost:3000/api/oauth/callback`
5. Copy the Client ID and Client Secret into your `.env`:
   ```env
   GOOGLE_CLIENT_ID="your-client-id"
   GOOGLE_CLIENT_SECRET="your-client-secret"
   ```

### 6. Start the Application

Start the Next.js development server:

```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## 🔄 Real-Time Webhooks (Optional for Local)

To receive instant push notifications from Gmail when new emails arrive, you must configure Google Cloud Pub/Sub:

1. Expose your local server using [Ngrok](https://ngrok.com/):
   ```bash
   ngrok http 3000
   ```
2. Update your `.env`:
   ```env
   APP_URL="https://your-ngrok-url.ngrok-free.app"
   ```
3. In Google Cloud, create a Pub/Sub topic.
4. Grant `gmail-api-push@system.gserviceaccount.com` the **Pub/Sub Publisher** role on the topic.
5. Create a Push Subscription pointing to: `https://your-ngrok-url.ngrok-free.app/api/webhooks`
6. Set the topic name in `.env`:
   ```env
   GMAIL_PUBSUB_TOPIC="projects/YOUR_PROJECT_ID/topics/YOUR_TOPIC_NAME"
   ```

---

## 📂 Project Structure

- `src/app/` — Next.js App Router pages and API routes.
- `src/components/` — Shared UI components (buttons, dialogs, inputs).
- `src/features/` — Domain-specific logic, components, and hooks (e.g., `agent/`, `calendar/`, `tasks/`).
- `src/server/` — Backend logic, tRPC routers, database schemas, AI definitions, and OAuth integrations.
- `src/styles/` — Global CSS and Tailwind variables.

---

## 📜 License
All rights reserved. Mailflow AI is a proprietary software.