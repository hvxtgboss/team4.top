import { Request, Response } from 'express';
import { query } from '../utils/db';
import { success, error } from '../utils/response';

export async function applyTutor(req: Request, res: Response) {
  const userId = (req as any).user.user_id;
  const { real_name, gpa, rank_percent, course_experience, hourly_rate } = req.body;
  
  if (!real_name) {
    return res.json(error('真实姓名不能为空'));
  }

  try {
    const existingProfile = await query(
      'SELECT * FROM tutor_profiles WHERE user_id = ?',
      [userId]
    );
    
    if (existingProfile.length > 0) {
      await query(`
        UPDATE tutor_profiles SET real_name = ?, gpa = ?, rank_percent = ?,
          course_experience = ?, hourly_rate = ?, apply_status = 'pending', approved_at = NULL
        WHERE user_id = ?
      `, [real_name, gpa, rank_percent, course_experience, hourly_rate, userId]);
    } else {
      const profileId = Date.now().toString(36) + Math.random().toString(36).substr(2);

      await query(
        `
        INSERT INTO tutor_profiles (profile_id, user_id, real_name, gpa, rank_percent, course_experience, hourly_rate)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
        [profileId, userId, real_name, gpa, rank_percent, course_experience, hourly_rate]
      );
    }

    // 申请后仍为学生，审核通过后再升为导师
    res.json(success(null, '申请提交成功，请等待审核'));
  } catch (err) {
    console.error(err);
    res.json(error('申请失败'));
  }
}

export async function getTutorProfile(req: Request, res: Response) {
  const userId = (req as any).user.user_id;
  
  try {
    const profiles = await query(`
      SELECT tp.*, u.nickname, u.avatar, u.school_id, u.major, s.name as school_name
      FROM tutor_profiles tp
      LEFT JOIN users u ON tp.user_id = u.user_id
      LEFT JOIN schools s ON u.school_id = s.school_id
      WHERE tp.user_id = ?
    `, [userId]);
    
    if (profiles.length === 0) {
      return res.json(error('导师资料不存在'));
    }
    
    res.json(success(profiles[0], '获取成功'));
  } catch (err) {
    console.error(err);
    res.json(error('获取导师资料失败'));
  }
}

export async function getTutorDetail(req: Request, res: Response) {
  const { id } = req.params;
  
  try {
    const profiles = await query(`
      SELECT tp.*, u.nickname, u.avatar, u.school_id, u.major, u.phone, s.name as school_name,
        (SELECT COUNT(*) FROM course_groups WHERE tutor_id = u.user_id) as group_count,
        (SELECT COUNT(*) FROM group_members WHERE group_id IN (SELECT group_id FROM course_groups WHERE tutor_id = u.user_id)) as student_count
      FROM tutor_profiles tp
      LEFT JOIN users u ON tp.user_id = u.user_id
      LEFT JOIN schools s ON u.school_id = s.school_id
      WHERE tp.user_id = ? AND tp.apply_status = 'approved'
    `, [id]);
    
    if (profiles.length === 0) {
      return res.json(error('导师不存在或未通过审核', 404));
    }
    
    const groups = await query(`
      SELECT cg.*, c.name as course_name, s.name as school_name
      FROM course_groups cg
      LEFT JOIN courses c ON cg.course_id = c.course_id
      LEFT JOIN schools s ON c.school_id = s.school_id
      WHERE cg.tutor_id = ? AND cg.status = 'active' AND IFNULL(cg.audit_status, 'approved') = 'approved'
      ORDER BY cg.created_at DESC
    `, [id]);
    
    res.json(success({
      profile: profiles[0],
      groups,
    }, '获取成功'));
  } catch (err) {
    console.error(err);
    res.json(error('获取导师详情失败'));
  }
}

export async function getTutors(req: Request, res: Response) {
  const { school_id, keyword, course, page = 1, page_size = 10 } = req.query;

  try {
    let sql = `
      SELECT tp.*, u.nickname, u.avatar, u.school_id, u.major, s.name as school_name,
        (SELECT COUNT(*) FROM course_groups WHERE tutor_id = u.user_id) as group_count,
        (SELECT COUNT(*) FROM group_members WHERE group_id IN (SELECT group_id FROM course_groups WHERE tutor_id = u.user_id)) as student_count
      FROM tutor_profiles tp
      LEFT JOIN users u ON tp.user_id = u.user_id
      LEFT JOIN schools s ON u.school_id = s.school_id
      WHERE tp.apply_status = 'approved'
    `;

    const params: any[] = [];

    if (school_id) {
      sql += ' AND u.school_id = ?';
      params.push(school_id);
    }

    if (course) {
      sql += ` AND (
        EXISTS (SELECT 1 FROM tutor_course_scores tcs WHERE tcs.user_id = u.user_id AND tcs.course_name LIKE ?)
        OR EXISTS (
          SELECT 1 FROM course_groups cg
          JOIN courses c ON cg.course_id = c.course_id
          WHERE cg.tutor_id = u.user_id AND c.name LIKE ?
        )
        OR IFNULL(tp.course_experience, '') LIKE ?
      )`;
      const like = `%${course}%`;
      params.push(like, like, like);
    }

    if (keyword) {
      sql += ' AND (u.nickname LIKE ? OR s.name LIKE ? OR IFNULL(u.major, "") LIKE ? OR IFNULL(tp.course_experience, "") LIKE ?)';
      const like = `%${keyword}%`;
      params.push(like, like, like, like);
    }

    sql += ' ORDER BY tp.approved_at DESC';

    const all = await query(sql, params);
    const total = all.length;
    const offset = (Number(page) - 1) * Number(page_size);
    const tutors = all.slice(offset, offset + Number(page_size));

    res.json(
      success(
        {
          list: tutors,
          total,
          page: Number(page),
          page_size: Number(page_size),
        },
        '获取成功'
      )
    );
  } catch (err) {
    console.error(err);
    res.json(error('获取导师列表失败'));
  }
}

/** 导师名下课程群的学生（group_members） */
export async function getMyStudents(req: Request, res: Response) {
  const tutorId = (req as any).user.user_id;
  const { group_id } = req.query;

  try {
    let sql = `
      SELECT gm.member_id, gm.joined_at, gm.group_id,
             u.user_id, u.nickname, u.avatar, u.phone, u.major, u.grade,
             s.name as school_name, cg.name as group_name
      FROM group_members gm
      INNER JOIN course_groups cg ON gm.group_id = cg.group_id
      INNER JOIN users u ON gm.user_id = u.user_id
      LEFT JOIN schools s ON u.school_id = s.school_id
      WHERE cg.tutor_id = ?
    `;
    const params: any[] = [tutorId];

    if (group_id) {
      sql += ' AND gm.group_id = ?';
      params.push(group_id);
    }

    sql += ' ORDER BY gm.joined_at DESC';
    const list = await query(sql, params);

    res.json(success({ list, total: list.length }, '获取成功'));
  } catch (err) {
    console.error(err);
    res.json(error('获取学生列表失败'));
  }
}

/** 导师收益：其课程群上已支付订单 */
export async function getMyEarnings(req: Request, res: Response) {
  const tutorId = (req as any).user.user_id;

  try {
    const orders = await query(
      `
      SELECT o.*, cg.name as group_name, u.nickname as student_nickname
      FROM orders o
      INNER JOIN course_groups cg ON o.group_id = cg.group_id
      LEFT JOIN users u ON o.user_id = u.user_id
      WHERE cg.tutor_id = ? AND o.status = 'paid'
      ORDER BY o.paid_at DESC
    `,
      [tutorId]
    );

    const totalAmount = orders.reduce((sum: number, o: any) => sum + (Number(o.amount) || 0), 0);

    res.json(
      success(
        {
          total_amount: totalAmount,
          order_count: orders.length,
          list: orders,
        },
        '获取成功'
      )
    );
  } catch (err) {
    console.error(err);
    res.json(error('获取收益失败'));
  }
}

/** 按课程 / 分类推荐导师（真实 tutor_course_scores） */
export async function getRecommendTutors(req: Request, res: Response) {
  const { course, category_id, page_size = 8 } = req.query;

  try {
    let sql = `
      SELECT tcs.course_name, tcs.category_id, tcs.score, tcs.student_count,
             u.user_id, u.nickname, u.avatar, u.major, u.school_id,
             s.name as school_name, tp.gpa,
             (SELECT COUNT(*) FROM course_groups WHERE tutor_id = u.user_id AND IFNULL(audit_status,'approved')='approved') as group_count
      FROM tutor_course_scores tcs
      INNER JOIN users u ON tcs.user_id = u.user_id
      LEFT JOIN schools s ON u.school_id = s.school_id
      LEFT JOIN tutor_profiles tp ON tp.user_id = u.user_id
      WHERE u.role = 'tutor' AND IFNULL(tp.apply_status, 'approved') = 'approved'
    `;
    const params: any[] = [];

    if (course) {
      sql += ' AND tcs.course_name = ?';
      params.push(course);
    } else if (category_id) {
      sql += ' AND tcs.category_id = ?';
      params.push(category_id);
    }

    sql += ' ORDER BY tcs.score DESC LIMIT ?';
    params.push(Number(page_size));

    const list = await query(sql, params);
    res.json(success({ list, total: list.length }, '获取成功'));
  } catch (err) {
    console.error(err);
    res.json(error('获取推荐导师失败'));
  }
}
