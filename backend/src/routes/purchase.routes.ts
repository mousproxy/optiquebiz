import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { asyncHandler, AppError } from '../middleware/errorHandler';

const router = Router();

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;
  const { status, page = '1', limit = '20' } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const where: any = { company_id: companyId, ...(status && { status: status as any }) };

  const [orders, total] = await Promise.all([
    prisma.purchase_orders.findMany({
      where,
      skip,
      take: parseInt(limit as string),
      include: {
        suppliers: { select: { name: true, phone: true } },
        _count: { select: { purchase_order_items: true } },
      },
      orderBy: { created_at: 'desc' },
    }),
    prisma.purchase_orders.count({ where }),
  ]);

  res.json({ data: orders, pagination: { total, page: parseInt(page as string), limit: parseInt(limit as string), totalPages: Math.ceil(total / parseInt(limit as string)) } });
}));

router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const order = await prisma.purchase_orders.findFirst({
    where: { id: req.params.id, company_id: req.user!.companyId },
    include: {
      suppliers: true,
      purchase_order_items: true,
      purchase_receptions: { include: { purchase_reception_items: true } },
    },
  });
  if (!order) throw new AppError('Commande introuvable', 404);
  res.json(order);
}));

router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;
  const { items, ...orderData } = req.body;

  const refQuery = await prisma.$queryRaw<any[]>`SELECT get_next_sequence(${companyId}::uuid, 'purchase_order') as ref`;
  const reference = refQuery[0]?.ref || `CMD-${Date.now()}`;

  const total = items?.reduce((sum: number, i: any) => sum + i.quantity_ordered * i.unit_price, 0) || 0;

  const order = await prisma.purchase_orders.create({
    data: {
      ...orderData,
      company_id: companyId,
      reference,
      total_amount: total,
      remaining_amount: total,
      created_by: req.user!.id,
      purchase_order_items: { create: items?.map((i: any, idx: number) => ({ ...i, line_number: idx + 1, total_price: i.quantity_ordered * i.unit_price })) },
    },
    include: { purchase_order_items: true },
  });

  res.status(201).json(order);
}));

router.patch('/:id/status', asyncHandler(async (req: Request, res: Response) => {
  const order = await prisma.purchase_orders.update({
    where: { id: req.params.id },
    data: { status: req.body.status, updated_at: new Date() },
  });
  res.json(order);
}));

export default router;
