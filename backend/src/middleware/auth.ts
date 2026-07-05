import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  companyId: string;
  firstName: string;
  lastName: string;
  warehouseId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token d\'authentification manquant' });
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'default_secret';

    let decoded: any;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      if ((err as Error).name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expiré', code: 'TOKEN_EXPIRED' });
      }
      return res.status(401).json({ message: 'Token invalide' });
    }

    const user = await prisma.users.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        role: true,
        company_id: true,
        first_name: true,
        last_name: true,
        is_active: true,
        default_warehouse_id: true,
      },
    });

    if (!user || !user.is_active) {
      return res.status(401).json({ message: 'Utilisateur inactif ou introuvable' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      companyId: user.company_id || '',
      firstName: user.first_name,
      lastName: user.last_name,
      warehouseId: user.default_warehouse_id || undefined,
    };

    next();
  } catch (error) {
    logger.error('Erreur middleware auth:', error);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Non authentifié' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Accès refusé - permissions insuffisantes' });
    }
    next();
  };
};

export const requireAdmin = requireRole('admin');
export const requireManager = requireRole('admin', 'manager');
