import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { requireManager } from '../middleware/auth';
import bcrypt from 'bcryptjs';

const router = Router();

router.get('/', requireManager, asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;

  const users = await prisma.users.findMany({
    where: { company_id: companyId },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      first_name: true,
      last_name: true,
      phone: true,
      avatar_url: true,
      is_active: true,
      last_login: true,
      created_at: true,
    },
    orderBy: [{ role: 'asc' }, { last_name: 'asc' }],
  });

  res.json(users);
}));

router.post('/', requireManager, asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;
  const { password, ...data } = req.body;

  const exists = await prisma.users.findUnique({ where: { email: data.email } });
  if (exists) throw new AppError('Cet email est déjà utilisé', 409);

  const hash = await bcrypt.hash(password || 'Optigest2024!', 12);

  const user = await prisma.users.create({
    data: {
      ...data,
      password_hash: hash,
      company_id: companyId,
      must_change_password: true,
    },
    select: { id: true, email: true, role: true, first_name: true, last_name: true, is_active: true },
  });

  res.status(201).json(user);
}));

router.put('/:id', requireManager, asyncHandler(async (req: Request, res: Response) => {
  const { password, ...data } = req.body;
  const updateData: any = { ...data, updated_at: new Date() };
  if (password) updateData.password_hash = await bcrypt.hash(password, 12);

  const user = await prisma.users.update({
    where: { id: req.params.id },
    data: updateData,
    select: { id: true, email: true, role: true, first_name: true, last_name: true, is_active: true },
  });

  res.json(user);
}));

router.patch('/:id/toggle', requireManager, asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.users.findUnique({ where: { id: req.params.id } });
  if (!user) throw new AppError('Utilisateur introuvable', 404);

  const updated = await prisma.users.update({
    where: { id: req.params.id },
    data: { is_active: !user.is_active },
    select: { id: true, is_active: true },
  });

  res.json(updated);
}));

router.get('/roles/doctors', asyncHandler(async (req: Request, res: Response) => {
  const doctors = await prisma.users.findMany({
    where: {
      company_id: req.user!.companyId,
      role: { in: ['ophthalmologist', 'optician'] },
      is_active: true,
    },
    select: { id: true, first_name: true, last_name: true, role: true },
    orderBy: { last_name: 'asc' },
  });
  res.json(doctors);
}));

export default router;
