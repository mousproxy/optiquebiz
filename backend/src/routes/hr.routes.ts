import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.get('/employees', asyncHandler(async (req: Request, res: Response) => {
  const employees = await prisma.employees.findMany({
    where: { company_id: req.user!.companyId, is_active: true },
    orderBy: [{ last_name: 'asc' }, { first_name: 'asc' }],
  });
  res.json(employees);
}));

router.post('/employees', asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.user!.companyId;
  const numQuery = await prisma.$queryRaw<any[]>`SELECT get_next_sequence(${companyId}::uuid, 'employee') as num`;
  const employeeNumber = numQuery[0]?.num || `EMP-${Date.now()}`;
  const emp = await prisma.employees.create({ data: { ...req.body, employee_number: employeeNumber, company_id: companyId } });
  res.status(201).json(emp);
}));

router.put('/employees/:id', asyncHandler(async (req: Request, res: Response) => {
  const emp = await prisma.employees.update({ where: { id: req.params.id }, data: { ...req.body, updated_at: new Date() } });
  res.json(emp);
}));

router.get('/attendance', asyncHandler(async (req: Request, res: Response) => {
  const { employeeId, month } = req.query;
  const where: any = { ...(employeeId && { employee_id: employeeId as string }) };
  if (month) {
    const [y, m] = (month as string).split('-');
    where.attendance_date = { gte: new Date(parseInt(y), parseInt(m) - 1, 1), lte: new Date(parseInt(y), parseInt(m), 0) };
  }
  const attendance = await prisma.attendance.findMany({ where, orderBy: { attendance_date: 'desc' } });
  res.json(attendance);
}));

router.post('/attendance', asyncHandler(async (req: Request, res: Response) => {
  const att = await prisma.attendance.upsert({
    where: { employee_id_attendance_date: { employee_id: req.body.employee_id, attendance_date: req.body.attendance_date } },
    update: req.body,
    create: { ...req.body, recorded_by: req.user!.id },
  });
  res.json(att);
}));

router.get('/leaves', asyncHandler(async (req: Request, res: Response) => {
  const leaves = await prisma.leave_requests.findMany({
    where: { employees: { company_id: req.user!.companyId } },
    include: { employees: { select: { first_name: true, last_name: true } } },
    orderBy: { created_at: 'desc' },
  });
  res.json(leaves);
}));

router.post('/leaves', asyncHandler(async (req: Request, res: Response) => {
  const leave = await prisma.leave_requests.create({ data: req.body });
  res.status(201).json(leave);
}));

router.patch('/leaves/:id/status', asyncHandler(async (req: Request, res: Response) => {
  const leave = await prisma.leave_requests.update({
    where: { id: req.params.id },
    data: { status: req.body.status, approved_by: req.user!.id, approved_at: new Date(), rejection_reason: req.body.reason },
  });
  res.json(leave);
}));

export default router;
