import client from './client';
import type { Course } from '@/types';

export const getCourses = async (): Promise<Course[]> => {
  const response = await client.get('/courses');
  return response.data;
};

export const getCourseById = async (courseId: string): Promise<Course> => {
  const response = await client.get(`/courses/${courseId}`);
  return response.data;
};

export const createCourse = async (data: {
  name: string;
  category: string;
  description?: string;
  cover_image?: string;
}): Promise<Course> => {
  const response = await client.post('/courses', data);
  return response.data;
};

export const updateCourse = async (
  courseId: string,
  data: Partial<Course>
): Promise<Course> => {
  const response = await client.put(`/courses/${courseId}`, data);
  return response.data;
};

export const deleteCourse = async (courseId: string): Promise<void> => {
  await client.delete(`/courses/${courseId}`);
};
