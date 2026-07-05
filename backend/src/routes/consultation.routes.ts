import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { asyncHandler, AppError } from '../middleware/errorHandler';

const router = Router();

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;
  const { patientId, doctorId, page = '1', limit = '20' } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const where: any = {
    company_id: companyId,
    ...(patientId && { patient_id: patientId as string }),
    ...(doctorId && { doctor_id: doctorId as string }),
  };

  const [consultations, total] = await Promise.all([
    prisma.consultations.findMany({
      where,
      skip,
      take: parseInt(limit as string),
      include: {
        patients: { select: { first_name: true, last_name: true, phone: true } },
        users_consultations_doctor_idTousers: { select: { first_name: true, last_name: true } },
      },
      orderBy: { consultation_date: 'desc' },
    }),
    prisma.consultations.count({ where }),
  ]);

  res.json({ data: consultations, pagination: { total, page: parseInt(page as string), limit: parseInt(limit as string), totalPages: Math.ceil(total / parseInt(limit as string)) } });
}));

router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const c = await prisma.consultations.findFirst({
    where: { id: req.params.id, company_id: req.user!.companyId },
    include: {
      patients: true,
      users_consultations_doctor_idTousers: { select: { first_name: true, last_name: true, signature_url: true } },
      prescriptions: true,
    },
  });
  if (!c) throw new AppError('Consultation introuvable', 404);
  res.json(c);
}));

router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;
  const consultation = await prisma.consultations.create({
    data: { ...req.body, company_id: companyId, created_by: req.user!.id },
  });

  if (req.body.appointment_id) {
    await prisma.appointments.update({
      where: { id: req.body.appointment_id },
      data: { status: 'completed' },
    });
  }

  res.status(201).json(consultation);
}));

router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const c = await prisma.consultations.update({
    where: { id: req.params.id },
    data: { ...req.body, updated_at: new Date() },
  });
  res.json(c);
}));

export default router;
