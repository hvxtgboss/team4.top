import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { errorHandler, notFound } from './middleware/error';

import authRoutes from './routes/auth';
import groupRoutes from './routes/groups';
import materialRoutes from './routes/materials';
import qaRoutes from './routes/qa';
import tutorRoutes from './routes/tutor';
import schoolRoutes from './routes/schools';
import orderRoutes from './routes/orders';
import adminRoutes from './routes/admin';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

  app.use('/api/auth', authRoutes);
  app.use('/api/groups', groupRoutes);
  app.use('/api/materials', materialRoutes);
  app.use('/api/qa', qaRoutes);
  app.use('/api/tutor', tutorRoutes);
  app.use('/api/schools', schoolRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/admin', adminRoutes);

  app.get('/api/health', (_req, res) => {
    res.json({
      code: 200,
      message: '服务正常运行',
      data: { timestamp: new Date().toISOString() },
    });
  });

  const staticDir = process.env.STATIC_DIR;
  if (staticDir) {
    app.use(express.static(staticDir));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
        return next();
      }
      res.sendFile(path.join(staticDir, 'index.html'), (err) => {
        if (err) next();
      });
    });
  }

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
