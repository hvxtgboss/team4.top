import { Request, Response } from 'express';
import { query, run } from '../utils/db';
import { generateToken } from '../utils/jwt';
import { success, error } from '../utils/response';
import type { User } from '../types';

export async function register(req: Request, res: Response) {
  const { phone, nickname, school_id, school_college, major, grade, student_id } = req.body;
  // 注册一律为普通学生；导师需申请审核，管理员由系统配置
  const role = 'student';
  
  if (!phone || !nickname) {
    return res.json(error('手机号和昵称不能为空'));
  }

  if (!school_id) {
    return res.json(error('请选择学校'));
  }

  try {
    const existingUser = await query<User>('SELECT * FROM users WHERE phone = ?', [phone]);
    if (existingUser.length > 0) {
      return res.json(error('该手机号已注册'));
    }

    const userId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    
    await run(`
      INSERT INTO users (user_id, phone, nickname, role, school_id, school_college, major, grade, student_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [userId, phone, nickname, role, school_id, school_college, major, grade, student_id]);

    const token = generateToken({ user_id: userId, role });
    
    const user = await query<User>('SELECT * FROM users WHERE user_id = ?', [userId]);
    
    res.json(success({
      user: user[0],
      token,
    }, '注册成功'));
  } catch (err) {
    console.error(err);
    res.json(error('注册失败'));
  }
}

export async function login(req: Request, res: Response) {
  const { phone } = req.body;
  
  if (!phone) {
    return res.json(error('手机号不能为空'));
  }

  try {
    const users = await query<User>('SELECT * FROM users WHERE phone = ?', [phone]);
    
    if (users.length === 0) {
      const userId = Date.now().toString(36) + Math.random().toString(36).substr(2);
      const nickname = `用户${phone.slice(-4)}`;
      
      await run(`
        INSERT INTO users (user_id, phone, nickname, role)
        VALUES (?, ?, ?, 'student')
      `, [userId, phone, nickname]);

      const token = generateToken({ user_id: userId, role: 'student' });
      const user = await query<User>('SELECT * FROM users WHERE user_id = ?', [userId]);
      
      return res.json(success({
        user: user[0],
        token,
      }, '登录成功（自动注册）'));
    }

    const user = users[0];
    const token = generateToken({ user_id: user.user_id, role: user.role });
    
    res.json(success({
      user,
      token,
    }, '登录成功'));
  } catch (err) {
    console.error(err);
    res.json(error('登录失败'));
  }
}

export async function getUserInfo(req: Request, res: Response) {
  const userId = (req as any).user.user_id;
  
  try {
    const users = await query<User>('SELECT * FROM users WHERE user_id = ?', [userId]);
    
    if (users.length === 0) {
      return res.json(error('用户不存在', 404));
    }

    res.json(success(users[0], '获取成功'));
  } catch (err) {
    console.error(err);
    res.json(error('获取用户信息失败'));
  }
}

export async function updateUserInfo(req: Request, res: Response) {
  const userId = (req as any).user.user_id;
  const { nickname, avatar, school_id, school_college, major, grade, student_id } = req.body;
  
  try {
    await run(`
      UPDATE users SET nickname = COALESCE(?, nickname), avatar = COALESCE(?, avatar),
        school_id = COALESCE(?, school_id), school_college = COALESCE(?, school_college),
        major = COALESCE(?, major), grade = COALESCE(?, grade),
        student_id = COALESCE(?, student_id)
      WHERE user_id = ?
    `, [nickname, avatar, school_id, school_college, major, grade, student_id, userId]);

    const users = await query<User>('SELECT * FROM users WHERE user_id = ?', [userId]);
    
    res.json(success(users[0], '更新成功'));
  } catch (err) {
    console.error(err);
    res.json(error('更新失败'));
  }
}
