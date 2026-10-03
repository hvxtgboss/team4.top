import { Request, Response } from 'express';
import { query } from '../utils/db';
import { success, error, pagination } from '../utils/response';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function getMaterials(req: Request, res: Response) {
  const { page = 1, page_size = 10, status, mine } = req.query;
  const userId = (req as any).user.user_id;
  const role = (req as any).user.role;

  try {
    let sql = `
      SELECT m.*, u.nickname as uploader_nickname, cg.name as group_name
      FROM materials m
      LEFT JOIN users u ON m.user_id = u.user_id
      LEFT JOIN course_groups cg ON m.group_id = cg.group_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (mine === '1' || mine === 'true') {
      sql += ' AND m.user_id = ?';
      params.push(userId);
      if (status) {
        sql += ' AND m.status = ?';
        params.push(status);
      }
    } else if (role === 'tutor' && status) {
      // 导师查看自己群内资料（含 pending）
      sql += ' AND cg.tutor_id = ? AND m.status = ?';
      params.push(userId, status);
    } else {
      sql += ` AND m.status = 'approved'`;
    }

    sql += ' ORDER BY m.created_at DESC';

    const all = await query(sql, params);
    const total = all.length;
    const offset = (Number(page) - 1) * Number(page_size);
    const materials = all.slice(offset, offset + Number(page_size));

    res.json(success(pagination(materials, total, Number(page), Number(page_size)), '获取成功'));
  } catch (err) {
    console.error(err);
    res.json(error('获取资料列表失败'));
  }
}

export async function getGroupMaterials(req: Request, res: Response) {
  const { groupId } = req.params;
  const userId = (req as any).user.user_id;
  const { page = 1, page_size = 10 } = req.query;
  
  try {
    const memberships = await query(
      'SELECT * FROM group_members WHERE group_id = ? AND user_id = ?',
      [groupId, userId]
    );
    
    if (memberships.length === 0) {
      return res.json(error('您不是该课程群成员，无法查看资料', 403));
    }
    
    let sql = `
      SELECT m.*, u.nickname as uploader_nickname
      FROM materials m
      LEFT JOIN users u ON m.user_id = u.user_id
      WHERE m.group_id = ? AND m.status = 'approved'
    `;
    
    const params: any[] = [groupId];
    
    sql += ' ORDER BY m.created_at DESC';
    
    const countSql = sql.replace(/SELECT.*FROM/, 'SELECT COUNT(*) as total FROM');
    const countResult = await query(countSql, params);
    const total = countResult.length > 0 ? countResult[0].total : 0;
    
    const offset = (Number(page) - 1) * Number(page_size);
    sql += ' LIMIT ? OFFSET ?';
    params.push(Number(page_size), offset);
    
    const materials = await query(sql, params);
    
    res.json(success(pagination(materials, total, Number(page), Number(page_size)), '获取成功'));
  } catch (err) {
    console.error(err);
    res.json(error('获取资料列表失败'));
  }
}

export async function uploadMaterial(req: Request, res: Response) {
  const userId = (req as any).user.user_id;
  const { group_id, title, description } = req.body;
  const file = (req as any).file;
  
  if (!group_id || !title || !file) {
    return res.json(error('群ID、标题和文件不能为空'));
  }

  try {
    const user = await query('SELECT role FROM users WHERE user_id = ?', [userId]);
    if (user.length === 0) {
      return res.json(error('用户不存在', 404));
    }
    
    if (user[0].role !== 'tutor') {
      return res.json(error('只有导师可以上传资料', 403));
    }
    
    const groups = await query(
      'SELECT * FROM course_groups WHERE group_id = ? AND tutor_id = ?',
      [group_id, userId]
    );
    
    if (groups.length === 0) {
      return res.json(error('您不是该课程群的导师', 403));
    }

    const materialId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    const fileUrl = `/api/materials/download/${materialId}`;
    
    const uploadsDir = path.join(__dirname, '../../uploads/materials');
    const originalFilePath = path.join(uploadsDir, file.filename);
    const newFilename = materialId + path.extname(file.originalname);
    const newFilePath = path.join(uploadsDir, newFilename);
    fs.renameSync(originalFilePath, newFilePath);
    
    await query(`
      INSERT INTO materials (material_id, group_id, user_id, title, file_url, file_type, file_size, description, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `, [materialId, group_id, userId, title, fileUrl, file.mimetype, file.size, description]);

    res.json(success({
      material_id: materialId,
      title,
      file_url: fileUrl,
      file_type: file.mimetype,
      file_size: file.size,
      status: 'pending',
    }, '上传成功，等待管理员审核'));
  } catch (err) {
    console.error(err);
    res.json(error('上传失败'));
  }
}

export async function downloadMaterial(req: Request, res: Response) {
  const { id } = req.params;
  const userId = (req as any).user.user_id;
  
  try {
    const materials = await query('SELECT * FROM materials WHERE material_id = ?', [id]);
    
    if (materials.length === 0) {
      return res.json(error('资料不存在', 404));
    }
    
    const material = materials[0];
    
    const memberships = await query(
      'SELECT * FROM group_members WHERE group_id = ? AND user_id = ?',
      [material.group_id, userId]
    );
    
    if (memberships.length === 0) {
      return res.json(error('您不是该课程群成员，无法下载资料', 403));
    }
    
    const uploadsDir = path.join(__dirname, '../../uploads/materials');
    const files = fs.readdirSync(uploadsDir);
    const matchedFile = files.find(f => f.startsWith(material.material_id));
    
    if (!matchedFile) {
      return res.json(error('文件不存在', 404));
    }
    
    const filePath = path.join(uploadsDir, matchedFile);
    
    await query(
      'UPDATE materials SET download_count = download_count + 1 WHERE material_id = ?',
      [id]
    );
    
    res.download(filePath, (err) => {
      if (err) {
        console.error(err);
        res.json(error('下载失败'));
      }
    });
  } catch (err) {
    console.error(err);
    res.json(error('下载失败'));
  }
}

export async function deleteMaterial(req: Request, res: Response) {
  const { id } = req.params;
  const userId = (req as any).user.user_id;
  
  try {
    const materials = await query(
      'SELECT m.*, cg.tutor_id FROM materials m LEFT JOIN course_groups cg ON m.group_id = cg.group_id WHERE m.material_id = ?',
      [id]
    );
    
    if (materials.length === 0) {
      return res.json(error('资料不存在', 404));
    }
    
    const material = materials[0];
    
    if (material.tutor_id !== userId) {
      return res.json(error('只有课程群导师可以删除资料', 403));
    }
    
    const uploadsDir = path.join(__dirname, '../../uploads/materials');
    const files = fs.readdirSync(uploadsDir);
    const matchedFile = files.find(f => f.startsWith(material.material_id));
    
    if (matchedFile) {
      const filePath = path.join(uploadsDir, matchedFile);
      fs.unlinkSync(filePath);
    }
    
    await query('DELETE FROM materials WHERE material_id = ?', [id]);
    
    res.json(success(null, '删除成功'));
  } catch (err) {
    console.error(err);
    res.json(error('删除失败'));
  }
}
