import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { asyncHandler, AppError } from '../middleware/errorHandler';

const router = Router();

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;
  const { search } = req.query;

  const where: any = { company_id: companyId, is_active: true };
  if (search) {
    where.OR = [
      { name: { contains: search as string, mode: 'insensitive' } },
      { email: { contains: search as string, mode: 'insensitive' } },
      { phone: { contains: search as string } },
    ];
  }

  const suppliers = await prisma.suppliers.findMany({
    where,
    include: {
      _count: { select: { purchase_orders: true } },
    },
    orderBy: { name: 'asc' },
  });

  res.json(suppliers);
}));

router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const supplier = await prisma.suppliers.findFirst({
    where: { id: req.params.id, company_id: req.user!.companyId },
    include: {
      purchase_orders: { orderBy: { order_date: 'desc' }, take: 10 },
    },
  });
  if (!supplier) throw new AppError('Fournisseur introuvable', 404);
  res.json(supplier);
}));

router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;
  const refQuery = await prisma.$queryRaw<any[]>`SELECT get_next_sequence(${companyId}::uuid, 'supplier') as code`;
  const code = refQuery[0]?.code || `FOUR-${Date.now()}`;

  const supplier = await prisma.suppliers.create({ data: { ...req.body, code, company_id: companyId } });
  res.status(201).json(supplier);
}));

router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const supplier = await prisma.suppliers.update({ where: { id: req.params.id }, data: { ...req.body, updated_at: new Date() } });
  res.json(supplier);
}));

router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  await prisma.suppliers.update({ where: { id: req.params.id }, data: { is_active: false } });
  res.json({ message: 'Fournisseur archivé' });
}));

export default router;
