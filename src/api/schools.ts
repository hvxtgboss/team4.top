import client from './client';
import type { School, Course, Major } from '../types';

export async function getSchools(): Promise<School[]> {
  return client.get('/schools');
}

export async function getMajors(category?: string): Promise<Major[]> {
  return client.get('/schools/majors', { params: { category } });
}

export async function getCourses(school_id?: string): Promise<Course[]> {
  return client.get('/schools/courses', { params: { school_id } });
}

export async function getSchoolDetail(id: string): Promise<{ school: School; courses: Course[] }> {
  return client.get(`/schools/${id}`);
}
