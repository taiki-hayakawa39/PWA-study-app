import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const publicDir = resolve("public");
const versionFile = resolve(publicDir, "version.json");
const version = new Date().toISOString();

await mkdir(publicDir, { recursive: true });
await writeFile(versionFile, `${JSON.stringify({ version }, null, 2)}\n`, "utf8");
