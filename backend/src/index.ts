import dotenv from 'dotenv';
dotenv.config();

import { createServer } from 'http';
import app from './app';
import { logger } from './utils/logger';
import { prisma } from './config/database';

const PORT = parseInt(process.env.PORT || '5000', 10);

const server = createServer(app);

async function startServer() {
  try {
    await prisma.$connect();
    logger.info('✅ Connexion base de données établie');

    server.listen(PORT, () => {
      logger.info(`🚀 OptiGest API démarré sur le port ${PORT}`);
      logger.info(`📖 Documentation: http://localhost:${PORT}/api/docs`);
      logger.info(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('❌ Erreur de démarrage:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  logger.info('SIGTERM reçu, arrêt gracieux...');
  await prisma.$disconnect();
  server.close(() => {
    logger.info('Serveur arrêté');
    process.exit(0);
  });
});

process.on('unhandledRejection', (reason: unknown) => {
  logger.error('Promesse non gérée:', reason);
});

startServer();
