import { MongoClient } from 'mongodb';

type DocumentRecord = Record<string, unknown>;

// In-memory collections store for AI Studio mock execution
const globalForMock = global as typeof globalThis & {
  _mockCollections?: Map<string, DocumentRecord[]>;
};
if (!globalForMock._mockCollections) {
  globalForMock._mockCollections = new Map();
}
const mockStore = globalForMock._mockCollections;

function createMockCollection(name: string) {
  if (!mockStore.has(name)) {
    mockStore.set(name, []);
  }

  return {
    findOne: async (query: DocumentRecord) => {
      const docs = mockStore.get(name) || [];
      return (
        docs.find((doc) =>
          Object.entries(query).every(([k, v]) => doc[k] === v)
        ) || null
      );
    },
    insertOne: async (doc: DocumentRecord) => {
      const docs = mockStore.get(name) || [];
      const insertedDoc = {
        ...doc,
        _id: doc._id || `id_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      };
      docs.push(insertedDoc);
      return { insertedId: insertedDoc._id, acknowledged: true };
    },
    find: (query: DocumentRecord = {}) => {
      const docs = mockStore.get(name) || [];
      const filtered = docs.filter((doc) =>
        Object.entries(query).every(([k, v]) => doc[k] === v)
      );
      return {
        toArray: async () => [...filtered],
      };
    },
    updateOne: async (query: DocumentRecord, update: DocumentRecord) => {
      const docs = mockStore.get(name) || [];
      const index = docs.findIndex((doc) =>
        Object.entries(query).every(([k, v]) => doc[k] === v)
      );
      if (index === -1) return { matchedCount: 0, modifiedCount: 0 };
      const current = docs[index];
      const setFields = (update.$set as DocumentRecord) || update;
      const updated = { ...current, ...setFields };
      docs[index] = updated;
      return { matchedCount: 1, modifiedCount: 1 };
    },
    deleteOne: async (query: DocumentRecord) => {
      const docs = mockStore.get(name) || [];
      const index = docs.findIndex((doc) =>
        Object.entries(query).every(([k, v]) => doc[k] === v)
      );
      if (index === -1) return { deletedCount: 0 };
      docs.splice(index, 1);
      return { deletedCount: 1 };
    },
  };
}

function createMockClient(): unknown {
  return {
    db: () => ({
      collection: (colName: string) => createMockCollection(colName),
    }),
  };
}

let clientPromise: Promise<MongoClient>;

const uri = process.env.MONGODB_URI;

if (!uri) {
  clientPromise = Promise.resolve(createMockClient() as unknown as MongoClient);
} else {
  try {
    const client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    clientPromise = client.connect().catch((err: Error) => {
      console.warn('[AI Studio] MongoDB connection failed, falling back to mock:', err.message);
      return createMockClient() as unknown as MongoClient;
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.warn('[AI Studio] Error initializing MongoClient, falling back to mock:', message);
    clientPromise = Promise.resolve(createMockClient() as unknown as MongoClient);
  }
}

export default clientPromise;
