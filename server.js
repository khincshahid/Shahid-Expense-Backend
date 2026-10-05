// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');

// const connectDB = require('./config/db.config');
// const authRoute = require('./route/auth.route');
// const categoryRoute = require('./route/category.route');
// const transactionRoute = require('./route/transaction.route');

// const app = express();

// /* -------------------- Middleware -------------------- */
// app.use(cors());
// app.use(express.json({ limit: '5mb' }));

// /* -------------------- Routes -------------------- */
// app.get('/api/health', (req, res) => {
//   res.status(200).json({ status: 'ok', service: 'Shahid Expense API' });
// });

// app.use('/api/auth', authRoute);
// app.use('/api/categories', categoryRoute);
// app.use('/api/transactions', transactionRoute);

// /* -------------------- 404 Handler -------------------- */
// app.use((req, res) => {
//   res.status(404).json({ message: `Route ${req.originalUrl} not found` });
// });

// /* -------------------- Boot -------------------- */
// const PORT = process.env.PORT || 5000;

// connectDB().then(() => {
//   app.listen(PORT, () => {
//     console.log(`🚀 Server running on http://localhost:${PORT}`);
//   });
// });

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const connectDB = require('./config/db.config');
const authRoute = require('./route/auth.route');
const categoryRoute = require('./route/category.route');
const transactionRoute = require('./route/transaction.route');

const app = express();

/* -------------------- Middleware -------------------- */
app.use(cors());
app.use(express.json({ limit: '5mb' }));

/* -------------------- Public routes (no DB needed) -------------------- */
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'Shahid Expense API',
    status: 'running'
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'Shahid Expense API' });
});

/* -------------------- DB Connection Middleware -------------------- */
/* On Vercel (serverless), there is no long-running startup phase.
   Every request must ensure the DB is connected before running a query.
   Thanks to the cached connection in db.config.js, only the first request
   actually opens a connection — the rest reuse it instantly. */
app.use('/api', async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('❌ DB connect error on route:', req.originalUrl, error.message);
    return res.status(500).json({
      message: 'Database connection failed',
      detail: error.message
    });
  }
});

/* -------------------- Routes -------------------- */
app.use('/api/auth', authRoute);
app.use('/api/categories', categoryRoute);
app.use('/api/transactions', transactionRoute);

/* -------------------- 404 Handler -------------------- */
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

/* -------------------- Local development listener -------------------- */
/* On Vercel, `app.listen` is not called — the platform handles the
   request/response cycle. Locally, we start the server ourselves. */
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;

  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      console.error('❌ Failed to start server:', err.message);
      process.exit(1);
    });
}

/* -------------------- Export for Vercel -------------------- */
module.exports = app;