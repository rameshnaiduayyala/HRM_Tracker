import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import v1Router from './api/v1';
import legacyRouter from './api/legacy';
import { swaggerDocument } from './config/swagger';
import { prisma } from './shared/database';
import { landingHtml } from './shared/templates/landingHtml';
import { errorHandler } from './shared/middlewares/errorHandler';

import path from 'path';

const app = express();

// Secure app by setting various HTTP headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// Enable CORS
app.use(cors());

// Parse incoming request JSON payloads (increased for base64 screens)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static uploaded screenshots
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Standard healthcheck route checking database connectivity
app.get('/health', async (_req, res) => {
  try {
    // Execute a simple query to verify connection to PostgreSQL
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date(),
    });
  } catch (error: any) {
    res.status(503).json({
      status: 'error',
      database: 'disconnected',
      error: error.message || 'Database connection error',
      timestamp: new Date(),
    });
  }
});

// Root welcome route
app.get('/', (_req, res) => {
  res.status(200).send(landingHtml);
});

// Swagger UI Route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Route mapping
app.use('/api/v1', v1Router);
app.use('/api/legacy', legacyRouter);

// Global Error Handler
app.use(errorHandler);

export default app;
