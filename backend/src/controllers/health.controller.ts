import type { Request, Response } from 'express';
import { checkDatabaseConnection } from '../services/prisma.service.js';
import { sendSuccess } from '../utils/response.js';

export async function getHealth(req: Request, res: Response) {
  const dbStatus = await checkDatabaseConnection();

  sendSuccess(
    res,
    {
      status: 'UP',
      service: 'MedPulse Backend API',
      database: dbStatus.isConnected ? 'Connected (PostgreSQL)' : `Disconnected (${dbStatus.error})`,
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    },
    'Health check operational'
  );
}
