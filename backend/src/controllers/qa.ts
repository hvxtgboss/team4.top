import { Request, Response } from 'express';
import { query } from '../utils/db';
import { success, error, pagination } from '../utils/response';

async function isGroupMemberOrTutor(groupId: string, userId: string): Promise<boolean> {
  const memberships = await query(
    'SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?',
    [groupId, userId]
  );
  if (memberships.length > 0) return true;

  const owned = await query(
    'SELECT 1 FROM course_groups WHERE group_id = ? AND tutor_id = ?',
    [groupId, userId]
  );
  return owned.length > 0;
}

export async function getThreads(req: Request, res: Response) {
  const { group_id, is_solved, page = 1, page_size = 10 } = req.query;

  try {
    let sql = `
      SELECT qt.*, u.nickname as author_nickname, u.avatar as author_avatar,
        (SELECT COUNT(*) FROM qa_replies WHERE thread_id = qt.thread_id) as reply_count
      FROM qa_threads qt
      LEFT JOIN users u ON qt.user_id = u.user_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (group_id) {
      sql += ' AND qt.group_id = ?';
      params.push(group_id);
    }

    if (is_solved !== undefined) {
      sql += ' AND qt.is_solved = ?';
      params.push(is_solved === 'true' || is_solved === '1' ? 1 : 0);
    }

    sql += ' ORDER BY qt.created_at DESC';

    const all = await query(sql, params);
    const total = all.length;
    const offset = (Number(page) - 1) * Number(page_size);
    const threads = all.slice(offset, offset + Number(page_size));

    res.json(success(pagination(threads, total, Number(page), Number(page_size)), '获取成功'));
  } catch (err) {
    console.error(err);
    res.json(error('获取问答列表失败'));
  }
}

export async function createThread(req: Request, res: Response) {
  const userId = (req as any).user.user_id;
  const { group_id, title, content } = req.body;

  if (!group_id || !title || !content) {
    return res.json(error('群ID、标题和内容不能为空'));
  }

  try {
    if (!(await isGroupMemberOrTutor(group_id, userId))) {
      return res.json(error('您不是该群成员', 403));
    }

    const threadId = Date.now().toString(36) + Math.random().toString(36).substr(2);

    await query(
      `
      INSERT INTO qa_threads (thread_id, group_id, user_id, title, content)
      VALUES (?, ?, ?, ?, ?)
    `,
      [threadId, group_id, userId, title, content]
    );

    res.json(success({ thread_id: threadId }, '提问成功'));
  } catch (err) {
    console.error(err);
    res.json(error('提问失败'));
  }
}

export async function getThreadDetail(req: Request, res: Response) {
  const { id } = req.params;

  try {
    await query('UPDATE qa_threads SET view_count = view_count + 1 WHERE thread_id = ?', [id]);

    const threads = await query(
      `
      SELECT qt.*, u.nickname as author_nickname, u.avatar as author_avatar
      FROM qa_threads qt
      LEFT JOIN users u ON qt.user_id = u.user_id
      WHERE qt.thread_id = ?
    `,
      [id]
    );

    if (threads.length === 0) {
      return res.json(error('问题不存在', 404));
    }

    const replies = await query(
      `
      SELECT qr.*, u.nickname as reply_nickname, u.avatar as reply_avatar, u.role as reply_role
      FROM qa_replies qr
      LEFT JOIN users u ON qr.user_id = u.user_id
      WHERE qr.thread_id = ?
      ORDER BY qr.created_at ASC
    `,
      [id]
    );

    res.json(
      success(
        {
          thread: threads[0],
          replies,
        },
        '获取成功'
      )
    );
  } catch (err) {
    console.error(err);
    res.json(error('获取问题详情失败'));
  }
}

export async function createReply(req: Request, res: Response) {
  const userId = (req as any).user.user_id;
  const { id } = req.params;
  const { content } = req.body;

  if (!content) {
    return res.json(error('回答内容不能为空'));
  }

  try {
    const threads = await query('SELECT * FROM qa_threads WHERE thread_id = ?', [id]);
    if (threads.length === 0) {
      return res.json(error('问题不存在', 404));
    }

    const groupId = threads[0].group_id;
    if (!(await isGroupMemberOrTutor(groupId, userId))) {
      return res.json(error('您不是该群成员', 403));
    }

    const replyId = Date.now().toString(36) + Math.random().toString(36).substr(2);

    await query(
      `
      INSERT INTO qa_replies (reply_id, thread_id, user_id, content)
      VALUES (?, ?, ?, ?)
    `,
      [replyId, id, userId, content]
    );

    res.json(success({ reply_id: replyId }, '回答成功'));
  } catch (err) {
    console.error(err);
    res.json(error('回答失败'));
  }
}

export async function acceptReply(req: Request, res: Response) {
  const userId = (req as any).user.user_id;
  const { id } = req.params;

  try {
    const replies = await query(
      `
      SELECT qr.*, qt.user_id as thread_author_id, qt.thread_id
      FROM qa_replies qr
      JOIN qa_threads qt ON qr.thread_id = qt.thread_id
      WHERE qr.reply_id = ?
    `,
      [id]
    );

    if (replies.length === 0) {
      return res.json(error('回答不存在', 404));
    }

    const reply = replies[0];

    if (reply.thread_author_id !== userId) {
      return res.json(error('只有提问者可以采纳回答', 403));
    }

    await query('UPDATE qa_replies SET is_accepted = 1 WHERE reply_id = ?', [id]);
    await query('UPDATE qa_threads SET is_solved = 1 WHERE thread_id = ?', [reply.thread_id]);

    res.json(success(null, '采纳成功'));
  } catch (err) {
    console.error(err);
    res.json(error('采纳失败'));
  }
}

/** 提问者或群导师可将问题标为已解决（导师工作台用） */
export async function markSolved(req: Request, res: Response) {
  const userId = (req as any).user.user_id;
  const { id } = req.params;

  try {
    const threads = await query('SELECT * FROM qa_threads WHERE thread_id = ?', [id]);
    if (threads.length === 0) {
      return res.json(error('问题不存在', 404));
    }

    const thread = threads[0];
    const isAuthor = thread.user_id === userId;
    const isTutor =
      (
        await query('SELECT 1 FROM course_groups WHERE group_id = ? AND tutor_id = ?', [
          thread.group_id,
          userId,
        ])
      ).length > 0;

    if (!isAuthor && !isTutor) {
      return res.json(error('无权标记已解决', 403));
    }

    await query('UPDATE qa_threads SET is_solved = 1 WHERE thread_id = ?', [id]);
    res.json(success(null, '已标记解决'));
  } catch (err) {
    console.error(err);
    res.json(error('标记失败'));
  }
}
