import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { asyncHandler } from '../middleware/errorHandler';
import { startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

const router = Router();

router.get('/sales-summary', asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;
  const { startDate, endDate, groupBy = 'day' } = req.query;

  const start = startDate ? new Date(startDate as string) : startOfMonth(new Date());
  const end = endDate ? new Date(endDate as string) : endOfMonth(new Date());

  const groupFormat = groupBy === 'month' ? 'YYYY-MM' : groupBy === 'year' ? 'YYYY' : 'YYYY-MM-DD';

  const data = await prisma.$queryRaw`
    SELECT
      TO_CHAR(sale_date, ${groupFormat}) as period,
      COUNT(*) as sales_count,
      SUM(total_amount) as revenue,
      SUM(paid_amount) as collected,
      SUM(remaining_amount) as pending,
      AVG(total_amount) as avg_sale
    FROM sales
    WHERE company_id = ${companyId}::uuid
      AND sale_date BETWEEN ${start} AND ${end}
      AND status IN ('completed', 'partial')
    GROUP BY TO_CHAR(sale_date, ${groupFormat})
    ORDER BY period ASC
  `;

  res.json(data);
}));

router.get('/top-products', asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;
  const { startDate, endDate, limit = '10' } = req.query;

  const start = startDate ? new Date(startDate as string) : startOfMonth(new Date());
  const end = endDate ? new Date(endDate as string) : endOfMonth(new Date());

  const data = await prisma.$queryRaw`
    SELECT
      si.product_type,
      si.product_name,
      COUNT(*) as sales_count,
      SUM(si.quantity) as total_quantity,
      SUM(si.total_price) as total_revenue
    FROM sale_items si
    JOIN sales s ON s.id = si.sale_id
    WHERE s.company_id = ${companyId}::uuid
      AND s.sale_date BETWEEN ${start} AND ${end}
      AND s.status IN ('completed', 'partial')
    GROUP BY si.product_type, si.product_name
    ORDER BY total_revenue DESC
    LIMIT ${parseInt(limit as string)}
  `;

  res.json(data);
}));

router.get('/top-patients', asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;
  const { startDate, endDate, limit = '10' } = req.query;

  const start = startDate ? new Date(startDate as string) : startOfYear(new Date());
  const end = endDate ? new Date(endDate as string) : endOfYear(new Date());

  const data = await prisma.$queryRaw`
    SELECT
      p.id,
      p.first_name,
      p.last_name,
      p.phone,
      COUNT(s.id) as purchase_count,
      SUM(s.total_amount) as total_spent
    FROM patients p
    JOIN sales s ON s.patient_id = p.id
    WHERE s.company_id = ${companyId}::uuid
      AND s.sale_date BETWEEN ${start} AND ${end}
      AND s.status IN ('completed', 'partial')
    GROUP BY p.id, p.first_name, p.last_name, p.phone
    ORDER BY total_spent DESC
    LIMIT ${parseInt(limit as string)}
  `;

  res.json(data);
}));

router.get('/stock-report', asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;

  const [frames, lenses, contactLenses, accessories] = await Promise.all([
    prisma.frames.findMany({
      where: { company_id: companyId, is_active: true },
      include: { brands: { select: { name: true } } },
      orderBy: { stock_quantity: 'asc' },
    }),
    prisma.lenses.findMany({ where: { company_id: companyId, is_active: true }, orderBy: { stock_quantity: 'asc' } }),
    prisma.contact_lenses.findMany({ where: { company_id: companyId, is_active: true }, orderBy: { stock_quantity: 'asc' } }),
    prisma.accessories.findMany({ where: { company_id: companyId, is_active: true }, orderBy: { stock_quantity: 'asc' } }),
  ]);

  res.json({ frames, lenses, contactLenses, accessories });
}));

router.get('/cash-report', asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;
  const { startDate, endDate } = req.query;

  const start = startDate ? new Date(startDate as string) : startOfMonth(new Date());
  const end = endDate ? new Date(endDate as string) : endOfMonth(new Date());

  const payments = await prisma.payments.groupBy({
    by: ['method'],
    where: {
      company_id: companyId,
      payment_date: { gte: start, lte: end },
    },
    _sum: { amount: true },
    _count: { id: true },
  });

  const totalRevenue = await prisma.sales.aggregate({
    where: { company_id: companyId, sale_date: { gte: start, lte: end }, status: { in: ['completed', 'partial'] } },
    _sum: { total_amount: true, paid_amount: true, remaining_amount: true },
  });

  res.json({ payments, totals: totalRevenue._sum });
}));

export default router;
