import { Request, Response } from 'express';
import { query, run } from '../utils/db';
import { success, error, forbidden, notFound, unauthorized } from '../utils/response';

async function isGroupTutor(groupId: string, userId: string): Promise<boolean> {
  const rows = await query(
    'SELECT 1 as ok FROM course_groups WHERE group_id = ? AND tutor_id = ?',
    [groupId, userId]
  );
  return rows.length > 0;
}

async function canViewGroupAiNotes(groupId: string, userId?: string): Promise<boolean> {
  // 公开可读：群内有内容即可展示（与资料/答疑并列的额外区块）
  // 未登录也可看摘要；若需仅成员可见可再收紧
  void userId;
  const groups = await query('SELECT group_id FROM course_groups WHERE group_id = ?', [groupId]);
  return groups.length > 0;
}

/** GET /api/groups/:id/ai-notes */
export async function getGroupAiNotes(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!(await canViewGroupAiNotes(id, (req as any).user?.user_id))) {
      return res.status(404).json(notFound('课程群不存在'));
    }

    const rows = await query(
      `SELECT note_id, group_id, audio_url, transcript_text, review_notes, course_name, updated_at, created_at
       FROM group_ai_notes WHERE group_id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.json(success(null, '暂无 AI 笔记'));
    }

    return res.json(success(rows[0], '获取成功'));
  } catch (e: any) {
    console.error(e);
    return res.status(500).json(error(e.message || '获取失败'));
  }
}

/** PUT /api/groups/:id/ai-notes — 导师写入/覆盖 */
export async function upsertGroupAiNotes(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.user_id;
    if (!userId) {
      return res.status(401).json(unauthorized());
    }

    const { id } = req.params;
    if (!(await isGroupTutor(id, userId))) {
      return res.status(403).json(forbidden('仅该课程群导师可更新 AI 笔记'));
    }

    const {
      audio_url = '',
      transcript_text = '',
      review_notes = '',
      course_name = '',
    } = req.body || {};

    if (!String(transcript_text).trim() && !String(review_notes).trim()) {
      return res.status(400).json(error('transcript_text 与 review_notes 不能同时为空', 400));
    }

    const existing = await query('SELECT note_id FROM group_ai_notes WHERE group_id = ?', [id]);
    const now = new Date().toISOString();

    if (existing.length > 0) {
      await run(
        `UPDATE group_ai_notes
         SET audio_url = ?, transcript_text = ?, review_notes = ?, course_name = ?, updated_at = ?
         WHERE group_id = ?`,
        [
          audio_url || '',
          transcript_text || '',
          review_notes || '',
          course_name || '',
          now,
          id,
        ]
      );
      const rows = await query('SELECT * FROM group_ai_notes WHERE group_id = ?', [id]);
      return res.json(success(rows[0], '已更新'));
    }

    const noteId = `ain_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    await run(
      `INSERT INTO group_ai_notes
        (note_id, group_id, audio_url, transcript_text, review_notes, course_name, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        noteId,
        id,
        audio_url || '',
        transcript_text || '',
        review_notes || '',
        course_name || '',
        now,
        now,
      ]
    );
    const rows = await query('SELECT * FROM group_ai_notes WHERE group_id = ?', [id]);
    return res.json(success(rows[0], '已保存'));
  } catch (e: any) {
    console.error(e);
    return res.status(500).json(error(e.message || '保存失败'));
  }
}

/** PUT /api/groups/ai-notes/batch — 按课程批量写入多个群 */
export async function batchUpsertGroupAiNotes(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.user_id;
    if (!userId) {
      return res.status(401).json(unauthorized());
    }

    const {
      group_ids,
      audio_url = '',
      transcript_text = '',
      review_notes = '',
      course_name = '',
    } = req.body || {};

    if (!Array.isArray(group_ids) || group_ids.length === 0) {
      return res.status(400).json(error('group_ids 必填', 400));
    }
    if (!String(transcript_text).trim() && !String(review_notes).trim()) {
      return res.status(400).json(error('transcript_text 与 review_notes 不能同时为空', 400));
    }

    const saved: string[] = [];
    for (const gid of group_ids) {
      if (!(await isGroupTutor(String(gid), userId))) {
        continue;
      }
      // 复用单群逻辑
      req.params = { id: String(gid) };
      req.body = { audio_url, transcript_text, review_notes, course_name };
      const existing = await query('SELECT note_id FROM group_ai_notes WHERE group_id = ?', [gid]);
      const now = new Date().toISOString();
      if (existing.length > 0) {
        await run(
          `UPDATE group_ai_notes
           SET audio_url = ?, transcript_text = ?, review_notes = ?, course_name = ?, updated_at = ?
           WHERE group_id = ?`,
          [audio_url || '', transcript_text || '', review_notes || '', course_name || '', now, gid]
        );
      } else {
        const noteId = `ain_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
        await run(
          `INSERT INTO group_ai_notes
            (note_id, group_id, audio_url, transcript_text, review_notes, course_name, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            noteId,
            gid,
            audio_url || '',
            transcript_text || '',
            review_notes || '',
            course_name || '',
            now,
            now,
          ]
        );
      }
      saved.push(String(gid));
    }

    if (saved.length === 0) {
      return res.status(403).json(forbidden('没有可写入的课程群'));
    }

    return res.json(success({ group_ids: saved }, `已写入 ${saved.length} 个课程群`));
  } catch (e: any) {
    console.error(e);
    return res.status(500).json(error(e.message || '批量保存失败'));
  }
}
