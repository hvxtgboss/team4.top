import { Router } from 'express';
import { authenticate, requireRoles } from '../middleware/auth';
import {
  getStats,
  listUsers,
  listTutorApplications,
  approveTutor,
  rejectTutor,
  listPendingMaterials,
  reviewMaterial,
  listPendingGroups,
  reviewGroup,
} from '../controllers/admin';

const router = Router();

router.use(authenticate, requireRoles('admin'));

router.get('/stats', getStats);
router.get('/users', listUsers);
router.get('/tutor-applications', listTutorApplications);
router.post('/tutor-applications/:userId/approve', approveTutor);
router.post('/tutor-applications/:userId/reject', rejectTutor);

router.get('/materials', listPendingMaterials);
router.post('/materials/:id/review', reviewMaterial);

router.get('/groups', listPendingGroups);
router.post('/groups/:id/review', reviewGroup);

export default router;
