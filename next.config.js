/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

import "./src/env.js";

const projectRoot = dirname(fileURLToPath(import.meta.url));

/** @type {import("next").NextConfig} */
const config = {
  serverExternalPackages: ["express", "@corsair-dev/mcp"],
  // Multiple lockfiles exist on this machine; pin the tracing root to this
  // project so the production build resolves modules from here.
  outputFileTracingRoot: projectRoot,
  // Pre-existing lint errors in some server files would otherwise fail the
  // production build. Type-checking still runs; lint runs in dev and via `pnpm lint`.
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default config;
