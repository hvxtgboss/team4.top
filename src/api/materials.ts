import client from './client';
import type { Material, PaginationResult } from '../types';

export interface GetMaterialsParams {
  group_id?: string;
  page?: number;
  page_size?: number;
  status?: string;
  mine?: boolean | string;
}

export async function getMaterials(params?: GetMaterialsParams): Promise<PaginationResult<Material>> {
  return client.get('/materials', { params });
}

export async function getGroupMaterials(groupId: string): Promise<PaginationResult<Material>> {
  return client.get(`/materials/group/${groupId}`);
}

export async function uploadMaterial(data: {
  group_id: string;
  title: string;
  description?: string;
  file: File;
}): Promise<void> {
  const formData = new FormData();
  formData.append('group_id', data.group_id);
  formData.append('title', data.title);
  if (data.description) {
    formData.append('description', data.description);
  }
  formData.append('file', data.file);
  
  await client.post('/materials', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export async function approveMaterial(id: string): Promise<void> {
  await client.post(`/materials/${id}/approve`);
}

export async function rejectMaterial(id: string): Promise<void> {
  await client.post(`/materials/${id}/reject`);
}

export async function deleteMaterial(id: string): Promise<void> {
  await client.delete(`/materials/${id}`);
}
