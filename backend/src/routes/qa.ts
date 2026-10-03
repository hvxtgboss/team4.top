import { Router } from 'express';
import {
  getThreads,
  createThread,
  getThreadDetail,
  createReply,
  acceptReply,
  markSolved,
} from '../controllers/qa';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', getThreads);
router.get('/:id', getThreadDetail);
router.post('/', authenticate, createThread);
router.post('/:id/replies', authenticate, createReply);
router.post('/:id/accept', authenticate, acceptReply);
router.post('/:id/solved', authenticate, markSolved);

export default router;
