import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { asyncHandler } from '../middleware/errorHandler';
import { companySelect, serializeCompany } from '../utils/subscription';

const router = Router();

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const settings = await prisma.system_settings.findMany({ orderBy: [{ category: 'asc' }, { key: 'asc' }] });
  const result: Record<string, any> = {};
  settings.forEach(s => { result[s.key] = s.value; });
  res.json(result);
}));

router.put('/', asyncHandler(async (req: Request, res: Response) => {
  const { settings } = req.body;
  await Promise.all(
    Object.entries(settings).map(([key, value]) =>
      prisma.system_settings.upsert({
        where: { key },
        update: { value: value as string, updated_by: req.user!.id, updated_at: new Date() },
        create: { key, value: value as string, updated_by: req.user!.id },
      })
    )
  );
  res.json({ message: 'Paramètres mis à jour' });
}));

router.get('/company', asyncHandler(async (req: Request, res: Response) => {
  const company = await prisma.companies.findFirst({
    where: { id: req.user!.companyId },
    select: { ...companySelect, legal_name: true, tax_number: true, rccm: true, address: true, city: true, country: true, phone: true, email: true, website: true, tax_rate: true, invoice_prefix: true, quote_prefix: true, po_prefix: true, patient_prefix: true, footer_text: true },
  });
  res.json(serializeCompany(company));
}));

router.put('/company', asyncHandler(async (req: Request, res: Response) => {
  const company = await prisma.companies.update({
    where: { id: req.user!.companyId },
    data: { ...req.body, updated_at: new Date() },
  });
  res.json(company);
}));

router.get('/audit-logs', asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', limit = '50', action } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const where: any = { company_id: req.user!.companyId, ...(action && { action: action as string }) };

  const [logs, total] = await Promise.all([
    prisma.audit_logs.findMany({ where, skip, take: parseInt(limit as string), orderBy: { created_at: 'desc' } }),
    prisma.audit_logs.count({ where }),
  ]);

  res.json({ data: logs, pagination: { total, page: parseInt(page as string), limit: parseInt(limit as string), totalPages: Math.ceil(total / parseInt(limit as string)) } });
}));

export default router;
