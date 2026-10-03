import { Router } from 'express';
import { getGroups, getGroupDetail, createGroup, joinGroup, getMyGroups, deleteGroup } from '../controllers/groups';
import {
  getGroupAiNotes,
  upsertGroupAiNotes,
  batchUpsertGroupAiNotes,
} from '../controllers/aiNotes';
import { authenticate, optionalAuthenticate } from '../middleware/auth';

const router = Router();

router.get('/', getGroups);
router.get('/my', authenticate, getMyGroups);
router.put('/ai-notes/batch', authenticate, batchUpsertGroupAiNotes);
router.get('/:id/ai-notes', optionalAuthenticate, getGroupAiNotes);
router.put('/:id/ai-notes', authenticate, upsertGroupAiNotes);
router.get('/:id', optionalAuthenticate, getGroupDetail);
router.post('/', authenticate, createGroup);
router.post('/:id/join', authenticate, joinGroup);
router.delete('/:id', authenticate, deleteGroup);

export default router;
