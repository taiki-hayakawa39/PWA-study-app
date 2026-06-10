import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const versionFile = resolve("public", "version.json");

await writeFile(versionFile, `${JSON.stringify({ version: "development" }, null, 2)}\n`, "utf8");
