import type { Response } from 'express';
import type { ApiResponse } from '../types/index.js';

export function sendSuccess<T>(
  res: Response,
  data: T,
  message: string = 'Success',
  statusCode: number = 200
): void {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  };
  res.status(statusCode).json(response);
}

export function sendError(
  res: Response,
  error: string,
  statusCode: number = 500,
  details?: any
): void {
  const response: ApiResponse<null> = {
    success: false,
    error,
    message: error,
    timestamp: new Date().toISOString(),
  };
  res.status(statusCode).json(response);
}
