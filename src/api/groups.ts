import client from './client';
import type { CourseGroup, PaginationResult } from '../types';

export interface GetGroupsParams {
  school_id?: string;
  course_id?: string;
  keyword?: string;
  category_id?: string;
  page?: number;
  page_size?: number;
}

export async function getGroups(params?: GetGroupsParams): Promise<PaginationResult<CourseGroup>> {
  return client.get('/groups', { params });
}

export async function getGroupDetail(id: string): Promise<CourseGroup> {
  return client.get(`/groups/${id}`);
}

export async function createGroup(data: {
  name: string;
  description?: string;
  price?: number;
  max_members?: number;
  school_name: string;
  course_name: string;
  major?: string;
}): Promise<CourseGroup> {
  return client.post('/groups', data);
}

export async function joinGroup(id: string): Promise<void> {
  await client.post(`/groups/${id}/join`);
}

export async function getMyGroups(): Promise<CourseGroup[]> {
  return client.get('/groups/my');
}

export async function deleteGroup(id: string): Promise<void> {
  await client.delete(`/groups/${id}`);
}
