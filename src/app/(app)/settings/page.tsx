import { env } from "@/env";

export default function SettingsPage() {
  return (
    <div>
      <h1>Settings</h1>
      <p className="muted">Workspace configuration and tenant settings.</p>
      <dl>
        <dt>Tenant ID</dt>
        <dd>{env.TENANT_ID}</dd>
      </dl>
    </div>
  );
}
