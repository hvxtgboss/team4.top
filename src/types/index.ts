export interface User {
  user_id: string;
  phone: string;
  email?: string;
  nickname: string;
  avatar?: string;
  role: 'student' | 'tutor' | 'admin';
  school_id?: string;
  school_college?: string;
  major?: string;
  grade?: string;
  student_id?: string;
  status: 'active' | 'inactive' | 'pending';
  created_at: string;
  updated_at: string;
}

export interface School {
  school_id: string;
  name: string;
  province: string;
  city: string;
  type: '985' | '211' | 'double_first' | 'ordinary' | string;
  category?: string;
}

export interface Major {
  major_id: string;
  name: string;
  category?: string;
}

export interface Course {
  course_id: string;
  school_id: string;
  name: string;
  code: string;
  department: string;
  credit: number;
}

export interface CourseGroup {
  group_id: string;
  tutor_id: string;
  course_id: string;
  name: string;
  description: string;
  price: number;
  max_members: number;
  cover_image?: string;
  member_count: number;
  status: 'active' | 'closed';
  created_at: string;
  school_name?: string;
  course_name?: string;
  tutor_nickname?: string;
  tutor_avatar?: string;
  is_member?: boolean;
  has_purchased?: boolean;
  wecom_qr_url?: string | null;
  wecom_qr_locked?: boolean;
}

export interface Material {
  material_id: string;
  group_id: string;
  user_id: string;
  title: string;
  file_url: string;
  file_type: string;
  file_size: number;
  description?: string;
  download_count: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  uploader_nickname?: string;
}

export interface QaThread {
  thread_id: string;
  group_id: string;
  user_id: string;
  title: string;
  content: string;
  is_solved: boolean;
  view_count: number;
  created_at: string;
  author_nickname?: string;
  author_avatar?: string;
  reply_count?: number;
}

export interface QaReply {
  reply_id: string;
  thread_id: string;
  user_id: string;
  content: string;
  is_accepted: boolean;
  like_count: number;
  created_at: string;
  reply_nickname?: string;
  reply_avatar?: string;
  reply_role?: string;
}

export interface TutorProfile {
  profile_id: string;
  user_id: string;
  real_name: string;
  student_card?: string;
  gpa?: number;
  rank_percent?: number;
  course_experience?: string;
  hourly_rate?: number;
  apply_status: 'pending' | 'approved' | 'rejected';
  approved_at?: string;
  created_at: string;
  nickname?: string;
  avatar?: string;
  school_name?: string;
  major?: string;
  group_count?: number;
  student_count?: number;
}

export interface Order {
  order_id: string;
  user_id: string;
  group_id: string;
  amount: number;
  status: 'pending' | 'paid' | 'cancelled';
  created_at: string;
  paid_at?: string;
  group_name?: string;
  course_name?: string;
  school_name?: string;
}

export interface GroupAiNotes {
  note_id: string;
  group_id: string;
  audio_url?: string;
  transcript_text?: string;
  review_notes?: string;
  course_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Note {
  note_id: string;
  course_id: string;
  title: string;
  full_text: string;
  key_points: string[];
  summary: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Question {
  question_id: string;
  note_id: string;
  type: 'single' | 'multiple' | 'fill';
  content: string;
  options: string[];
  answer: string;
  analysis?: string;
  related_knowledge?: string;
}

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
}

export interface PaginationResult<T> {
  list: T[];
  total: number;
  page: number;
  page_size: number;
}
