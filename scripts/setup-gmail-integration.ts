import "dotenv/config";

import { ensureIntegrationCredentials } from "@/server/services/integrations.service";

ensureIntegrationCredentials()
  .then(() => {
    console.log("Gmail integration credentials configured.");
  })
  .catch((error) => {
    console.error("Setup failed:", error);
    process.exit(1);
  });
