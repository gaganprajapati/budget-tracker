import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import apiRouter from './routes/api.js';
import { env } from './config/env.config.js';

const app: Express = express();
const PORT: number = env.PORT;

app.use(helmet());
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'budget-tracker-backend',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api', apiRouter);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled Error:', err);

  const message = err instanceof Error ? err.message : 'Internal Server Error';
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message,
    },
  });
});

if (env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

export default app;
