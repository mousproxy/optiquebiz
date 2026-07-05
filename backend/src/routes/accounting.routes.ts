import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.get('/accounts', asyncHandler(async (req: Request, res: Response) => {
  const accounts = await prisma.accounts.findMany({
    where: { company_id: req.user!.companyId, is_active: true },
    orderBy: { code: 'asc' },
  });
  res.json(accounts);
}));

router.get('/journal', asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', limit = '50', startDate, endDate } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const where: any = {
    company_id: req.user!.companyId,
    ...(startDate && endDate && { entry_date: { gte: new Date(startDate as string), lte: new Date(endDate as string) } }),
  };

  const [entries, total] = await Promise.all([
    prisma.journal_entries.findMany({
      where,
      skip,
      take: parseInt(limit as string),
      include: { journal_entry_lines: { include: { accounts: { select: { code: true, name: true } } } } },
      orderBy: { entry_date: 'desc' },
    }),
    prisma.journal_entries.count({ where }),
  ]);

  res.json({ data: entries, pagination: { total, page: parseInt(page as string), limit: parseInt(limit as string), totalPages: Math.ceil(total / parseInt(limit as string)) } });
}));

router.post('/journal', asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;
  const { lines, ...entryData } = req.body;

  const refQuery = await prisma.$queryRaw<any[]>`SELECT get_next_sequence(${companyId}::uuid, 'journal_entry') as ref`;
  const reference = refQuery[0]?.ref || `JNL-${Date.now()}`;

  const entry = await prisma.journal_entries.create({
    data: {
      ...entryData,
      company_id: companyId,
      reference,
      created_by: req.user!.id,
      period: entryData.entry_date?.substring(0, 7),
      journal_entry_lines: { create: lines?.map((l: any, idx: number) => ({ ...l, line_number: idx + 1 })) },
    },
    include: { journal_entry_lines: true },
  });

  res.status(201).json(entry);
}));

router.get('/balance', asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;

  const balance = await prisma.$queryRaw`
    SELECT
      a.code,
      a.name,
      a.account_type,
      COALESCE(SUM(jel.debit), 0) as total_debit,
      COALESCE(SUM(jel.credit), 0) as total_credit,
      COALESCE(SUM(jel.debit), 0) - COALESCE(SUM(jel.credit), 0) as balance
    FROM accounts a
    LEFT JOIN journal_entry_lines jel ON jel.account_id = a.id
    LEFT JOIN journal_entries je ON je.id = jel.entry_id AND je.company_id = ${companyId}::uuid
    WHERE a.company_id = ${companyId}::uuid AND a.is_active = true
    GROUP BY a.id, a.code, a.name, a.account_type
    ORDER BY a.code
  `;

  res.json(balance);
}));

export default router;
