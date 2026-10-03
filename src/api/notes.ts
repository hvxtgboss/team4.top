import client from './client';
import type { Note, Question } from '@/types';

export const getNotes = async (courseId?: string): Promise<Note[]> => {
  const params = courseId ? { course_id: courseId } : {};
  const response = await client.get('/notes', { params });
  return response.data;
};

export const getNoteById = async (noteId: string): Promise<Note> => {
  const response = await client.get(`/notes/${noteId}`);
  return response.data;
};

export const createNote = async (data: {
  course_id: string;
  title: string;
}): Promise<Note> => {
  const response = await client.post('/notes', data);
  return response.data;
};

export const updateNote = async (
  noteId: string,
  data: Partial<Note>
): Promise<Note> => {
  const response = await client.put(`/notes/${noteId}`, data);
  return response.data;
};

export const deleteNote = async (noteId: string): Promise<void> => {
  await client.delete(`/notes/${noteId}`);
};

export const getQuestions = async (noteId: string): Promise<Question[]> => {
  const response = await client.get(`/notes/${noteId}/questions`);
  return response.data;
};

export const generateQuestions = async (noteId: string): Promise<Question[]> => {
  const response = await client.post(`/notes/${noteId}/questions`);
  return response.data;
};
