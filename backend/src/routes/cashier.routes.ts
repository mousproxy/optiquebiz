import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { asyncHandler, AppError } from '../middleware/errorHandler';

const router = Router();

router.get('/registers', asyncHandler(async (req: Request, res: Response) => {
  const registers = await prisma.cash_registers.findMany({
    where: { company_id: req.user!.companyId, is_active: true },
    include: {
      cash_sessions: {
        where: { is_open: true },
        include: { users_cash_sessions_opened_byTousers: { select: { first_name: true, last_name: true } } },
        take: 1,
      },
    },
  });
  res.json(registers);
}));

router.post('/open', asyncHandler(async (req: Request, res: Response) => {
  const { registerId, openingAmount } = req.body;
  const companyId = req.user!.companyId;

  const existing = await prisma.cash_sessions.findFirst({ where: { register_id: registerId, is_open: true } });
  if (existing) throw new AppError('Cette caisse est déjà ouverte', 400);

  const sessionNum = `SES-${Date.now()}`;
  const session = await prisma.$transaction(async (tx) => {
    const sess = await tx.cash_sessions.create({
      data: {
        register_id: registerId,
        session_number: sessionNum,
        opening_amount: openingAmount,
        opened_by: req.user!.id,
        is_open: true,
      },
    });

    await tx.cash_registers.update({
      where: { id: registerId },
      data: { is_open: true, current_balance: openingAmount },
    });

    await tx.cash_movements.create({
      data: {
        session_id: sess.id,
        register_id: registerId,
        movement_type: 'opening',
        amount: openingAmount,
        balance_after: openingAmount,
        description: 'Ouverture de caisse',
        created_by: req.user!.id,
      },
    });

    return sess;
  });

  res.status(201).json(session);
}));

router.post('/close/:sessionId', asyncHandler(async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const { closingAmount, notes } = req.body;

  const session = await prisma.cash_sessions.findUnique({ where: { id: sessionId } });
  if (!session) throw new AppError('Session introuvable', 404);

  const movements = await prisma.cash_movements.aggregate({
    where: { session_id: sessionId },
    _sum: { amount: true },
  });

  const expectedAmount = Number(session.opening_amount) + Number(movements._sum.amount || 0);
  const difference = closingAmount - expectedAmount;

  await prisma.$transaction(async (tx) => {
    await tx.cash_sessions.update({
      where: { id: sessionId },
      data: {
        closing_amount: closingAmount,
        expected_amount: expectedAmount,
        difference,
        closed_by: req.user!.id,
        closed_at: new Date(),
        is_open: false,
        notes,
      },
    });

    await tx.cash_registers.update({
      where: { id: session.register_id ?? undefined },
      data: { is_open: false, current_balance: closingAmount },
    });
  });

  res.json({ message: 'Caisse fermée', expectedAmount, closingAmount, difference });
}));

router.get('/session/:sessionId/movements', asyncHandler(async (req: Request, res: Response) => {
  const movements = await prisma.cash_movements.findMany({
    where: { session_id: req.params.sessionId },
    include: { users: { select: { first_name: true, last_name: true } } },
    orderBy: { created_at: 'asc' },
  });
  res.json(movements);
}));

export default router;
