import client from './client';
import type { User } from '../types';

export interface LoginResponse {
  user: User;
  token: string;
}

export async function login(phone: string): Promise<LoginResponse> {
  return client.post('/auth/login', { phone });
}

export async function register(data: {
  phone: string;
  nickname: string;
  role?: string;
  school_id?: string;
  school_college?: string;
  major?: string;
  grade?: string;
  student_id?: string;
}): Promise<LoginResponse> {
  return client.post('/auth/register', data);
}

export async function getUserInfo(): Promise<User> {
  return client.get('/auth/me');
}

export async function updateUserInfo(data: {
  nickname?: string;
  avatar?: string;
  school_id?: string;
  school_college?: string;
  major?: string;
  grade?: string;
  student_id?: string;
}): Promise<User> {
  return client.put('/auth/me', data);
}
