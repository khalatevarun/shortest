import { execSync } from "child_process";
import { existsSync } from "node:fs";
import { readFile, writeFile, appendFile } from "node:fs/promises";
import { join } from "path";
import { fileURLToPath } from "url";
import { detect, resolveCommand } from "package-manager-detector";
import pc from "picocolors";
import { CONFIG_FILENAME } from "../../constants";
import { addToGitIgnore } from "../../utils/add-to-gitignore";

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

    const configPath = join(process.cwd(), CONFIG_FILENAME);
    const exampleConfigPath = join(
      fileURLToPath(new URL("../../src", import.meta.url)),
      `${CONFIG_FILENAME}.example`,
    );

    const exampleConfig = await readFile(exampleConfigPath, "utf8");
    await writeFile(configPath, exampleConfig, "utf8");
    console.log(pc.green(`✔ ${CONFIG_FILENAME} created`));

    const envPath = join(process.cwd(), ".env.local");
    if (!existsSync(envPath)) {
      await writeFile(envPath, getEnvTemplate(), "utf8");
      console.log(pc.green("✔ Environment file created"));
    } else {
      await appendFile(envPath, getEnvTemplate());
      console.log(pc.green("✔ Environment file updated"));
    }

    const result = await addToGitIgnore(process.cwd(), [
      ".env*.local",
      ".shortest/",
    ]);
    if (result.error) {
      console.error(pc.red("Failed to update .gitignore"), result.error);
    } else {
      console.log(
        pc.green(`✔ .gitignore ${result.wasCreated ? "created" : "updated"}`),
      );
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
      await readFile(join(process.cwd(), "package.json"), "utf8"),
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
