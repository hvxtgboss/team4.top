import client from './client';
import type { TutorProfile } from '../types';

export async function applyTutor(data: {
  real_name: string;
  gpa?: number;
  rank_percent?: number;
  course_experience?: string;
  hourly_rate?: number;
}): Promise<void> {
  await client.post('/tutor/apply', data);
}

export async function getTutorProfile(): Promise<TutorProfile> {
  return client.get('/tutor/me');
}

export async function getTutorDetail(id: string): Promise<{ profile: TutorProfile; groups: any[] }> {
  return client.get(`/tutor/${id}`);
}

export async function getTutors(params?: {
  school_id?: string;
  keyword?: string;
  course?: string;
  page?: number;
  page_size?: number;
}): Promise<{ list: TutorProfile[]; total: number; page: number; page_size: number }> {
  return client.get('/tutor', { params });
}

export async function getMyStudents(group_id?: string) {
  return client.get('/tutor/students', { params: { group_id } });
}

export async function getMyEarnings() {
  return client.get('/tutor/earnings');
}

export async function getRecommendTutors(params?: {
  course?: string;
  category_id?: string;
  page_size?: number;
}) {
  return client.get('/tutor/recommend', { params });
}
