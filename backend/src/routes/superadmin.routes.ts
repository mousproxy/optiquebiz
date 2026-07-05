import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { asyncHandler, AppError } from '../middleware/errorHandler';

const router = Router();

router.get('/companies', asyncHandler(async (_req: Request, res: Response) => {
  const companies = await prisma.companies.findMany({
    orderBy: { created_at: 'desc' },
    select: {
      id: true,
      name: true,
      is_active: true,
      created_at: true,
      subscriptions: {
        select: {
          status: true,
          trial_ends_at: true,
          current_period_end: true,
          plans: { select: { id: true, key: true, name: true } },
        },
      },
    },
  });
  res.json(companies);
}));

router.get('/plans', asyncHandler(async (_req: Request, res: Response) => {
  const plans = await prisma.plans.findMany({ where: { is_active: true }, orderBy: { price: 'asc' } });
  res.json(plans);
}));

router.patch('/companies/:id/subscription', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { planKey, status } = req.body;

  const company = await prisma.companies.findUnique({ where: { id } });
  if (!company) throw new AppError('Société introuvable', 404);

  const plan = planKey ? await prisma.plans.findUnique({ where: { key: planKey } }) : null;
  if (planKey && !plan) throw new AppError('Plan introuvable', 404);

  const subscription = await prisma.subscriptions.upsert({
    where: { company_id: id },
    update: {
      ...(plan && { plan_id: plan.id }),
      ...(status && { status }),
      updated_at: new Date(),
    },
    create: {
      company_id: id,
      plan_id: plan!.id,
      status: status || 'active',
    },
    include: { plans: true },
  });

  res.json(subscription);
}));

export default router;
