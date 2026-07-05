import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { asyncHandler } from '../middleware/errorHandler';

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
  await prisma.notifications.update({
    where: { id: req.params.id },
    data: { is_read: true, read_at: new Date() },
  });
  res.json({ message: 'Notification lue' });
}));

export default router;
