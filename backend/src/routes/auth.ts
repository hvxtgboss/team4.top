import { Router } from 'express';
import { register, login, getUserInfo, updateUserInfo } from '../controllers/auth';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getUserInfo);
router.put('/me', authenticate, updateUserInfo);

export default router;
