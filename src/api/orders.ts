import client from './client';
import type { Order } from '../types';

export async function createOrder(data: { group_id: string }): Promise<Order> {
  return client.post('/orders', data);
}

export async function simulatePayment(orderId: string): Promise<{ order_id: string; status: string; message: string }> {
  return client.post(`/orders/${orderId}/pay`);
}

export async function getOrders(params?: { page?: number; page_size?: number; status?: string }): Promise<{ list: Order[]; total: number; page: number; page_size: number }> {
  return client.get('/orders', { params });
}

export async function getOrderDetail(id: string): Promise<Order> {
  return client.get(`/orders/${id}`);
}
