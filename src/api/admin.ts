import client from './client';

export async function getAdminStats() {
  return client.get('/admin/stats');
}

export async function getAdminUsers(params?: {
  role?: string;
  keyword?: string;
  page?: number;
  page_size?: number;
}) {
  return client.get('/admin/users', { params });
}

export async function getTutorApplications(status: string = 'pending') {
  return client.get('/admin/tutor-applications', { params: { status } });
}

export async function approveTutorApplication(userId: string) {
  return client.post(`/admin/tutor-applications/${userId}/approve`);
}

export async function rejectTutorApplication(userId: string) {
  return client.post(`/admin/tutor-applications/${userId}/reject`);
}

export async function getAdminMaterials(status: string = 'pending') {
  return client.get('/admin/materials', { params: { status } });
}

export async function reviewMaterial(id: string, action: 'approve' | 'reject') {
  return client.post(`/admin/materials/${id}/review`, { action });
}

export async function getAdminGroups(status: string = 'pending') {
  return client.get('/admin/groups', { params: { status } });
}

export async function reviewGroup(id: string, action: 'approve' | 'reject') {
  return client.post(`/admin/groups/${id}/review`, { action });
}
