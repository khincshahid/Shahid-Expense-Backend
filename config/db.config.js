// const mongoose = require('mongoose');

// /**
//  * Connect to MongoDB.
//  * Exits process on failure so nodemon restarts cleanly.
//  */
// const connectDB = async () => {
//   try {
//     const conn = await mongoose.connect(process.env.MONGO_URI);
//     console.log(`✅ MongoDB connected: ${conn.connection.host}`);
//   } catch (error) {
//     console.error(`❌ MongoDB connection failed: ${error.message}`);
//     process.exit(1);
//   }
// };

// module.exports = connectDB;

const mongoose = require('mongoose');

/**
 * Global cached connection.
 * In serverless (Vercel), the Node.js process may be reused between
 * invocations ("warm start"). Caching the connection here ensures we
 * reuse it instead of opening a new one on every request.
 *
 * The database name is taken from MONGO_URI (the segment after `.net/`).
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  /* If we already have a live connection, reuse it */
  if (cached.conn) {
    return cached.conn;
  }

  /* If a connection is already in-flight, wait for it */
  if (!cached.promise) {
    const opts = {
      serverSelectionTimeoutMS: 10000,
      /* Serverless-friendly pool size — keep it small */
      maxPoolSize: 5,
      bufferCommands: false
    };

    cached.promise = mongoose.connect(process.env.MONGO_URI, opts).then((m) => {
      console.log(`✅ MongoDB connected: ${m.connection.host}`);
      console.log(`📦 Using database: ${m.connection.name}`);
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    /* On failure, clear the promise so the next request retries */
    cached.promise = null;
    console.error(`❌ MongoDB connection failed: ${error.message}`);
    throw error;
  }

  return cached.conn;
};

module.exports = connectDB;