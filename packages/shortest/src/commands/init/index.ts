import { execSync } from "child_process";
import { readFileSync, existsSync, writeFileSync, appendFileSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { detect, resolveCommand } from "package-manager-detector";
import pc from "picocolors";

export default async function main() {
  console.log(pc.blue("Setting up Shortest..."));

  try {
    const packageJson = await getPackageJson();
    if (
      packageJson?.dependencies?.["@antiwork/shortest"] ||
      packageJson?.devDependencies?.["@antiwork/shortest"]
    ) {
      console.log(pc.green("✔ Package already installed"));
      return;
    } else {
      console.log("Installing @antiwork/shortest...");
      const installCmd = await getInstallCmd();
      execSync(installCmd, { stdio: "inherit" });
      console.log(pc.green("✔ Dependencies installed"));
    }

    const CONFIG_FILENAME = "shortest.config.ts";
    const configPath = join(process.cwd(), CONFIG_FILENAME);
    const exampleConfigPath = join(
      fileURLToPath(new URL("../../src", import.meta.url)),
      `${CONFIG_FILENAME}.example`,
    );

    const exampleConfig = readFileSync(exampleConfigPath, "utf8");
    writeFileSync(configPath, exampleConfig);
    console.log(pc.green(`✔ ${CONFIG_FILENAME} created`));

    const gitignorePath = join(process.cwd(), ".gitignore");
    if (!existsSync(gitignorePath)) {
      writeFileSync(gitignorePath, ".shortest/\n");
      console.log(pc.green("✔ .gitignore file created"));
    } else {
      appendFileSync(gitignorePath, "\n.shortest/\n");
      console.log(pc.green("✔ .gitignore file updated"));
    }

    const envPath = join(process.cwd(), ".env.local");
    if (!existsSync(envPath)) {
      writeFileSync(envPath, getEnvTemplate());
      console.log(pc.green("✔ Environment file created"));
    } else {
      appendFileSync(envPath, getEnvTemplate());
      console.log(pc.green("✔ Environment file updated"));
    }

    console.log(pc.green("\nInitialization complete! Next steps:"));
    console.log("1. Add your ANTHROPIC_API_KEY to .env.local");
    console.log("2. Create your first test file: my-test.test.ts");
    console.log("3. Run tests with: shortest my-test.test.ts");
  } catch (error) {
    console.error(pc.red("Initialization failed:"), error);
    process.exit(1);
  }
}

export const getPackageJson = async () => {
  try {
    return JSON.parse(
      await readFileSync(join(process.cwd(), "package.json"), "utf8"),
    );
  } catch {}
};

export function getEnvTemplate(): string {
  return `# Shortest Environment Variables
ANTHROPIC_API_KEY=

# Optional Configuration
# MAILOSAUR_API_KEY=
# MAILOSAUR_SERVER_ID=
`;
}

export const getInstallCmd = async () => {
  const packageManager = (await detect()) || { agent: "npm", version: "" };
  const packageJson = await getPackageJson();
  if (packageJson?.packageManager) {
    const [name] = packageJson.packageManager.split("@");
    if (["pnpm", "yarn", "bun"].includes(name)) {
      packageManager.agent = name;
    }
  }

  const command = resolveCommand(packageManager.agent, "install", [
    "@antiwork/shortest",
    "--save-dev",
  ]);

  if (!command) {
    throw new Error(`Unsupported package manager: ${packageManager.agent}`);
  }

  const cmdString = `${command.command} ${command.args.join(" ")}`;
  console.log(pc.dim(cmdString));

  return cmdString;
};
