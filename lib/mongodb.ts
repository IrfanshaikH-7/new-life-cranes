import "server-only";
import { MongoClient, ServerApiVersion, type Db, type MongoClientOptions } from "mongodb";

const uri = process.env.DATABASE_URL;
const dbName = process.env.DATABASE_NAME || "new-life-cranes";

if (!uri) {
  throw new Error("Missing DATABASE_URL in environment");
}

const options: MongoClientOptions = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: false,
    deprecationErrors: true,
  },
  serverSelectionTimeoutMS: 10_000,
};

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function connect(): Promise<MongoClient> {
  return new MongoClient(uri!, options).connect();
}

function getClientPromise(): Promise<MongoClient> {
  if (process.env.NODE_ENV !== "development") {
    return connect();
  }
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = connect().catch((err) => {
      // Don't keep a rejected promise around — clear so next call retries.
      global._mongoClientPromise = undefined;
      throw err;
    });
  }
  return global._mongoClientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getClientPromise();
  return client.db(dbName);
}

export default getClientPromise();
