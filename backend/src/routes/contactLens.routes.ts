import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;
  const lenses = await prisma.contact_lenses.findMany({
    where: { company_id: companyId, is_active: true },
    include: { brands: { select: { name: true } } },
    orderBy: { name: 'asc' },
  });
  res.json(lenses);
}));

router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const lens = await prisma.contact_lenses.create({ data: { ...req.body, company_id: req.user!.companyId } });
  res.status(201).json(lens);
}));

router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const lens = await prisma.contact_lenses.update({ where: { id: req.params.id }, data: { ...req.body, updated_at: new Date() } });
  res.json(lens);
}));

router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  await prisma.contact_lenses.update({ where: { id: req.params.id }, data: { is_active: false } });
  res.json({ message: 'Lentille archivée' });
}));

export default router;
