import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error('[Error]', err.message);

  res.status(500).json({
    error: 'internal_error',
    message: process.env.APP_ENV === 'development' ? err.message : 'Something went wrong',
  });
}
