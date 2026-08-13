import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { lockGuard } from '../middleware/lockGuard.js';
import * as authController from '../controllers/authController.js';
import * as categoryController from '../controllers/categoryController.js';
import * as planController from '../controllers/planController.js';
import * as actualController from '../controllers/actualController.js';
import * as lockController from '../controllers/lockController.js';
import * as reportController from '../controllers/reportController.js';

const router = Router();

router.post('/auth/signup', authController.signup);
router.post('/auth/login', authController.login);

router.get('/auth/me', authMiddleware, authController.getCurrentUser);
router.post('/auth/logout', authMiddleware, authController.logout);

router.get('/categories', authMiddleware, categoryController.getCategories);
router.post('/categories', authMiddleware, categoryController.createCategory);
router.put('/categories/:id', authMiddleware, categoryController.updateCategory);
router.delete('/categories/:id', authMiddleware, categoryController.deleteCategory);

router.get('/plans', authMiddleware, planController.getPlans);
router.post('/plans', authMiddleware, lockGuard(), planController.upsertPlan);
router.delete('/plans/:id', authMiddleware, planController.deletePlan);

router.get('/actuals', authMiddleware, actualController.getActuals);
router.post('/actuals', authMiddleware, lockGuard(), actualController.createActual);
router.put('/actuals/:id', authMiddleware, actualController.updateActual);
router.delete('/actuals/:id', authMiddleware, actualController.deleteActual);
router.post('/actuals/preview-csv', authMiddleware, actualController.previewCsv);
router.post('/actuals/import-csv', authMiddleware, actualController.importCsv);

router.get('/locks', authMiddleware, lockController.getLocks);
router.post('/locks/month', authMiddleware, lockController.lockMonth);
router.delete('/locks/month/:month', authMiddleware, lockController.unlockMonth);
router.post('/locks/quarter', authMiddleware, lockController.lockQuarter);

router.get('/reports', authMiddleware, reportController.getReport);

export default router;
