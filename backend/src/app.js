import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';

dotenv.config();

const app = express();

const rawOrigins = process.env.CORS_ORIGIN || '*';
const allowedOrigins = rawOrigins.split(',').map((o) => o.trim()).filter(Boolean);
if (!allowedOrigins.length) allowedOrigins.push('*');

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS_NOT_ALLOWED:${origin}`));
  },
  credentials: true,
}));
app.use(helmet());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Rate limit: skip in local/dev to avoid 429 during testing
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV !== 'production',
});
app.use(limiter);

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'teampulse-backend' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', userRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api', messageRoutes);
app.use('/api', notificationRoutes);
app.use('/api', analyticsRoutes);

// Centralized error handler placeholder
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({ success: false, error: { code: err.code || 'INTERNAL_ERROR', message: err.message || 'Something went wrong' } });
});

export default app;
