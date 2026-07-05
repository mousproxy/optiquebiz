import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.get('/alerts', asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;

  const [frames, lenses, accessories] = await Promise.all([
    prisma.frames.findMany({
      where: { company_id: companyId, is_active: true },
      select: { id: true, reference: true, name: true, stock_quantity: true, min_stock: true, brands: { select: { name: true } } },
    }).then(f => f.filter(x => (x.stock_quantity ?? 0) <= (x.min_stock ?? 0)).map(x => ({ ...x, product_type: 'frame', brand: x.brands?.name }))),
    prisma.lenses.findMany({
      where: { company_id: companyId, is_active: true },
      select: { id: true, reference: true, name: true, stock_quantity: true, min_stock: true, brands: { select: { name: true } } },
    }).then(l => l.filter(x => (x.stock_quantity ?? 0) <= (x.min_stock ?? 0)).map(x => ({ ...x, product_type: 'lens', brand: x.brands?.name }))),
    prisma.accessories.findMany({
      where: { company_id: companyId, is_active: true },
      select: { id: true, reference: true, name: true, stock_quantity: true, min_stock: true, brand_name: true },
    }).then(a => a.filter(x => (x.stock_quantity ?? 0) <= (x.min_stock ?? 0)).map(x => ({ ...x, product_type: 'accessory', brand: x.brand_name }))),
  ]);

  res.json([...frames, ...lenses, ...accessories]);
}));

router.get('/movements', asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;
  const { page = '1', limit = '20', productType, movementType } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const where: any = {
    company_id: companyId,
    ...(productType && { product_type: productType as any }),
    ...(movementType && { movement_type: movementType as any }),
  };

  const [movements, total] = await Promise.all([
    prisma.stock_movements.findMany({
      where,
      skip,
      take: parseInt(limit as string),
      include: { users: { select: { first_name: true, last_name: true } } },
      orderBy: { created_at: 'desc' },
    }),
    prisma.stock_movements.count({ where }),
  ]);

  res.json({ data: movements, pagination: { total, page: parseInt(page as string), limit: parseInt(limit as string), totalPages: Math.ceil(total / parseInt(limit as string)) } });
}));

router.post('/movement', asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;
  const data = req.body;

  const movement = await prisma.$transaction(async (tx) => {
    const mov = await tx.stock_movements.create({
      data: { ...data, company_id: companyId, created_by: req.user!.id },
    });

    const qty = data.movement_type === 'in' ? data.quantity : -data.quantity;

    if (data.product_type === 'frame') {
      await tx.frames.update({ where: { id: data.product_id }, data: { stock_quantity: { increment: qty } } });
    } else if (data.product_type === 'lens') {
      await tx.lenses.update({ where: { id: data.product_id }, data: { stock_quantity: { increment: qty } } });
    } else if (data.product_type === 'contact_lens') {
      await tx.contact_lenses.update({ where: { id: data.product_id }, data: { stock_quantity: { increment: qty } } });
    } else if (data.product_type === 'accessory') {
      await tx.accessories.update({ where: { id: data.product_id }, data: { stock_quantity: { increment: qty } } });
    }

    return mov;
  });

  res.status(201).json(movement);
}));

router.get('/valuation', asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;

  const [framesVal, lensesVal, accVal] = await Promise.all([
    prisma.frames.aggregate({
      where: { company_id: companyId, is_active: true },
      _sum: { purchase_price: true, sale_price: true, stock_quantity: true },
    }),
    prisma.lenses.aggregate({
      where: { company_id: companyId, is_active: true },
      _sum: { purchase_price: true, sale_price: true, stock_quantity: true },
    }),
    prisma.accessories.aggregate({
      where: { company_id: companyId, is_active: true },
      _sum: { purchase_price: true, sale_price: true, stock_quantity: true },
    }),
  ]);

  res.json({
    frames: framesVal,
    lenses: lensesVal,
    accessories: accVal,
  });
}));

export default router;
