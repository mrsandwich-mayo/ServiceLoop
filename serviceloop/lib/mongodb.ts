import { MongoClient } from 'mongodb';
import { Resolver } from 'dns/promises';

/**
 * Resolves a mongodb+srv:// URI to a direct mongodb:// URI using a public DNS server.
 * This bypasses local ISP/network DNS that may block SRV record lookups.
 */
async function resolveSrvUri(uri: string): Promise<string> {
  const match = uri.match(/^mongodb\+srv:\/\/([^:]+):([^@]+)@([^/?]+)(.*)/);
  if (!match) return uri; // not an SRV URI, return as-is

  const [, username, password, srvHostname, rest] = match;

  // Use Google public DNS (8.8.8.8) to resolve the SRV record
  const resolver = new Resolver();
  resolver.setServers(['8.8.8.8', '1.1.1.1']);

  // Resolve SRV records to get real hostnames and ports
  const srvRecords = await resolver.resolveSrv(`_mongodb._tcp.${srvHostname}`);
  const hosts = srvRecords.map((r) => `${r.name}:${r.port}`).join(',');

  // Resolve TXT record to get extra options (like authSource, replicaSet)
  let txtOptions = '';
  try {
    const txtRecords = await resolver.resolveTxt(srvHostname);
    txtOptions = txtRecords.flat().join('&');
  } catch {
    // TXT record is optional
  }

  // Parse any options from the original URI (e.g. ?appName=SLCluster0)
  const originalParams = rest.replace(/^\/[^?]*/, '').replace(/^\?/, '');
  const allParams = [txtOptions, originalParams, 'tls=true']
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
    globalWithMongo._mongoClientPromise = resolveSrvUri(uri).then((resolvedUri) => {
      const client = new MongoClient(resolvedUri, {
        serverSelectionTimeoutMS: 15000,
        connectTimeoutMS: 15000,
      });
      return client.connect();
    });
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  clientPromise = resolveSrvUri(uri).then((resolvedUri) => {
    const client = new MongoClient(resolvedUri, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
    });
    return client.connect();
  });
}

export default clientPromise;
