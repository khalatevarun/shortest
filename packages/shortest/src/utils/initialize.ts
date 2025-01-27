import { existsSync } from "fs";

export function detectProjectType(): "typescript" | "javascript" {
    return existsSync("tsconfig.json") ? "typescript" : "javascript";
  }
  
  export function getConfigTemplate(projectType: "typescript" | "javascript"): string {
    if (projectType === "typescript") {
      return `import type { ShortestConfig } from "@antiwork/shortest";
  
  export default {
    headless: false,
    baseUrl: "http://localhost:3000",
    testPattern: "**/*.test.ts",
    anthropicKey: process.env.ANTHROPIC_API_KEY,
  } satisfies ShortestConfig;
  `;
    } else {
      return `/** @type {import('@antiwork/shortest').ShortestConfig} */
  module.exports = {
    headless: false,
    baseUrl: "http://localhost:3000",
    testPattern: "**/*.test.js",
    anthropicKey: process.env.ANTHROPIC_API_KEY,
  };
  `;
    }
  }

export function getEnvTemplate(): string {
  return `# Shortest Environment Variables
  ANTHROPIC_API_KEY=
  
  # Optional Configuration
  # MAILOSAUR_API_KEY=
  # MAILOSAUR_SERVER_ID=
  `;
}
