import fs from "node:fs/promises";
import path from "node:path";

function encodeValues(obj) {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [
      k,
      Buffer.from(String(v)).toString("base64"),
    ]),
  );
}

function decodeValues(obj) {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [
      k,
      Buffer.from(v, "base64").toString("utf-8"),
    ]),
  );
}

async function getConfiguration() {
  try {
    const configRaw = await fs.readFile(
      path.resolve("./", "auron-config.json"),
      "utf-8",
    );
    const encoded = JSON.parse(configRaw);
    return decodeValues(encoded);
  } catch {
    return {};
  }
}

async function setConfiguration(configurationData) {
  const existing = await getConfiguration();
  const merged = { ...existing, ...configurationData };
  await fs.writeFile(
    path.resolve("./", "auron-config.json"),
    JSON.stringify(encodeValues(merged), null, 2),
  );
  return getConfiguration();
}

// CLI entrypoint
async function main() {
  const [, , command, ...args] = process.argv;

  if (command === "getConfiguration") {
    try {
      const config = await getConfiguration();
      console.log(JSON.stringify(config, null, 2));
    } catch (err) {
      console.error("Error reading config:", err.message);
      process.exit(1);
    }
  } else if (command === "setConfiguration") {
    if (args.length < 1) {
      console.error(
        "Usage: node token-storage.js setConfiguration '{\"env\": ...}'",
      );
      process.exit(1);
    }
    let data;
    try {
      data = JSON.parse(args[0]);
    } catch (err) {
      console.error("Invalid JSON for configurationData:", err.message);
      process.exit(1);
    }
    try {
      const updatedConfig = await setConfiguration(data);
      console.log("Updated configuration:");
      console.log(JSON.stringify(updatedConfig, null, 2));
    } catch (err) {
      console.error("Error writing config:", err.message);
      process.exit(1);
    }
  } else {
    console.error(
      `Unknown or missing command. Use one of:\n  node token-storage.js getConfiguration\n  node token-storage.js setConfiguration '{"env":"dev", ...}'`,
    );
    process.exit(1);
  }
}

main();
