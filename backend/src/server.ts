import 'dotenv/config';
import app from './app.js';
import { checkDatabaseConnection } from './services/prisma.service.js';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;

async function startServer() {
  console.log('----------------------------------------------------');
  console.log(' MedPulse Backend Resilience Platform Initializing ');
  console.log('----------------------------------------------------');

  const dbCheck = await checkDatabaseConnection();
  if (dbCheck.isConnected) {
    console.log('✓ PostgreSQL Database: Connected successfully');
  } else {
    console.warn(`⚠️ PostgreSQL Database Warning: ${dbCheck.error}`);
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`✓ MedPulse API Server listening on: http://localhost:${PORT}`);
    console.log(`✓ Health Endpoint: http://localhost:${PORT}/api/health`);
    console.log(`✓ PHCs Endpoint: http://localhost:${PORT}/api/phcs`);
    console.log(`✓ Medicines Endpoint: http://localhost:${PORT}/api/medicines`);
    console.log(`✓ Transfers Endpoint: http://localhost:${PORT}/api/transfers/recommendations`);
    console.log('----------------------------------------------------');
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log('\nShutting down MedPulse backend server...');
    server.close(() => {
      console.log('MedPulse backend server closed.');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startServer();
