import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { asyncHandler } from '../middleware/errorHandler';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => { cb(null, process.env.UPLOAD_DIR || './uploads'); },
  filename: (_req, file, cb) => { cb(null, `${uuidv4()}${path.extname(file.originalname)}`); },
});

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.doc', '.docx'];
    cb(null, allowed.includes(path.extname(file.originalname).toLowerCase()));
  },
});

const router = Router();

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { patientId, documentType } = req.query;

  const where: any = {
    company_id: req.user!.companyId,
    is_archived: false,
    ...(patientId && { patient_id: patientId as string }),
    ...(documentType && { document_type: documentType as any }),
  };

  const documents = await prisma.documents.findMany({
    where,
    include: { users: { select: { first_name: true, last_name: true } } },
    orderBy: { created_at: 'desc' },
  });

  res.json(documents);
}));

router.post('/', upload.single('file'), asyncHandler(async (req: Request, res: Response) => {
  const file = req.file;
  const data = req.body;

  const document = await prisma.documents.create({
    data: {
      ...data,
      company_id: req.user!.companyId,
      file_path: file ? `/uploads/${file.filename}` : data.file_path,
      file_name: file?.originalname,
      file_size: file?.size,
      mime_type: file?.mimetype,
      created_by: req.user!.id,
    },
  });

  res.status(201).json(document);
}));

router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  await prisma.documents.update({ where: { id: req.params.id }, data: { is_archived: true } });
  res.json({ message: 'Document archivé' });
}));

export default router;
