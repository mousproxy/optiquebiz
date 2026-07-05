import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.get('/alerts', asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;

  const [frames, lenses, accessories] = await Promise.all([
    prisma.frames.findMany({
      where: { company_id: companyId, is_active: true },
      select: { id: true, reference: true, name: true, stock_quantity: true, min_stock: true, warehouse_id: true, brands: { select: { name: true } } },
    }).then(f => f.filter(x => (x.stock_quantity ?? 0) <= (x.min_stock ?? 0)).map(x => ({ ...x, product_type: 'frame', brand: x.brands?.name }))),
    prisma.lenses.findMany({
      where: { company_id: companyId, is_active: true },
      select: { id: true, reference: true, name: true, stock_quantity: true, min_stock: true, warehouse_id: true, brands: { select: { name: true } } },
    }).then(l => l.filter(x => (x.stock_quantity ?? 0) <= (x.min_stock ?? 0)).map(x => ({ ...x, product_type: 'lens', brand: x.brands?.name }))),
    prisma.accessories.findMany({
      where: { company_id: companyId, is_active: true },
      select: { id: true, reference: true, name: true, stock_quantity: true, min_stock: true, warehouse_id: true, brand_name: true },
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
    if (data.movement_type === 'transfer') {
      const source = await tx.stock_movements.create({
        data: {
          company_id: companyId,
          created_by: req.user!.id,
          product_type: data.product_type,
          product_id: data.product_id,
          warehouse_id: data.warehouse_id,
          warehouse_dest_id: data.warehouse_dest_id,
          movement_type: 'transfer',
          quantity: data.quantity,
          reason: data.reason,
        },
      });

      if (data.product_type === 'frame') {
        const original = await tx.frames.update({ where: { id: data.product_id }, data: { stock_quantity: { decrement: data.quantity } } });
        const dest = await tx.frames.findFirst({ where: { company_id: companyId, warehouse_id: data.warehouse_dest_id, reference: original.reference } });
        if (dest) {
          await tx.frames.update({ where: { id: dest.id }, data: { stock_quantity: { increment: data.quantity } } });
        } else {
          const { id, created_at, updated_at, barcode, photo_urls, margin_percent, ...rest } = original;
          await tx.frames.create({ data: { ...rest, warehouse_id: data.warehouse_dest_id, stock_quantity: data.quantity } });
        }
      } else if (data.product_type === 'lens') {
        const original = await tx.lenses.update({ where: { id: data.product_id }, data: { stock_quantity: { decrement: data.quantity } } });
        const dest = await tx.lenses.findFirst({ where: { company_id: companyId, warehouse_id: data.warehouse_dest_id, reference: original.reference } });
        if (dest) {
          await tx.lenses.update({ where: { id: dest.id }, data: { stock_quantity: { increment: data.quantity } } });
        } else {
          const { id, created_at, updated_at, barcode, ...rest } = original;
          await tx.lenses.create({ data: { ...rest, warehouse_id: data.warehouse_dest_id, stock_quantity: data.quantity } });
        }
      } else if (data.product_type === 'contact_lens') {
        const original = await tx.contact_lenses.update({ where: { id: data.product_id }, data: { stock_quantity: { decrement: data.quantity } } });
        const dest = await tx.contact_lenses.findFirst({ where: { company_id: companyId, warehouse_id: data.warehouse_dest_id, reference: original.reference } });
        if (dest) {
          await tx.contact_lenses.update({ where: { id: dest.id }, data: { stock_quantity: { increment: data.quantity } } });
        } else {
          const { id, created_at, updated_at, barcode, ...rest } = original;
          await tx.contact_lenses.create({ data: { ...rest, warehouse_id: data.warehouse_dest_id, stock_quantity: data.quantity } });
        }
      } else if (data.product_type === 'accessory') {
        const original = await tx.accessories.update({ where: { id: data.product_id }, data: { stock_quantity: { decrement: data.quantity } } });
        const dest = await tx.accessories.findFirst({ where: { company_id: companyId, warehouse_id: data.warehouse_dest_id, reference: original.reference } });
        if (dest) {
          await tx.accessories.update({ where: { id: dest.id }, data: { stock_quantity: { increment: data.quantity } } });
        } else {
          const { id, created_at, updated_at, barcode, ...rest } = original;
          await tx.accessories.create({ data: { ...rest, warehouse_id: data.warehouse_dest_id, stock_quantity: data.quantity } });
        }
      }

      return source;
    }

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
