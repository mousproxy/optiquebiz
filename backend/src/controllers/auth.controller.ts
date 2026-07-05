import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const generateToken = (userId: string) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  } as jwt.SignOptions);
};

const generateRefreshToken = (userId: string) => {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET || 'refresh_secret', {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  } as jwt.SignOptions);
};

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError('Email et mot de passe requis', 400);
  }

  const user = await prisma.users.findUnique({
    where: { email: email.toLowerCase().trim() },
    include: {
      companies: {
        select: { id: true, name: true, currency: true, logo_url: true },
      },
      warehouses: {
        select: { id: true, name: true },
      },
    },
  });

  if (!user) {
    throw new AppError('Email ou mot de passe incorrect', 401);
  }

  if (!user.is_active) {
    throw new AppError('Compte désactivé. Contactez l\'administrateur.', 401);
  }

  if (user.locked_until && new Date() < user.locked_until) {
    throw new AppError('Compte temporairement bloqué. Réessayez plus tard.', 401);
  }

  const isValidPassword = await bcrypt.compare(password, user.password_hash);

  if (!isValidPassword) {
    const attempts = (user.login_attempts || 0) + 1;
    const lockUntil = attempts >= 5 ? new Date(Date.now() + 30 * 60 * 1000) : null;

    await prisma.users.update({
      where: { id: user.id },
      data: {
        login_attempts: attempts,
        ...(lockUntil && { locked_until: lockUntil }),
      },
    });

    if (attempts >= 5) {
      throw new AppError('Compte bloqué pour 30 minutes suite à trop de tentatives.', 401);
    }

    throw new AppError('Email ou mot de passe incorrect', 401);
  }

  await prisma.users.update({
    where: { id: user.id },
    data: {
      login_attempts: 0,
      locked_until: null,
      last_login: new Date(),
      last_login_ip: req.ip,
    },
  });

  // Audit log
  await prisma.audit_logs.create({
    data: {
      company_id: user.company_id,
      user_id: user.id,
      user_name: `${user.first_name} ${user.last_name}`,
      action: 'LOGIN',
      description: 'Connexion réussie',
      ip_address: req.ip,
      user_agent: req.get('user-agent'),
    },
  });

  const token = generateToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  res.json({
    token,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      avatarUrl: user.avatar_url,
      mustChangePassword: user.must_change_password,
      company: user.companies,
      warehouse: user.warehouses,
    },
  });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  if (req.user) {
    await prisma.audit_logs.create({
      data: {
        company_id: req.user.companyId,
        user_id: req.user.id,
        user_name: `${req.user.firstName} ${req.user.lastName}`,
        action: 'LOGOUT',
        description: 'Déconnexion',
        ip_address: req.ip,
      },
    });
  }
  res.json({ message: 'Déconnecté avec succès' });
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    throw new AppError('Token de rafraîchissement manquant', 400);
  }

  let decoded: any;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'refresh_secret');
  } catch {
    throw new AppError('Token de rafraîchissement invalide', 401);
  }

  const user = await prisma.users.findUnique({ where: { id: decoded.id } });
  if (!user || !user.is_active) {
    throw new AppError('Utilisateur introuvable ou inactif', 401);
  }

  const newToken = generateToken(user.id);
  const newRefreshToken = generateRefreshToken(user.id);

  res.json({ token: newToken, refreshToken: newRefreshToken });
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user!.id;

  const user = await prisma.users.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('Utilisateur introuvable', 404);

  const isValid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isValid) throw new AppError('Mot de passe actuel incorrect', 400);

  if (newPassword.length < 8) {
    throw new AppError('Le nouveau mot de passe doit contenir au moins 8 caractères', 400);
  }

  const hash = await bcrypt.hash(newPassword, 12);
  await prisma.users.update({
    where: { id: userId },
    data: { password_hash: hash, must_change_password: false },
  });

  res.json({ message: 'Mot de passe modifié avec succès' });
});

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.users.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
      first_name: true,
      last_name: true,
      phone: true,
      avatar_url: true,
      signature_url: true,
      two_factor_enabled: true,
      last_login: true,
      created_at: true,
      companies: { select: { id: true, name: true, currency: true, logo_url: true } },
      warehouses: { select: { id: true, name: true } },
    },
  });

  if (!user) throw new AppError('Utilisateur introuvable', 404);
  res.json(user);
});
