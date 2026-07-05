import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;
  const { search, page = '1', limit = '20' } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const where: any = { company_id: companyId, is_active: true };
  if (search) {
    where.OR = [
      { name: { contains: search as string, mode: 'insensitive' } },
      { barcode: { contains: search as string } },
      { reference: { contains: search as string, mode: 'insensitive' } },
    ];
  }

  const [accessories, total] = await Promise.all([
    prisma.accessories.findMany({ where, skip, take: parseInt(limit as string), orderBy: { name: 'asc' } }),
    prisma.accessories.count({ where }),
  ]);

  res.json({ data: accessories, pagination: { total, page: parseInt(page as string), limit: parseInt(limit as string), totalPages: Math.ceil(total / parseInt(limit as string)) } });
}));

router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const acc = await prisma.accessories.create({ data: { ...req.body, company_id: req.user!.companyId } });
  res.status(201).json(acc);
}));

router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const acc = await prisma.accessories.update({ where: { id: req.params.id }, data: { ...req.body, updated_at: new Date() } });
  res.json(acc);
}));

router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  await prisma.accessories.update({ where: { id: req.params.id }, data: { is_active: false } });
  res.json({ message: 'Accessoire archivé' });
}));

export default router;
