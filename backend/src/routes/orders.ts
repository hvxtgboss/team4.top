import { Router } from 'express';
import { createOrder, simulatePayment, getOrders, getOrderDetail } from '../controllers/orders';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, createOrder);
router.post('/:order_id/pay', authenticate, simulatePayment);
router.get('/', authenticate, getOrders);
router.get('/:id', authenticate, getOrderDetail);

export default router;
