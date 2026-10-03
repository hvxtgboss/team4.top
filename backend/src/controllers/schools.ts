import { Request, Response } from 'express';
import { query } from '../utils/db';
import { success, error } from '../utils/response';

export async function getSchools(req: Request, res: Response) {
  try {
    const schools = await query('SELECT * FROM schools ORDER BY name ASC');
    res.json(success(schools, '获取成功'));
  } catch (err) {
    console.error(err);
    res.json(error('获取学校列表失败'));
  }
}

export async function getSchoolDetail(req: Request, res: Response) {
  const { id } = req.params;
  
  try {
    const schools = await query('SELECT * FROM schools WHERE school_id = ?', [id]);
    
    if (schools.length === 0) {
      return res.json(error('学校不存在', 404));
    }
    
    const courses = await query(
      'SELECT * FROM courses WHERE school_id = ? ORDER BY name ASC',
      [id]
    );
    
    res.json(success({
      school: schools[0],
      courses,
    }, '获取成功'));
  } catch (err) {
    console.error(err);
    res.json(error('获取学校详情失败'));
  }
}

export async function getCourses(req: Request, res: Response) {
  const { school_id } = req.query;
  
  try {
    let sql = 'SELECT * FROM courses ORDER BY name ASC';
    const params: any[] = [];
    
    if (school_id) {
      sql = 'SELECT * FROM courses WHERE school_id = ? ORDER BY name ASC';
      params.push(school_id);
    }
    
    const courses = await query(sql, params);
    res.json(success(courses, '获取成功'));
  } catch (err) {
    console.error(err);
    res.json(error('获取课程列表失败'));
  }
}

export async function getMajors(req: Request, res: Response) {
  const { category } = req.query;

  try {
    let sql = 'SELECT * FROM majors ORDER BY category ASC, name ASC';
    const params: any[] = [];

    if (category) {
      sql = 'SELECT * FROM majors WHERE category = ? ORDER BY name ASC';
      params.push(category);
    }

    const majors = await query(sql, params);
    res.json(success(majors, '获取成功'));
  } catch (err) {
    console.error(err);
    res.json(error('获取专业列表失败'));
  }
}
