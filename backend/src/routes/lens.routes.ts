import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { asyncHandler, AppError } from '../middleware/errorHandler';

const router = Router();

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;
  const { search, page = '1', limit = '20', lensType } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const where: any = { company_id: companyId, is_active: true, ...(lensType && { lens_type: lensType as string }) };
  if (search) {
    where.OR = [
      { name: { contains: search as string, mode: 'insensitive' } },
      { reference: { contains: search as string, mode: 'insensitive' } },
      { brands: { name: { contains: search as string, mode: 'insensitive' } } },
    ];
  }

  const [lenses, total] = await Promise.all([
    prisma.lenses.findMany({ where, skip, take: parseInt(limit as string), include: { brands: { select: { name: true } } }, orderBy: { name: 'asc' } }),
    prisma.lenses.count({ where }),
  ]);

  res.json({ data: lenses, pagination: { total, page: parseInt(page as string), limit: parseInt(limit as string), totalPages: Math.ceil(total / parseInt(limit as string)) } });
}));

router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const lens = await prisma.lenses.create({ data: { ...req.body, company_id: req.user!.companyId } });
  res.status(201).json(lens);
}));

router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const lens = await prisma.lenses.update({ where: { id: req.params.id }, data: { ...req.body, updated_at: new Date() } });
  res.json(lens);
}));

router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  await prisma.lenses.update({ where: { id: req.params.id }, data: { is_active: false } });
  res.json({ message: 'Verre archivé' });
}));

export default router;
