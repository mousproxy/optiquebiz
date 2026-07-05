import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';
import rateLimit from 'express-rate-limit';

import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware, requireModule, requireRole } from './middleware/auth';

// Routes
import authRoutes from './routes/auth.routes';
import patientRoutes from './routes/patient.routes';
import appointmentRoutes from './routes/appointment.routes';
import consultationRoutes from './routes/consultation.routes';
import prescriptionRoutes from './routes/prescription.routes';
import saleRoutes from './routes/sale.routes';
import frameRoutes from './routes/frame.routes';
import lensRoutes from './routes/lens.routes';
import contactLensRoutes from './routes/contactLens.routes';
import accessoryRoutes from './routes/accessory.routes';
import stockRoutes from './routes/stock.routes';
import supplierRoutes from './routes/supplier.routes';
import purchaseRoutes from './routes/purchase.routes';
import cashierRoutes from './routes/cashier.routes';
import accountingRoutes from './routes/accounting.routes';
import hrRoutes from './routes/hr.routes';
import crmRoutes from './routes/crm.routes';
import reportRoutes from './routes/report.routes';
import settingsRoutes from './routes/settings.routes';
import userRoutes from './routes/user.routes';
import dashboardRoutes from './routes/dashboard.routes';
import documentRoutes from './routes/document.routes';
import notificationRoutes from './routes/notification.routes';
import superadminRoutes from './routes/superadmin.routes';

const app: Application = express();

// Trust proxy
app.set('trust proxy', 1);

// Security headers
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false,
}));

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Company-ID'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '15') * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX || '200'),
  message: { message: 'Trop de requêtes, veuillez réessayer plus tard.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging HTTP
app.use(morgan('combined', {
  stream: { write: (message) => logger.info(message.trim()) },
  skip: (req) => req.url === '/api/health',
}));

// Static files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/static', express.static(path.join(process.cwd(), 'public')));

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'OptiGest API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);
app.use('/api/patients', authMiddleware, patientRoutes);
app.use('/api/appointments', authMiddleware, appointmentRoutes);
app.use('/api/consultations', authMiddleware, consultationRoutes);
app.use('/api/prescriptions', authMiddleware, prescriptionRoutes);
app.use('/api/sales', authMiddleware, saleRoutes);
app.use('/api/frames', authMiddleware, frameRoutes);
app.use('/api/lenses', authMiddleware, lensRoutes);
app.use('/api/contact-lenses', authMiddleware, contactLensRoutes);
app.use('/api/accessories', authMiddleware, accessoryRoutes);
app.use('/api/stock', authMiddleware, stockRoutes);
app.use('/api/suppliers', authMiddleware, requireModule('procurement'), supplierRoutes);
app.use('/api/purchases', authMiddleware, requireModule('procurement'), purchaseRoutes);
app.use('/api/cashier', authMiddleware, requireModule('cashier'), cashierRoutes);
app.use('/api/accounting', authMiddleware, requireModule('accounting'), accountingRoutes);
app.use('/api/hr', authMiddleware, requireModule('hr'), hrRoutes);
app.use('/api/crm', authMiddleware, requireModule('crm'), crmRoutes);
app.use('/api/reports', authMiddleware, requireModule('reports'), reportRoutes);
app.use('/api/settings', authMiddleware, settingsRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/documents', authMiddleware, documentRoutes);
app.use('/api/notifications', authMiddleware, notificationRoutes);
app.use('/api/superadmin', authMiddleware, requireRole('superadmin'), superadminRoutes);

// 404
app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: 'Route non trouvée' });
});

// Error handler
app.use(errorHandler);

export default app;
