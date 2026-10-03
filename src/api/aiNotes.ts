import client from './client';

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

export async function getGroupAiNotes(groupId: string): Promise<GroupAiNotes | null> {
  return client.get(`/groups/${groupId}/ai-notes`);
}

export async function saveGroupAiNotesBatch(data: {
  group_ids: string[];
  audio_url?: string;
  transcript_text?: string;
  review_notes?: string;
  course_name?: string;
}): Promise<{ group_ids: string[] }> {
  return client.put('/groups/ai-notes/batch', data);
}
