import { MongoClient } from 'mongodb';

/**
 * Transforms an Atlas mongodb+srv URI into a direct mongodb URI 
 * by hardcoding the standard Atlas replica set shards.
 * This completely bypasses all DNS SRV lookups which your network is blocking.
 */
function resolveSrvUri(uri: string): string {
  const match = uri.match(/^mongodb\+srv:\/\/([^:]+):([^@]+)@([^/?]+)(.*)/);
  if (!match) return uri; // not an SRV URI, return as-is

  const [, username, password, srvHostname, rest] = match;

  // Standard Atlas replica set shards follow this exact pattern:
  const baseName = srvHostname.split('.')[0]; // e.g., slcluster0
  const domainRest = srvHostname.substring(baseName.length); // e.g., .nbfagyq.mongodb.net

  const hosts = [
    `${baseName}-shard-00-00${domainRest}:27017`,
    `${baseName}-shard-00-01${domainRest}:27017`,
    `${baseName}-shard-00-02${domainRest}:27017`
  ].join(',');

  // Parse any options from the original URI
  const originalParams = rest.replace(/^\/[^?]*/, '').replace(/^\?/, '');
  const allParams = [originalParams, 'tls=true', 'authSource=admin', 'replicaSet=atlas-h2v6v9-shard-0']
    .filter(Boolean)
    .join('&');

  return `mongodb://${username}:${password}@${hosts}/serviceloop?${allParams}`;
}

const uri = process.env.MONGODB_URI!;
if (!uri) throw new Error('Missing MONGODB_URI environment variable');

let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    const directUri = resolveSrvUri(uri);
    const client = new MongoClient(directUri, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
    });
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  const directUri = resolveSrvUri(uri);
  const client = new MongoClient(directUri, {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000,
  });
  clientPromise = client.connect();
}

export default clientPromise;
