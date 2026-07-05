import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { asyncHandler } from '../middleware/errorHandler';
import { startOfDay, endOfDay, startOfMonth, endOfMonth, subDays, format } from 'date-fns';

export const getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;
  const today = new Date();
  const startDay = startOfDay(today);
  const endDay = endOfDay(today);
  const startMonth = startOfMonth(today);
  const endMonth = endOfMonth(today);

  const [
    todaySales,
    monthSales,
    todayAppointments,
    totalPatients,
    newPrescriptions,
    pendingOrders,
    stockAlerts,
    readyToPickup,
    pendingPayments,
  ] = await Promise.all([
    // CA du jour
    prisma.sales.aggregate({
      where: {
        company_id: companyId,
        sale_date: { gte: startDay, lte: endDay },
        status: { in: ['completed', 'partial'] },
      },
      _sum: { total_amount: true },
      _count: { id: true },
    }),
    // CA du mois
    prisma.sales.aggregate({
      where: {
        company_id: companyId,
        sale_date: { gte: startMonth, lte: endMonth },
        status: { in: ['completed', 'partial'] },
      },
      _sum: { total_amount: true },
      _count: { id: true },
    }),
    // Rendez-vous du jour
    prisma.appointments.count({
      where: {
        company_id: companyId,
        appointment_date: { gte: startDay, lte: endDay },
      },
    }),
    // Total patients
    prisma.patients.count({
      where: { company_id: companyId, is_active: true },
    }),
    // Nouvelles ordonnances ce mois
    prisma.prescriptions.count({
      where: {
        company_id: companyId,
        prescription_date: { gte: startMonth, lte: endMonth },
      },
    }),
    // Commandes fournisseurs en attente
    prisma.purchase_orders.count({
      where: {
        company_id: companyId,
        status: { in: ['sent', 'confirmed'] },
      },
    }),
    // Alertes stock
    prisma.$queryRaw`
      SELECT COUNT(*) as count FROM (
        SELECT id FROM frames WHERE company_id = ${companyId}::uuid AND stock_quantity <= min_stock AND is_active = true
        UNION ALL
        SELECT id FROM lenses WHERE company_id = ${companyId}::uuid AND stock_quantity <= min_stock AND is_active = true
        UNION ALL
        SELECT id FROM accessories WHERE company_id = ${companyId}::uuid AND stock_quantity <= min_stock AND is_active = true
      ) t
    `,
    // Lunettes prêtes à récupérer
    prisma.sales.count({
      where: {
        company_id: companyId,
        is_ready: true,
        status: { in: ['pending', 'partial', 'completed'] },
      },
    }),
    // Paiements en attente
    prisma.sales.aggregate({
      where: {
        company_id: companyId,
        remaining_amount: { gt: 0 },
        status: { in: ['pending', 'partial'] },
      },
      _sum: { remaining_amount: true },
      _count: { id: true },
    }),
  ]);

  // Graphique CA des 30 derniers jours
  const salesChart = await prisma.sales.groupBy({
    by: ['sale_date'],
    where: {
      company_id: companyId,
      sale_date: { gte: subDays(today, 29) },
      status: { in: ['completed', 'partial'] },
    },
    _sum: { total_amount: true },
    _count: { id: true },
    orderBy: { sale_date: 'asc' },
  });

  // Top vendeurs du mois
  const topSellers = await prisma.sales.groupBy({
    by: ['seller_id'],
    where: {
      company_id: companyId,
      sale_date: { gte: startMonth, lte: endMonth },
      status: { in: ['completed', 'partial'] },
      seller_id: { not: null },
    },
    _sum: { total_amount: true },
    _count: { id: true },
    orderBy: { _sum: { total_amount: 'desc' } },
    take: 5,
  });

  // Enrichir les vendeurs avec leurs noms
  const sellerIds = topSellers.map(s => s.seller_id).filter(Boolean) as string[];
  const sellers = await prisma.users.findMany({
    where: { id: { in: sellerIds } },
    select: { id: true, first_name: true, last_name: true, avatar_url: true },
  });

  const topSellersEnriched = topSellers.map(s => ({
    ...s,
    seller: sellers.find(u => u.id === s.seller_id),
  }));

  // Rendez-vous du jour avec détails
  const todayAppointmentsList = await prisma.appointments.findMany({
    where: {
      company_id: companyId,
      appointment_date: { gte: startDay, lte: endDay },
    },
    include: {
      patients: { select: { id: true, first_name: true, last_name: true, phone: true } },
      users_appointments_doctor_idTousers: { select: { id: true, first_name: true, last_name: true } },
    },
    orderBy: { start_time: 'asc' },
    take: 10,
  });

  // Ventes récentes
  const recentSales = await prisma.sales.findMany({
    where: { company_id: companyId },
    include: {
      patients: { select: { first_name: true, last_name: true } },
      users_sales_seller_idTousers: { select: { first_name: true, last_name: true } },
    },
    orderBy: { created_at: 'desc' },
    take: 10,
  });

  // CA par mois sur 12 mois
  const monthlyRevenue = await prisma.$queryRaw<any[]>`
    SELECT
      TO_CHAR(sale_date, 'YYYY-MM') as month,
      SUM(total_amount) as revenue,
      COUNT(*) as count
    FROM sales
    WHERE company_id = ${companyId}::uuid
      AND status IN ('completed', 'partial')
      AND sale_date >= DATE_TRUNC('month', NOW() - INTERVAL '11 months')
    GROUP BY TO_CHAR(sale_date, 'YYYY-MM')
    ORDER BY month ASC
  `;

  const stockAlertCount = (stockAlerts as any[])[0]?.count || 0;

  res.json({
    stats: {
      todayRevenue: todaySales._sum.total_amount || 0,
      todaySalesCount: todaySales._count.id || 0,
      monthRevenue: monthSales._sum.total_amount || 0,
      monthSalesCount: monthSales._count.id || 0,
      todayAppointments,
      totalPatients,
      newPrescriptions,
      pendingOrders,
      stockAlerts: Number(stockAlertCount),
      readyToPickup,
      pendingPaymentsAmount: pendingPayments._sum.remaining_amount || 0,
      pendingPaymentsCount: pendingPayments._count.id || 0,
    },
    salesChart: salesChart.map(s => ({
      date: format(s.sale_date, 'dd/MM'),
      revenue: s._sum.total_amount || 0,
      count: s._count.id,
    })),
    monthlyRevenue,
    topSellers: topSellersEnriched,
    todayAppointments: todayAppointmentsList,
    recentSales,
  });
});
