import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { asyncHandler, AppError } from '../middleware/errorHandler';

const router = Router();

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;
  const { page = '1', limit = '20', status, search, startDate, endDate } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const where: any = {
    company_id: companyId,
    ...(status && { status: status as any }),
    ...(startDate && endDate && {
      sale_date: {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      },
    }),
  };

  if (search) {
    const s = search as string;
    where.OR = [
      { reference: { contains: s, mode: 'insensitive' } },
      { patients: { OR: [
        { first_name: { contains: s, mode: 'insensitive' } },
        { last_name: { contains: s, mode: 'insensitive' } },
      ]}},
    ];
  }

  const [sales, total] = await Promise.all([
    prisma.sales.findMany({
      where,
      skip,
      take: parseInt(limit as string),
      include: {
        patients: { select: { first_name: true, last_name: true, phone: true } },
        users_sales_seller_idTousers: { select: { first_name: true, last_name: true } },
        payments: { select: { amount: true, method: true } },
        _count: { select: { sale_items: true } },
      },
      orderBy: { created_at: 'desc' },
    }),
    prisma.sales.count({ where }),
  ]);

  res.json({
    data: sales,
    pagination: {
      total,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      totalPages: Math.ceil(total / parseInt(limit as string)),
    },
  });
}));

router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const companyId = req.user!.companyId;

  const sale = await prisma.sales.findFirst({
    where: { id, company_id: companyId },
    include: {
      patients: true,
      prescriptions: true,
      sale_items: true,
      payments: true,
      users_sales_seller_idTousers: { select: { first_name: true, last_name: true } },
      users_sales_cashier_idTousers: { select: { first_name: true, last_name: true } },
    },
  });

  if (!sale) throw new AppError('Vente introuvable', 404);
  res.json(sale);
}));

router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;
  const { items, payments: paymentData, ...saleData } = req.body;

  // Générer référence
  const refQuery = await prisma.$queryRaw<any[]>`
    SELECT get_next_sequence(${companyId}::uuid, 'sale') as ref
  `;
  const reference = refQuery[0]?.ref || `FAC-${Date.now()}`;

  // Calculer totaux
  let subtotal = 0;
  const saleItems = items.map((item: any, idx: number) => {
    const total = item.quantity * item.unit_price * (1 - (item.discount_percent || 0) / 100);
    subtotal += total;
    return { ...item, line_number: idx + 1, total_price: total };
  });

  const discountAmount = subtotal * (saleData.discount_percent || 0) / 100;
  const totalAmount = subtotal - discountAmount;
  const paidAmount = paymentData?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0;
  const remainingAmount = totalAmount - paidAmount;

  const sale = await prisma.$transaction(async (tx) => {
    const newSale = await tx.sales.create({
      data: {
        ...saleData,
        company_id: companyId,
        reference,
        subtotal,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        paid_amount: paidAmount,
        remaining_amount: remainingAmount,
        status: remainingAmount <= 0 ? 'completed' : paidAmount > 0 ? 'partial' : 'pending',
        seller_id: saleData.seller_id || req.user!.id,
        cashier_id: req.user!.id,
        created_by: req.user!.id,
        sale_items: {
          create: saleItems,
        },
      },
      include: { sale_items: true },
    });

    if (paymentData?.length > 0) {
      await tx.payments.createMany({
        data: paymentData.map((p: any) => ({
          ...p,
          company_id: companyId,
          sale_id: newSale.id,
          cashier_id: req.user!.id,
          reference: `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        })),
      });
    }

    // Mettre à jour le stock
    for (const item of saleItems) {
      if (item.product_type === 'frame') {
        await tx.frames.update({
          where: { id: item.product_id },
          data: { stock_quantity: { decrement: item.quantity } },
        });
      } else if (item.product_type === 'lens') {
        await tx.lenses.update({
          where: { id: item.product_id },
          data: { stock_quantity: { decrement: item.quantity } },
        });
      } else if (item.product_type === 'contact_lens') {
        await tx.contact_lenses.update({
          where: { id: item.product_id },
          data: { stock_quantity: { decrement: item.quantity } },
        });
      } else if (item.product_type === 'accessory') {
        await tx.accessories.update({
          where: { id: item.product_id },
          data: { stock_quantity: { decrement: item.quantity } },
        });
      }
    }

    return newSale;
  });

  res.status(201).json(sale);
}));

router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = req.body;

  const sale = await prisma.sales.update({
    where: { id },
    data: { ...data, updated_at: new Date() },
  });

  res.json(sale);
}));

router.post('/:id/payments', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const companyId = req.user!.companyId;
  const { amount, method, notes, transactionRef } = req.body;

  const sale = await prisma.sales.findFirst({ where: { id, company_id: companyId } });
  if (!sale) throw new AppError('Vente introuvable', 404);

  const payment = await prisma.$transaction(async (tx) => {
    const pay = await tx.payments.create({
      data: {
        company_id: companyId,
        sale_id: id,
        amount,
        method,
        notes,
        transaction_ref: transactionRef,
        cashier_id: req.user!.id,
        reference: `PAY-${Date.now()}`,
      },
    });

    const newPaid = Number(sale.paid_amount) + amount;
    const newRemaining = Number(sale.total_amount) - newPaid;

    await tx.sales.update({
      where: { id },
      data: {
        paid_amount: newPaid,
        remaining_amount: Math.max(0, newRemaining),
        status: newRemaining <= 0 ? 'completed' : 'partial',
        updated_at: new Date(),
      },
    });

    return pay;
  });

  res.status(201).json(payment);
}));

router.patch('/:id/ready', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const sale = await prisma.sales.update({
    where: { id },
    data: { is_ready: true, ready_date: new Date(), updated_at: new Date() },
  });
  res.json(sale);
}));

export default router;
