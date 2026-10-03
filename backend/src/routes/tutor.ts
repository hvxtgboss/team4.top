import { Router } from 'express';
import {
  applyTutor,
  getTutorProfile,
  getTutorDetail,
  getTutors,
  getMyStudents,
  getMyEarnings,
  getRecommendTutors,
} from '../controllers/tutor';
import { authenticate, requireRoles } from '../middleware/auth';

const router = Router();

router.get('/', getTutors);
router.get('/recommend', getRecommendTutors);
router.get('/me', authenticate, getTutorProfile);
router.get('/students', authenticate, requireRoles('tutor'), getMyStudents);
router.get('/earnings', authenticate, requireRoles('tutor'), getMyEarnings);
router.post('/apply', authenticate, applyTutor);
router.get('/:id', getTutorDetail);

export default router;
