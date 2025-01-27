import { existsSync } from "fs";

export function detectPackageManager(): "npm" | "pnpm" | "yarn" {
  if (existsSync("pnpm-lock.yaml")) return "pnpm";
  if (existsSync("yarn.lock")) return "yarn";
  return "npm";
}

export function getConfigTemplate(): string {
  return `import type { ShortestConfig } from "@antiwork/shortest";
  
  export default {
    headless: false,
    baseUrl: "http://localhost:3000",
    testPattern: "**/*.test.ts",
    anthropicKey: process.env.ANTHROPIC_API_KEY,
  } satisfies ShortestConfig;
  `;
}

export function getEnvTemplate(): string {
  return `# Shortest Environment Variables
  ANTHROPIC_API_KEY=
  
  # Optional Configuration
  # MAILOSAUR_API_KEY=
  # MAILOSAUR_SERVER_ID=
  `;
}
