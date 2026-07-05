import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.get('/campaigns', asyncHandler(async (req: Request, res: Response) => {
  const campaigns = await prisma.campaigns.findMany({
    where: { company_id: req.user!.companyId },
    include: { _count: { select: { campaign_recipients: true } } },
    orderBy: { created_at: 'desc' },
  });
  res.json(campaigns);
}));

router.post('/campaigns', asyncHandler(async (req: Request, res: Response) => {
  const campaign = await prisma.campaigns.create({
    data: { ...req.body, company_id: req.user!.companyId, created_by: req.user!.id },
  });
  res.status(201).json(campaign);
}));

router.patch('/campaigns/:id/send', asyncHandler(async (req: Request, res: Response) => {
  const campaign = await prisma.campaigns.update({
    where: { id: req.params.id },
    data: { status: 'sending', updated_at: new Date() },
  });
  res.json({ message: 'Campagne mise en file d\'envoi', campaign });
}));

router.get('/birthday-patients', asyncHandler(async (req: Request, res: Response) => {
  const today = new Date();
  const patients = await prisma.$queryRaw`
    SELECT id, first_name, last_name, phone, email, date_of_birth
    FROM patients
    WHERE company_id = ${req.user!.companyId}::uuid
      AND is_active = true
      AND EXTRACT(MONTH FROM date_of_birth) = ${today.getMonth() + 1}
      AND EXTRACT(DAY FROM date_of_birth) = ${today.getDate()}
  `;
  res.json(patients);
}));

router.get('/patients-to-recall', asyncHandler(async (req: Request, res: Response) => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const patients = await prisma.$queryRaw`
    SELECT p.id, p.first_name, p.last_name, p.phone, p.email, MAX(a.appointment_date) as last_appointment
    FROM patients p
    LEFT JOIN appointments a ON a.patient_id = p.id
    WHERE p.company_id = ${req.user!.companyId}::uuid AND p.is_active = true
    GROUP BY p.id, p.first_name, p.last_name, p.phone, p.email
    HAVING MAX(a.appointment_date) < ${sixMonthsAgo} OR MAX(a.appointment_date) IS NULL
    ORDER BY last_appointment ASC NULLS FIRST
    LIMIT 100
  `;

  res.json(patients);
}));

export default router;
