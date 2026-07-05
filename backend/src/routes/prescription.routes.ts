import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import QRCode from 'qrcode';

const router = Router();

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;
  const { patientId, page = '1', limit = '20' } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const where: any = { company_id: companyId, ...(patientId && { patient_id: patientId as string }) };

  const [prescriptions, total] = await Promise.all([
    prisma.prescriptions.findMany({
      where,
      skip,
      take: parseInt(limit as string),
      include: {
        patients: { select: { first_name: true, last_name: true, phone: true } },
        users_prescriptions_doctor_idTousers: { select: { first_name: true, last_name: true } },
      },
      orderBy: { prescription_date: 'desc' },
    }),
    prisma.prescriptions.count({ where }),
  ]);

  res.json({ data: prescriptions, pagination: { total, page: parseInt(page as string), limit: parseInt(limit as string), totalPages: Math.ceil(total / parseInt(limit as string)) } });
}));

router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const p = await prisma.prescriptions.findFirst({
    where: { id: req.params.id, company_id: req.user!.companyId },
    include: {
      patients: true,
      users_prescriptions_doctor_idTousers: { select: { first_name: true, last_name: true, signature_url: true } },
    },
  });
  if (!p) throw new AppError('Ordonnance introuvable', 404);
  res.json(p);
}));

router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;
  const refQuery = await prisma.$queryRaw<any[]>`SELECT get_next_sequence(${companyId}::uuid, 'prescription') as ref`;
  const reference = refQuery[0]?.ref || `ORD-${Date.now()}`;

  const expiryDate = new Date();
  expiryDate.setMonth(expiryDate.getMonth() + (req.body.validity_months || 12));

  const qrData = JSON.stringify({
    ref: reference,
    patient: req.body.patient_id,
    date: new Date().toISOString(),
    od: { sph: req.body.od_sph, cyl: req.body.od_cyl, axe: req.body.od_axe },
    og: { sph: req.body.og_sph, cyl: req.body.og_cyl, axe: req.body.og_axe },
  });
  const qrCode = await QRCode.toDataURL(qrData);

  const prescription = await prisma.prescriptions.create({
    data: {
      ...req.body,
      reference,
      company_id: companyId,
      expiry_date: expiryDate,
      qr_code: qrCode,
      created_by: req.user!.id,
    },
  });

  res.status(201).json(prescription);
}));

router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const p = await prisma.prescriptions.update({ where: { id: req.params.id }, data: { ...req.body, updated_at: new Date() } });
  res.json(p);
}));

export default router;
