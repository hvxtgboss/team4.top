import { Request, Response } from 'express';
import { query, run } from '../utils/db';
import { success, error, pagination } from '../utils/response';

export async function getStats(_req: Request, res: Response) {
  try {
    const users = await query<{ c: number }>('SELECT COUNT(*) as c FROM users');
    const groups = await query<{ c: number }>('SELECT COUNT(*) as c FROM course_groups');
    const materials = await query<{ c: number }>('SELECT COUNT(*) as c FROM materials');
    const tutors = await query<{ c: number }>(
      `SELECT COUNT(*) as c FROM users WHERE role = 'tutor'`
    );
    const questions = await query<{ c: number }>('SELECT COUNT(*) as c FROM qa_threads');
    const pendingTutor = await query<{ c: number }>(
      `SELECT COUNT(*) as c FROM tutor_profiles WHERE apply_status = 'pending'`
    );
    const pendingMaterials = await query<{ c: number }>(
      `SELECT COUNT(*) as c FROM materials WHERE status = 'pending'`
    );

    const pendingGroups = await query<{ c: number }>(
      `SELECT COUNT(*) as c FROM course_groups WHERE IFNULL(audit_status, 'approved') = 'pending'`
    );

    res.json(
      success(
        {
          totalUsers: users[0]?.c ?? 0,
          totalGroups: groups[0]?.c ?? 0,
          totalMaterials: materials[0]?.c ?? 0,
          totalTutors: tutors[0]?.c ?? 0,
          totalQuestions: questions[0]?.c ?? 0,
          pendingTutorAudit: pendingTutor[0]?.c ?? 0,
          pendingMaterialAudit: pendingMaterials[0]?.c ?? 0,
          pendingGroupAudit: pendingGroups[0]?.c ?? 0,
          pendingComplaints: 0,
        },
        '获取成功'
      )
    );
  } catch (err) {
    console.error(err);
    res.json(error('获取统计失败'));
  }
}

export async function listUsers(req: Request, res: Response) {
  const { role, keyword, page = 1, page_size = 20 } = req.query;

  try {
    let sql = `
      SELECT u.*, s.name as school_name
      FROM users u
      LEFT JOIN schools s ON u.school_id = s.school_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (role) {
      sql += ' AND u.role = ?';
      params.push(role);
    }
    if (keyword) {
      sql += ' AND (u.nickname LIKE ? OR u.phone LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    sql += ' ORDER BY u.created_at DESC';

    const all = await query(sql, params);
    const total = all.length;
    const offset = (Number(page) - 1) * Number(page_size);
    const list = all.slice(offset, offset + Number(page_size));

    res.json(success(pagination(list, total, Number(page), Number(page_size)), '获取成功'));
  } catch (err) {
    console.error(err);
    res.json(error('获取用户列表失败'));
  }
}

export async function listTutorApplications(req: Request, res: Response) {
  const { status = 'pending' } = req.query;

  try {
    const list = await query(
      `
      SELECT tp.*, u.nickname, u.phone, u.avatar, u.school_id, u.major, s.name as school_name
      FROM tutor_profiles tp
      LEFT JOIN users u ON tp.user_id = u.user_id
      LEFT JOIN schools s ON u.school_id = s.school_id
      WHERE tp.apply_status = ?
      ORDER BY tp.created_at DESC
    `,
      [status]
    );

    res.json(success({ list, total: list.length }, '获取成功'));
  } catch (err) {
    console.error(err);
    res.json(error('获取导师申请失败'));
  }
}

export async function approveTutor(req: Request, res: Response) {
  const { userId } = req.params;

  try {
    const profiles = await query('SELECT * FROM tutor_profiles WHERE user_id = ?', [userId]);
    if (profiles.length === 0) {
      return res.json(error('申请不存在', 404));
    }

    await run(
      `UPDATE tutor_profiles
       SET apply_status = 'approved', approved_at = CURRENT_TIMESTAMP
       WHERE user_id = ?`,
      [userId]
    );
    await run(`UPDATE users SET role = 'tutor' WHERE user_id = ?`, [userId]);

    res.json(success({ user_id: userId, role: 'tutor' }, '已通过导师申请'));
  } catch (err) {
    console.error(err);
    res.json(error('审核失败'));
  }
}

export async function rejectTutor(req: Request, res: Response) {
  const { userId } = req.params;

  try {
    const profiles = await query('SELECT * FROM tutor_profiles WHERE user_id = ?', [userId]);
    if (profiles.length === 0) {
      return res.json(error('申请不存在', 404));
    }

    await run(
      `UPDATE tutor_profiles
       SET apply_status = 'rejected', approved_at = NULL
       WHERE user_id = ?`,
      [userId]
    );
    // 保持学生身份
    await run(`UPDATE users SET role = 'student' WHERE user_id = ? AND role != 'admin'`, [
      userId,
    ]);

    res.json(success({ user_id: userId, apply_status: 'rejected' }, '已拒绝导师申请'));
  } catch (err) {
    console.error(err);
    res.json(error('审核失败'));
  }
}

export async function listPendingMaterials(req: Request, res: Response) {
  const { status = 'pending' } = req.query;
  try {
    const list = await query(
      `
      SELECT m.*, u.nickname as uploader_nickname, cg.name as group_name
      FROM materials m
      LEFT JOIN users u ON m.user_id = u.user_id
      LEFT JOIN course_groups cg ON m.group_id = cg.group_id
      WHERE m.status = ?
      ORDER BY m.created_at DESC
    `,
      [status]
    );
    res.json(success({ list, total: list.length }, '获取成功'));
  } catch (err) {
    console.error(err);
    res.json(error('获取资料列表失败'));
  }
}

export async function reviewMaterial(req: Request, res: Response) {
  const { id } = req.params;
  const action = (req.body?.action || req.query.action || 'approve') as string;
  const next = action === 'reject' ? 'rejected' : 'approved';

  try {
    const rows = await query('SELECT * FROM materials WHERE material_id = ?', [id]);
    if (rows.length === 0) return res.json(error('资料不存在', 404));
    await run(`UPDATE materials SET status = ? WHERE material_id = ?`, [next, id]);
    res.json(success({ material_id: id, status: next }, next === 'approved' ? '已通过' : '已拒绝'));
  } catch (err) {
    console.error(err);
    res.json(error('审核失败'));
  }
}

export async function listPendingGroups(req: Request, res: Response) {
  const { status = 'pending' } = req.query;
  try {
    const list = await query(
      `
      SELECT cg.*, u.nickname as tutor_nickname, c.name as course_name, s.name as school_name
      FROM course_groups cg
      LEFT JOIN users u ON cg.tutor_id = u.user_id
      LEFT JOIN courses c ON cg.course_id = c.course_id
      LEFT JOIN schools s ON c.school_id = s.school_id
      WHERE IFNULL(cg.audit_status, 'approved') = ?
      ORDER BY cg.created_at DESC
    `,
      [status]
    );
    res.json(success({ list, total: list.length }, '获取成功'));
  } catch (err) {
    console.error(err);
    res.json(error('获取课程群列表失败'));
  }
}

export async function reviewGroup(req: Request, res: Response) {
  const { id } = req.params;
  const action = (req.body?.action || req.query.action || 'approve') as string;
  const next = action === 'reject' ? 'rejected' : 'approved';

  try {
    const rows = await query('SELECT * FROM course_groups WHERE group_id = ?', [id]);
    if (rows.length === 0) return res.json(error('课程群不存在', 404));
    await run(`UPDATE course_groups SET audit_status = ? WHERE group_id = ?`, [next, id]);
    res.json(success({ group_id: id, audit_status: next }, next === 'approved' ? '已通过' : '已拒绝'));
  } catch (err) {
    console.error(err);
    res.json(error('审核失败'));
  }
}
