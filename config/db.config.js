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

/* -------------------------------------------------------------------------- */
/*                    Serverless-friendly cached connection                    */
/*  Vercel reuses warm containers. Caching on `global` means we don't open a   */
/*  new MongoDB connection on every request — we reuse the existing one.       */
/* -------------------------------------------------------------------------- */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  /* If we already have a live connection, reuse it */
  if (cached.conn) return cached.conn;

  /* If a connection is already in-flight, wait for that same promise */
  if (!cached.promise) {
    console.log('🔌 Connecting to MongoDB...');

    cached.promise = mongoose
      .connect(process.env.MONGO_URI, {
        /* Serverless-friendly options */
        bufferCommands: false,          // fail fast instead of buffering 10s
        serverSelectionTimeoutMS: 10000, // cap connection attempts at 10s
        maxPoolSize: 5                  // small pool for stateless functions
      })
      .then((m) => {
        console.log(`✅ MongoDB connected: ${m.connection.host}`);
        console.log(`📦 Using database: ${m.connection.name}`);
        return m;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    /* Reset the cached promise so the next request can retry */
    cached.promise = null;
    console.error(`❌ MongoDB connection failed: ${err.message}`);
    throw err;
  }

  return cached.conn;
};

module.exports = connectDB;