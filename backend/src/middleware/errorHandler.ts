import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const statusCode = (err as AppError).statusCode || 500;
  const message = err.message || 'Erreur interne du serveur';

  if (process.env.NODE_ENV !== 'production') {
    logger.error(`${req.method} ${req.path} - ${statusCode}: ${message}`, {
      stack: err.stack,
      body: req.body,
    });
  } else if (statusCode >= 500) {
    logger.error(`${req.method} ${req.path} - ${statusCode}: ${message}`);
  }

  if ((err as any).code === 'P2002') {
    return res.status(409).json({ message: 'Cette entrée existe déjà (doublon)' });
  }
  if ((err as any).code === 'P2025') {
    return res.status(404).json({ message: 'Enregistrement introuvable' });
  }
  if ((err as any).code === 'P2003') {
    return res.status(400).json({ message: 'Contrainte de clé étrangère violée' });
  }

  res.status(statusCode).json({
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
