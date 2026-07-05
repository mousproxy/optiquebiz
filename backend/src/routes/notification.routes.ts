import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { asyncHandler, AppError } from '../middleware/errorHandler';

const router = Router();

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const notifications = await prisma.notifications.findMany({
    where: { user_id: req.user!.id },
    orderBy: { created_at: 'desc' },
    take: 50,
  });
  res.json(notifications);
}));

router.patch('/read-all', asyncHandler(async (req: Request, res: Response) => {
  await prisma.notifications.updateMany({
    where: { user_id: req.user!.id, is_read: false },
    data: { is_read: true, read_at: new Date() },
  });
  res.json({ message: 'Notifications marquées comme lues' });
}));

router.patch('/:id/read', asyncHandler(async (req: Request, res: Response) => {
  const { count } = await prisma.notifications.updateMany({
    where: { id: req.params.id, user_id: req.user!.id },
    data: { is_read: true, read_at: new Date() },
  });
  if (count === 0) throw new AppError('Notification introuvable', 404);
  res.json({ message: 'Notification lue' });
}));

export default router;
