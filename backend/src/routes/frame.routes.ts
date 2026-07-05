import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { asyncHandler, AppError } from '../middleware/errorHandler';

const router = Router();

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;
  const { search, page = '1', limit = '20', brandId, gender, lowStock } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const where: any = {
    company_id: companyId,
    is_active: true,
    ...(brandId && { brand_id: brandId as string }),
    ...(gender && { gender: gender as string }),
    ...(lowStock === 'true' && { stock_quantity: { lte: prisma.frames.fields.min_stock } }),
  };

  if (search) {
    const s = search as string;
    where.OR = [
      { reference: { contains: s, mode: 'insensitive' } },
      { name: { contains: s, mode: 'insensitive' } },
      { barcode: { contains: s } },
      { brands: { name: { contains: s, mode: 'insensitive' } } },
    ];
  }

  const [frames, total] = await Promise.all([
    prisma.frames.findMany({
      where,
      skip,
      take: parseInt(limit as string),
      include: { brands: { select: { id: true, name: true } } },
      orderBy: [{ brands: { name: 'asc' } }, { reference: 'asc' }],
    }),
    prisma.frames.count({ where }),
  ]);

  res.json({ data: frames, pagination: { total, page: parseInt(page as string), limit: parseInt(limit as string), totalPages: Math.ceil(total / parseInt(limit as string)) } });
}));

router.get('/search', asyncHandler(async (req: Request, res: Response) => {
  const { q } = req.query;
  const companyId = req.user!.companyId;

  const frames = await prisma.frames.findMany({
    where: {
      company_id: companyId,
      is_active: true,
      OR: [
        { barcode: q as string },
        { reference: { contains: q as string, mode: 'insensitive' } },
        { name: { contains: q as string, mode: 'insensitive' } },
      ],
    },
    include: { brands: { select: { name: true } } },
    take: 10,
  });

  res.json(frames);
}));

router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const frame = await prisma.frames.findFirst({
    where: { id: req.params.id, company_id: req.user!.companyId },
    include: { brands: true },
  });
  if (!frame) throw new AppError('Monture introuvable', 404);
  res.json(frame);
}));

router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const data = req.body;
  const frame = await prisma.frames.create({
    data: { ...data, company_id: req.user!.companyId, created_by: req.user!.id },
  });
  res.status(201).json(frame);
}));

router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const frame = await prisma.frames.update({
    where: { id: req.params.id },
    data: { ...req.body, updated_at: new Date() },
  });
  res.json(frame);
}));

router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  await prisma.frames.update({ where: { id: req.params.id }, data: { is_active: false } });
  res.json({ message: 'Monture archivée' });
}));

export default router;
