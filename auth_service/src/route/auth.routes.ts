import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../shared/middleware/auth.middleware';
import { loginValidation, registerValidation } from '../infrastructure/database/models/validators/auth.validation';
import { validateRequest } from '../shared/middleware/validate.middleware';
const router = Router();
const authController = new AuthController();

// Public routes
router.post('/register', validateRequest(registerValidation), authController.register);
router.post('/login', validateRequest(loginValidation), authController.login);
router.post('/refresh', authController.refreshToken);

// Protected routes
router.post('/logout', authenticate, authController.logout);
router.post('/logout-all', authenticate, authController.logoutAll);
router.get('/verify', authenticate, authController.verifyToken);

export default router