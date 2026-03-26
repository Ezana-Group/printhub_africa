import { parseUrlImport, searchMyMiniFactory } from "../lib/import-utils";

async function testMMF() {
  console.log("Starting MyMiniFactory API v2 tests...");

  // Mock global fetch
  const originalFetch = global.fetch;
  
  try {
    // Test 1: MMF Search with API Key
    process.env.MYMINIFACTORY_API_KEY = "test-api-key";
    delete process.env.MMF_CLIENT_ID;

    global.fetch = async (url: any, options: any) => {
      console.log(`[TEST] Fetching: ${url}`);
      if (url.toString().includes("commercial_use=1") && url.toString().includes("key=test-api-key")) {
        return {
          ok: true,
          json: async () => ({ items: [] })
        } as any;
      }
      return { ok: false, status: 400 } as any;
    };

    console.log("Testing MMF Search with API Key...");
    await searchMyMiniFactory("test");
    console.log("✅ Success: MMF Search uses commercial_use=1 and key param.");

    // Test 2: MMF Object with API Key
    global.fetch = async (url: any, options: any) => {
      console.log(`[TEST] Fetching: ${url}`);
      if (url.toString().includes("/objects/123") && url.toString().includes("key=test-api-key")) {
        return {
          ok: true,
          json: async () => ({ name: "Test Object" })
        } as any;
      }
      return { ok: false, status: 400 } as any;
    };

    console.log("Testing MMF Object with API Key...");
    const res = await parseUrlImport("https://www.myminifactory.com/object/123");
    if ("name" in res && res.name === "Test Object") {
      console.log("✅ Success: MMF Object fetch uses key param.");
    } else {
      console.error("❌ Failure: MMF Object fetch failed.", res);
    }

  } catch (err) {
    console.error("Test execution error:", err);
  } finally {
    global.fetch = originalFetch;
  }
}

testMMF();
