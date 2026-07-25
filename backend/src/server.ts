import dotenv from 'dotenv';
// Load environment variables
dotenv.config();

import http from 'http';
import app from './app';
import { logger } from './shared/logger';
import { initSocket } from './infrastructure/socket';

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
initSocket(server);

server.listen(PORT, () => {
  logger.info(`Server is running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

process.on('unhandledRejection', (err: Error) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => {
    process.exit(1);
  });
});

