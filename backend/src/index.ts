import dotenv from 'dotenv';
import { createApp } from './app';
import { initDatabase } from './utils/init-db';

dotenv.config();

const PORT = process.env.PORT || 3001;

async function startServer() {
  await initDatabase();
  const app = createApp();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`API health check: http://localhost:${PORT}/api/health`);
  });
}

startServer();
