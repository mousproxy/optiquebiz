import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { asyncHandler, AppError } from '../middleware/errorHandler';

export const getPatients = asyncHandler(async (req: Request, res: Response) => {
  const { search, page = '1', limit = '20', city, gender } = req.query;
  const companyId = req.user!.companyId;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const where: any = {
    company_id: companyId,
    is_active: true,
    ...(city && { city: city as string }),
    ...(gender && { gender: gender as string }),
  };

  if (search) {
    const s = search as string;
    where.OR = [
      { first_name: { contains: s, mode: 'insensitive' } },
      { last_name: { contains: s, mode: 'insensitive' } },
      { phone: { contains: s } },
      { code: { contains: s, mode: 'insensitive' } },
      { email: { contains: s, mode: 'insensitive' } },
    ];
  }

  const [patients, total] = await Promise.all([
    prisma.patients.findMany({
      where,
      skip,
      take: parseInt(limit as string),
      orderBy: [{ last_name: 'asc' }, { first_name: 'asc' }],
      include: {
        _count: {
          select: {
            consultations: true,
            prescriptions: true,
            sales: true,
            appointments: true,
          },
        },
      },
    }),
    prisma.patients.count({ where }),
  ]);

  res.json({
    data: patients,
    pagination: {
      total,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      totalPages: Math.ceil(total / parseInt(limit as string)),
    },
  });
});

export const getPatient = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const companyId = req.user!.companyId;

  const patient = await prisma.patients.findFirst({
    where: { id, company_id: companyId },
    include: {
      medical_history: { orderBy: { created_at: 'desc' } },
      consultations: {
        orderBy: { consultation_date: 'desc' },
        take: 10,
        include: {
          users_consultations_doctor_idTousers: {
            select: { first_name: true, last_name: true },
          },
        },
      },
      prescriptions: {
        orderBy: { prescription_date: 'desc' },
        take: 10,
        include: {
          users_prescriptions_doctor_idTousers: {
            select: { first_name: true, last_name: true },
          },
        },
      },
      sales: {
        orderBy: { sale_date: 'desc' },
        take: 10,
        include: {
          sale_items: true,
          payments: true,
          users_sales_seller_idTousers: {
            select: { first_name: true, last_name: true },
          },
        },
      },
      appointments: {
        orderBy: { appointment_date: 'desc' },
        take: 10,
        include: {
          users_appointments_doctor_idTousers: {
            select: { first_name: true, last_name: true },
          },
        },
      },
      documents: { orderBy: { created_at: 'desc' } },
    },
  });

  if (!patient) throw new AppError('Patient introuvable', 404);
  res.json(patient);
});

export const createPatient = asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;
  const data = req.body;

  // Générer le code patient
  const code = await prisma.$queryRaw<any[]>`
    SELECT get_next_sequence(${companyId}::uuid, 'patient') as code
  `;
  const patientCode = code[0]?.code || `PAT-${Date.now()}`;

  const patient = await prisma.patients.create({
    data: {
      ...data,
      code: patientCode,
      company_id: companyId,
      created_by: req.user!.id,
    },
  });

  // Audit log
  await prisma.audit_logs.create({
    data: {
      company_id: companyId,
      user_id: req.user!.id,
      user_name: `${req.user!.firstName} ${req.user!.lastName}`,
      action: 'CREATE_PATIENT',
      resource: 'patients',
      resource_id: patient.id,
      new_data: data,
    },
  });

  res.status(201).json(patient);
});

export const updatePatient = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const companyId = req.user!.companyId;
  const data = req.body;

  const existing = await prisma.patients.findFirst({ where: { id, company_id: companyId } });
  if (!existing) throw new AppError('Patient introuvable', 404);

  const patient = await prisma.patients.update({
    where: { id },
    data: { ...data, updated_at: new Date() },
  });

  await prisma.audit_logs.create({
    data: {
      company_id: companyId,
      user_id: req.user!.id,
      user_name: `${req.user!.firstName} ${req.user!.lastName}`,
      action: 'UPDATE_PATIENT',
      resource: 'patients',
      resource_id: id,
      old_data: existing as any,
      new_data: data,
    },
  });

  res.json(patient);
});

export const deletePatient = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const companyId = req.user!.companyId;

  const patient = await prisma.patients.findFirst({ where: { id, company_id: companyId } });
  if (!patient) throw new AppError('Patient introuvable', 404);

  await prisma.patients.update({
    where: { id },
    data: { is_active: false },
  });

  res.json({ message: 'Patient archivé avec succès' });
});

export const getPatientHistory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const companyId = req.user!.companyId;

  const patient = await prisma.patients.findFirst({ where: { id, company_id: companyId } });
  if (!patient) throw new AppError('Patient introuvable', 404);

  const [consultations, prescriptions, sales, appointments] = await Promise.all([
    prisma.consultations.findMany({ where: { patient_id: id }, orderBy: { consultation_date: 'desc' } }),
    prisma.prescriptions.findMany({ where: { patient_id: id }, orderBy: { prescription_date: 'desc' } }),
    prisma.sales.findMany({
      where: { patient_id: id },
      include: { sale_items: true, payments: true },
      orderBy: { sale_date: 'desc' },
    }),
    prisma.appointments.findMany({ where: { patient_id: id }, orderBy: { appointment_date: 'desc' } }),
  ]);

  res.json({ consultations, prescriptions, sales, appointments });
});
