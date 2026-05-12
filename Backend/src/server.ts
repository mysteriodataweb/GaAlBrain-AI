import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import fs from 'fs';
import { initDatabase } from './db/database';
import { isMemoryMode, setMemoryMode } from './config/runtime';
import { optionalAuth } from './middleware/auth.middleware';
import { upload } from './middleware/upload.middleware';
import reportRoutes from './routes/report.routes';
import sessionRoutes from './routes/session.routes';
import uploadRoutes from './routes/upload.routes';
import userRoutes from './routes/user.routes';

dotenv.config();


const app = express();
const port = Number(process.env.PORT || 3001);
const uploadDir = process.env.UPLOAD_DIR || './uploads';

fs.mkdirSync(uploadDir, { recursive: true });

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim());

const hasRealKey = (value: string | undefined, placeholder: string) =>
  Boolean(value && value !== placeholder && !value.startsWith('your_') && !value.includes('xxxxxxxx'));

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(optionalAuth);

app.use('/api/users', userRoutes);
app.use('/api/sessions', upload.single('file'), sessionRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/reports', reportRoutes);

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    llm: {
      primary: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      fallback: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
      groqConfigured: hasRealKey(process.env.GROQ_API_KEY, 'gsk_xxxxxxxxxxxxxxxx'),
      geminiConfigured: hasRealKey(process.env.GEMINI_API_KEY, 'AIzaxxxxxxxxxxxxxxxx')
    },
    db: 'MySQL'
  });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(400).json({ error: err.message });
});

const startServer = async () => {
  try {
    let memoryMode = isMemoryMode();
    if (!memoryMode) {
      try {
        await initDatabase();
      } catch (error) {
        console.error('❌ DB init failed, switching to memory mode:', error);
        setMemoryMode(true);
        memoryMode = true;
      }
    }

    if (memoryMode) {
      console.warn('⚠️  Memory mode actif: stockage en memoire uniquement.');
    }
    app.listen(port, () => {
      console.log(`GaAlBrain IA Backend running on port ${port}`);
    });
  } catch (error) {
    console.error('❌ Failed to initialize backend:', error);
    process.exit(1);
  }
};

startServer();

export default app;
