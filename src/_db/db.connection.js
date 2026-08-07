import mongoose from 'mongoose';

const connections = new Map();

const DEFAULT_OPTIONS = {
  autoIndex: false,
  maxPoolSize: 50,
  minPoolSize: 10,
  connectTimeoutMS: 10000,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

export const createMongoConnection = async (key, uri) => {
  if (connections.has(key)) {
    return connections.get(key);
  }

  const conn = mongoose.createConnection(uri, DEFAULT_OPTIONS);

  conn.on('connected', () => {
    console.log(`✅ MongoDB connected: ${key}`);
  });

  conn.on('error', (err) => {
    console.error(`❌ MongoDB error (${key}):`, err.message);
  });

  connections.set(key, conn);
  return conn;
};

export const getDb = (connection, dbName) => {
  return connection.useDb(dbName, { useCache: true });
};

export const disconnectAllMongoConnections = async () => {
  for (const [key, conn] of connections.entries()) {
    await conn.close(false);
    console.log(`🔻 Mongo connection closed: ${key}`);
  }
  connections.clear();
};
