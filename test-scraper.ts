import { detectPlatform, parseUrlImport, searchThingiverse } from "./lib/import-utils";

async function run() {
  const data = await searchThingiverse("egg");
  console.log(JSON.stringify(data[0], null, 2));
}

run();
