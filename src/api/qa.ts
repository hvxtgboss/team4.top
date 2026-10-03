import client from './client';
import type { QaThread, QaReply, PaginationResult } from '../types';

export interface GetThreadsParams {
  group_id?: string;
  is_solved?: boolean;
  page?: number;
  page_size?: number;
}

export async function getThreads(params?: GetThreadsParams): Promise<PaginationResult<QaThread>> {
  return client.get('/qa', { params });
}

export async function createThread(data: {
  group_id: string;
  title: string;
  content: string;
}): Promise<void> {
  await client.post('/qa', data);
}

export async function getThreadDetail(id: string): Promise<{ thread: QaThread; replies: QaReply[] }> {
  return client.get(`/qa/${id}`);
}

export async function createReply(id: string, content: string): Promise<void> {
  await client.post(`/qa/${id}/replies`, { content });
}

export async function acceptReply(id: string): Promise<void> {
  await client.post(`/qa/${id}/accept`);
}

export async function markSolved(id: string): Promise<void> {
  await client.post(`/qa/${id}/solved`);
}
