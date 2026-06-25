import { Request, Response, NextFunction } from 'express';
import { verifyToken, UserPayload } from '../services/auth.service';

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'unauthorized', message: 'Требуется авторизация' });
    return;
  }

  const token = authHeader.slice(7);
  const user = verifyToken(token);

  if (!user) {
    res.status(401).json({ error: 'token_invalid', message: 'Токен недействителен или истёк' });
    return;
  }

  req.user = user;
  next();
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    req.user = verifyToken(token) || undefined;
  }
  next();
}
