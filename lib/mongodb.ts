import "server-only";
import { MongoClient, ServerApiVersion, type Db, type MongoClientOptions } from "mongodb";

const uri = process.env.DATABASE_URL;
const dbName = process.env.DATABASE_NAME || "new-life-cranes";

if (!uri) throw new Error("Missing DATABASE_URL");

const options: MongoClientOptions = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: false,
    deprecationErrors: true,
  },
  // Keep the pool small — Vercel serverless functions are short-lived
  maxPoolSize: 5,
  minPoolSize: 1,
  // Don't wait forever on cold Atlas wakeup
  serverSelectionTimeoutMS: 8_000,
  connectTimeoutMS: 8_000,
  socketTimeoutMS: 30_000,
};

declare global {
  // eslint-disable-next-line no-var
  var _mongoClient: MongoClient | undefined;
}

function getClient(): MongoClient {
  // Reuse across hot reloads in dev AND across warm invocations in prod
  if (!global._mongoClient) {
    global._mongoClient = new MongoClient(uri!, options);
  }
  return global._mongoClient;
}

export async function getDb(): Promise<Db> {
  const client = getClient();
  // connect() is a no-op if already connected
  await client.connect();
  return client.db(dbName);
}

export default getClient();
