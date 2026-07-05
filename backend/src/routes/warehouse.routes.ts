import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { asyncHandler, AppError } from '../middleware/errorHandler';

const router = Router();

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const warehouses = await prisma.warehouses.findMany({
    where: { company_id: req.user!.companyId, is_active: true },
    orderBy: { name: 'asc' },
  });
  res.json(warehouses);
}));

router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { code, name, address, city, phone, manager_name, is_default } = req.body;
  if (!code?.trim() || !name?.trim()) {
    throw new AppError('Code et nom sont requis', 400);
  }

  const warehouse = await prisma.warehouses.create({
    data: {
      company_id: req.user!.companyId,
      code: code.trim(),
      name: name.trim(),
      address,
      city,
      phone,
      manager_name,
      is_default: !!is_default,
    },
  });
  res.status(201).json(warehouse);
}));

router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const existing = await prisma.warehouses.findFirst({ where: { id: req.params.id, company_id: req.user!.companyId } });
  if (!existing) throw new AppError('Entrepôt introuvable', 404);

  const { code, name, address, city, phone, manager_name, is_default, is_active } = req.body;
  const warehouse = await prisma.warehouses.update({
    where: { id: req.params.id },
    data: { code, name, address, city, phone, manager_name, is_default, is_active, updated_at: new Date() },
  });
  res.json(warehouse);
}));

router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const existing = await prisma.warehouses.findFirst({ where: { id: req.params.id, company_id: req.user!.companyId } });
  if (!existing) throw new AppError('Entrepôt introuvable', 404);

  await prisma.warehouses.update({ where: { id: req.params.id }, data: { is_active: false } });
  res.json({ message: 'Entrepôt désactivé' });
}));

export default router;
