import { readFile, writeFile } from "node:fs/promises";
import os from "os";
import { join } from "path";

type GitIgnoreResult = {
  wasCreated: boolean;
  wasUpdated: boolean;
  error?: Error;
};

export async function addToGitIgnore(
  path: string,
  values: string[],
): Promise<GitIgnoreResult> {
  const result: GitIgnoreResult = {
    wasCreated: false,
    wasUpdated: false,
  };

  try {
    const gitIgnorePath = join(path, ".gitignore");
    let gitIgnore = await readFile(gitIgnorePath, "utf8").catch(() => null);
    const isNewFile = gitIgnore === null;
    gitIgnore = gitIgnore ?? "";
    const EOL = gitIgnore.includes("\r\n") ? "\r\n" : os.EOL;

    const addValue = (content: string, value: string): string => {
      if (!content.split(EOL).includes(value)) {
        return `${content}${
          content.endsWith(EOL) || content.length === 0 ? "" : EOL
        }${value}${EOL}`;
      }
      return content;
    };

    let modified = false;
    let content = gitIgnore;
    for (const value of values) {
      const newContent = addValue(content, value);
      if (newContent !== content) {
        modified = true;
        content = newContent;
      }
    }

    if (modified) {
      await writeFile(gitIgnorePath, content);
      result.wasCreated = isNewFile;
      result.wasUpdated = !isNewFile;
    }
  } catch (error) {
    result.error = error as Error;
  }

  return result;
}
