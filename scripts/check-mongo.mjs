// Quick connection sanity check. Run: node --env-file=.env scripts/check-mongo.mjs
import { MongoClient, ServerApiVersion } from "mongodb";

const uri = process.env.DATABASE_URL;
if (!uri) {
  console.error("DATABASE_URL missing");
  process.exit(1);
}

const client = new MongoClient(uri, {
  serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
  serverSelectionTimeoutMS: 10_000,
});

try {
  await client.connect();
  await client.db("admin").command({ ping: 1 });
  console.log("✅ Connected to Atlas successfully");
} catch (err) {
  console.error("❌ Connection failed:", err?.message ?? err);
  if (err?.cause?.code === "ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR") {
    console.error(
      "\nMost likely causes:\n" +
        " 1. Your current IP is not in Atlas Network Access allowlist.\n" +
        " 2. The cluster is paused — resume it in the Atlas UI.\n"
    );
  }
} finally {
  await client.close();
}
