import { Request, Response } from 'express';
import { query } from '../utils/db';
import { success, error, pagination } from '../utils/response';
import type { CourseGroup } from '../types';
import { SEED_COURSE_TREE } from '../utils/course-tree';

export async function getGroups(req: Request, res: Response) {
  const { school_id, course_id, keyword, category_id, page = 1, page_size = 10 } = req.query;

  try {
    let sql = `
      SELECT cg.*, s.name as school_name, c.name as course_name,
        u.nickname as tutor_nickname, u.avatar as tutor_avatar
      FROM course_groups cg
      LEFT JOIN courses c ON cg.course_id = c.course_id
      LEFT JOIN schools s ON c.school_id = s.school_id
      LEFT JOIN users u ON cg.tutor_id = u.user_id
      WHERE cg.status = 'active' AND IFNULL(cg.audit_status, 'approved') = 'approved'
    `;

    const params: any[] = [];

    if (school_id) {
      sql += ' AND c.school_id = ?';
      params.push(school_id);
    }

    if (course_id) {
      sql += ' AND cg.course_id = ?';
      params.push(course_id);
    }

    if (keyword) {
      sql += ' AND (cg.name LIKE ? OR c.name LIKE ? OR IFNULL(u.nickname, "") LIKE ?)';
      const like = `%${keyword}%`;
      params.push(like, like, like);
    }

    if (category_id && !keyword) {
      const cat = SEED_COURSE_TREE.find((x) => x.id === String(category_id));
      if (cat && cat.courses.length > 0) {
        const placeholders = cat.courses.map(() => '?').join(',');
        sql += ` AND c.name IN (${placeholders})`;
        params.push(...cat.courses);
      }
    }

    sql += ' ORDER BY cg.member_count DESC, cg.created_at DESC';

    const all = await query(sql, params);
    const total = all.length;
    const offset = (Number(page) - 1) * Number(page_size);
    const groups = all.slice(offset, offset + Number(page_size));

    res.json(success(pagination(groups, total, Number(page), Number(page_size)), '获取成功'));
  } catch (err) {
    console.error(err);
    res.json(error('获取课程群列表失败'));
  }
}

export async function getGroupDetail(req: Request, res: Response) {
  const { id } = req.params;
  const userId = (req as any).user?.user_id;

  try {
    const groups = await query(
      `
      SELECT cg.*, s.name as school_name, c.name as course_name, c.code as course_code,
        u.nickname as tutor_nickname, u.avatar as tutor_avatar, u.major as tutor_major
      FROM course_groups cg
      LEFT JOIN courses c ON cg.course_id = c.course_id
      LEFT JOIN schools s ON c.school_id = s.school_id
      LEFT JOIN users u ON cg.tutor_id = u.user_id
      WHERE cg.group_id = ?
    `,
      [id]
    );

    if (groups.length === 0) {
      return res.json(error('课程群不存在', 404));
    }

    const group = groups[0];

    let isMember = false;
    let hasPurchased = false;
    if (userId) {
      const memberships = await query(
        'SELECT * FROM group_members WHERE group_id = ? AND user_id = ?',
        [id, userId]
      );
      isMember = memberships.length > 0;

      const paid = await query(
        `SELECT 1 FROM orders WHERE group_id = ? AND user_id = ? AND status = 'paid' LIMIT 1`,
        [id, userId]
      );
      hasPurchased = paid.length > 0;
    }

    // 企微二维码仅入群/已支付后可见
    const canSeeQr = isMember || hasPurchased;
    const { wecom_qr_url, ...publicFields } = group;

    res.json(
      success(
        {
          ...publicFields,
          is_member: isMember,
          has_purchased: hasPurchased || (isMember && Number(group.price) > 0),
          wecom_qr_url: canSeeQr ? wecom_qr_url || null : null,
          wecom_qr_locked: !canSeeQr,
        },
        '获取成功'
      )
    );
  } catch (err) {
    console.error(err);
    res.json(error('获取课程群详情失败'));
  }
}

export async function createGroup(req: Request, res: Response) {
  const userId = (req as any).user.user_id;
  const { name, description, price = 0, max_members = 100, school_name, course_name, major } = req.body;
  
  if (!name || !school_name || !course_name) {
    return res.json(error('课程群名称、学校和课程名称不能为空'));
  }

  try {
    const user = await query('SELECT * FROM users WHERE user_id = ?', [userId]);
    if (user.length === 0) {
      return res.json(error('用户不存在', 404));
    }

    if (user[0].role !== 'tutor') {
      return res.json(error('需要导师身份才能创建课程群', 403));
    }

    let schoolId = user[0].school_id;
    
    if (!schoolId && school_name) {
      const existingSchool = await query('SELECT school_id FROM schools WHERE name = ?', [school_name]);
      if (existingSchool.length > 0) {
        schoolId = existingSchool[0].school_id;
      } else {
        schoolId = 'sch' + Date.now().toString(36);
        await query(`
          INSERT INTO schools (school_id, name, province, city, type)
          VALUES (?, ?, '', '', 'ordinary')
        `, [schoolId, school_name]);
      }
    }

    let courseId = '';
    const existingCourse = await query(
      'SELECT course_id FROM courses WHERE school_id = ? AND name = ?',
      [schoolId, course_name]
    );
    
    if (existingCourse.length > 0) {
      courseId = existingCourse[0].course_id;
    } else {
      courseId = 'course' + Date.now().toString(36);
      await query(`
        INSERT INTO courses (course_id, school_id, name, code, department, credit)
        VALUES (?, ?, ?, '', ?, 3)
      `, [courseId, schoolId, course_name, major || '']);
    }

    const groupId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    
    await query(`
      INSERT INTO course_groups (group_id, tutor_id, course_id, name, description, price, max_members, status, audit_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'active', 'pending')
    `, [groupId, userId, courseId, name, description, price, max_members]);

    await query(`
      INSERT INTO group_members (member_id, group_id, user_id)
      VALUES (?, ?, ?)
    `, [Date.now().toString(36), groupId, userId]);

    const group = await query(`
      SELECT cg.*, s.name as school_name, c.name as course_name, c.department as major
      FROM course_groups cg
      LEFT JOIN courses c ON cg.course_id = c.course_id
      LEFT JOIN schools s ON c.school_id = s.school_id
      WHERE cg.group_id = ?
    `, [groupId]);
    
    res.json(success(group[0], '创建成功'));
  } catch (err) {
    console.error(err);
    res.json(error('创建课程群失败'));
  }
}

export async function joinGroup(req: Request, res: Response) {
  const userId = (req as any).user.user_id;
  const { id } = req.params;

  try {
    const groups = await query('SELECT * FROM course_groups WHERE group_id = ?', [id]);
    if (groups.length === 0) {
      return res.json(error('课程群不存在', 404));
    }

    const group = groups[0];

    if (group.status !== 'active' || (group.audit_status && group.audit_status !== 'approved')) {
      return res.json(error('课程群未通过审核或已关闭', 403));
    }

    if (Number(group.price) > 0) {
      return res.json(error('付费课程群请先下单支付', 400));
    }

    const memberships = await query(
      'SELECT * FROM group_members WHERE group_id = ? AND user_id = ?',
      [id, userId]
    );

    if (memberships.length > 0) {
      return res.json(error('您已加入该课程群'));
    }

    if (group.member_count >= group.max_members) {
      return res.json(error('课程群已满员，无法加入'));
    }

    await query(
      `
      INSERT INTO group_members (member_id, group_id, user_id)
      VALUES (?, ?, ?)
    `,
      [Date.now().toString(36) + Math.random().toString(36).substr(2), id, userId]
    );

    await query('UPDATE course_groups SET member_count = member_count + 1 WHERE group_id = ?', [id]);

    res.json(success(null, '加入成功'));
  } catch (err) {
    console.error(err);
    res.json(error('加入课程群失败'));
  }
}

export async function deleteGroup(req: Request, res: Response) {
  const userId = (req as any).user.user_id;
  const { id } = req.params;

  try {
    const groups = await query('SELECT * FROM course_groups WHERE group_id = ?', [id]);
    if (groups.length === 0) {
      return res.json(error('课程群不存在', 404));
    }
    if (groups[0].tutor_id !== userId) {
      return res.json(error('只能删除自己的课程群', 403));
    }

    await query(`UPDATE course_groups SET status = 'closed' WHERE group_id = ?`, [id]);
    res.json(success(null, '课程群已关闭'));
  } catch (err) {
    console.error(err);
    res.json(error('删除失败'));
  }
}

export async function getMyGroups(req: Request, res: Response) {
  const userId = (req as any).user.user_id;
  const role = (req as any).user.role;

  try {
    let groups;
    if (role === 'tutor') {
      groups = await query(
        `
        SELECT cg.*, c.name as course_name, u.nickname as tutor_nickname
        FROM course_groups cg
        LEFT JOIN courses c ON cg.course_id = c.course_id
        LEFT JOIN users u ON cg.tutor_id = u.user_id
        WHERE cg.tutor_id = ? AND cg.status != 'closed'
        ORDER BY cg.created_at DESC
      `,
        [userId]
      );
    } else {
      groups = await query(
        `
        SELECT cg.*, c.name as course_name, u.nickname as tutor_nickname
        FROM group_members gm
        JOIN course_groups cg ON gm.group_id = cg.group_id
        JOIN courses c ON cg.course_id = c.course_id
        JOIN users u ON cg.tutor_id = u.user_id
        WHERE gm.user_id = ? AND cg.status = 'active'
        ORDER BY gm.joined_at DESC
      `,
        [userId]
      );
    }

    res.json(success(groups, '获取成功'));
  } catch (err) {
    console.error(err);
    res.json(error('获取我的课程群失败'));
  }
}
