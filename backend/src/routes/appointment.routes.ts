import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { prisma } from '../config/database';
import { Request, Response } from 'express';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

const router = Router();

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;
  const { date, view = 'week', doctorId, status } = req.query;

  const baseDate = date ? new Date(date as string) : new Date();
  let start: Date, end: Date;

  switch (view) {
    case 'day': start = startOfDay(baseDate); end = endOfDay(baseDate); break;
    case 'month': start = startOfMonth(baseDate); end = endOfMonth(baseDate); break;
    default: start = startOfWeek(baseDate, { weekStartsOn: 1 }); end = endOfWeek(baseDate, { weekStartsOn: 1 });
  }

  const where: any = {
    company_id: companyId,
    appointment_date: { gte: start, lte: end },
    ...(doctorId && { doctor_id: doctorId as string }),
    ...(status && { status: status as any }),
  };

  const appointments = await prisma.appointments.findMany({
    where,
    include: {
      patients: { select: { id: true, first_name: true, last_name: true, phone: true, photo_url: true } },
      users_appointments_doctor_idTousers: { select: { id: true, first_name: true, last_name: true } },
      users_appointments_optician_idTousers: { select: { id: true, first_name: true, last_name: true } },
    },
    orderBy: [{ appointment_date: 'asc' }, { start_time: 'asc' }],
  });

  res.json(appointments);
}));

router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;
  const data = req.body;

  const appointment = await prisma.appointments.create({
    data: { ...data, company_id: companyId, created_by: req.user!.id },
    include: {
      patients: { select: { first_name: true, last_name: true, phone: true } },
    },
  });

  res.status(201).json(appointment);
}));

router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = req.body;

  const appointment = await prisma.appointments.update({
    where: { id },
    data: { ...data, updated_at: new Date() },
  });

  res.json(appointment);
}));

router.patch('/:id/status', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  const appointment = await prisma.appointments.update({
    where: { id },
    data: { status, updated_at: new Date() },
  });

  res.json(appointment);
}));

router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await prisma.appointments.update({
    where: { id },
    data: { status: 'cancelled', updated_at: new Date() },
  });
  res.json({ message: 'Rendez-vous annulé' });
}));

router.get('/today/list', asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;
  const today = new Date();

  const appointments = await prisma.appointments.findMany({
    where: {
      company_id: companyId,
      appointment_date: { gte: startOfDay(today), lte: endOfDay(today) },
    },
    include: {
      patients: { select: { id: true, first_name: true, last_name: true, phone: true } },
      users_appointments_doctor_idTousers: { select: { first_name: true, last_name: true } },
    },
    orderBy: { start_time: 'asc' },
  });

  res.json(appointments);
}));

export default router;
