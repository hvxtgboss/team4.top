const PY_BASE = import.meta.env.VITE_PY_API_BASE_URL || 'http://localhost:5001';

export interface UploadAudioResult {
  ok: boolean;
  key: string;
  url: string;
  hash?: string;
  course_id?: string | null;
  course_name?: string | null;
  original_filename?: string;
}

export interface GenerateNotesResult {
  ok: boolean;
  audio_url: string;
  course_id?: string | null;
  course_name?: string | null;
  transcript: string;
  review_notes: string;
  saved?: {
    dir: string;
    transcript_path: string;
    review_path: string;
  };
}

export async function uploadCourseAudio(params: {
  file: File;
  course_id?: string;
  course_name?: string;
}): Promise<UploadAudioResult> {
  const form = new FormData();
  form.append('file', params.file);
  if (params.course_id) form.append('course_id', params.course_id);
  if (params.course_name) form.append('course_name', params.course_name);

  const res = await fetch(`${PY_BASE}/api/upload/audio`, {
    method: 'POST',
    body: form,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || data.message || `上传失败 (${res.status})`);
  }
  return data as UploadAudioResult;
}

export async function generateCourseNotes(params: {
  audio_url: string;
  course_id?: string;
  course_name?: string;
  transcript?: string;
}): Promise<GenerateNotesResult> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 10 * 60 * 1000);

  try {
    const res = await fetch(`${PY_BASE}/api/notes/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      signal: controller.signal,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const detail = data.detail;
      const msg =
        typeof detail === 'string'
          ? detail
          : Array.isArray(detail)
            ? detail.map((d: any) => d.msg || d).join('; ')
            : data.message || `生成失败 (${res.status})`;
      throw new Error(msg);
    }
    return data as GenerateNotesResult;
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw new Error('生成超时，请稍后重试（语音识别可能较慢）');
    }
    throw err;
  } finally {
    window.clearTimeout(timer);
  }
}

export async function pingPyBackend(): Promise<boolean> {
  try {
    const res = await fetch(`${PY_BASE}/health`);
    return res.ok;
  } catch {
    return false;
  }
}
