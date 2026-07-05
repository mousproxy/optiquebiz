import { Router } from 'express';
import { login, logout, refreshToken, changePassword, getProfile, registerCompany } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/login', login);
router.post('/register-company', registerCompany);
router.post('/refresh-token', refreshToken);
router.post('/logout', authMiddleware, logout);
router.post('/change-password', authMiddleware, changePassword);
router.get('/profile', authMiddleware, getProfile);

export default router;
