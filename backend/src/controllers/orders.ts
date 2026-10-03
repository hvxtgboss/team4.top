import { Request, Response } from 'express';
import { query } from '../utils/db';
import { success, error, pagination } from '../utils/response';

export async function createOrder(req: Request, res: Response) {
  const userId = (req as any).user.user_id;
  const { group_id } = req.body;
  
  if (!group_id) {
    return res.json(error('课程群ID不能为空'));
  }

  try {
    const groups = await query('SELECT * FROM course_groups WHERE group_id = ?', [group_id]);
    if (groups.length === 0) {
      return res.json(error('课程群不存在', 404));
    }
    
    const group = groups[0];

    if (group.status !== 'active' || (group.audit_status && group.audit_status !== 'approved')) {
      return res.json(error('课程群未通过审核或已关闭', 403));
    }
    
    const existingOrder = await query(
      'SELECT * FROM orders WHERE user_id = ? AND group_id = ? AND status = ?',
      [userId, group_id, 'pending']
    );
    
    if (existingOrder.length > 0) {
      return res.json(error('已有待支付订单', 400));
    }
    
    const memberships = await query(
      'SELECT * FROM group_members WHERE group_id = ? AND user_id = ?',
      [group_id, userId]
    );

    const paidOrder = await query(
      `SELECT * FROM orders WHERE user_id = ? AND group_id = ? AND status = 'paid'`,
      [userId, group_id]
    );

    if (paidOrder.length > 0 || (memberships.length > 0 && Number(group.price) > 0)) {
      return res.json(error('您已购买该课程', 400));
    }

    if (memberships.length > 0) {
      return res.json(error('您已加入该课程群', 400));
    }

    if (group.member_count >= group.max_members) {
      return res.json(error('课程群已满员', 400));
    }

    const orderId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    
    await query(`
      INSERT INTO orders (order_id, user_id, group_id, amount)
      VALUES (?, ?, ?, ?)
    `, [orderId, userId, group_id, group.price]);

    res.json(success({
      order_id: orderId,
      group_id,
      amount: group.price,
      status: 'pending',
    }, '订单创建成功'));
  } catch (err) {
    console.error(err);
    res.json(error('创建订单失败'));
  }
}

export async function simulatePayment(req: Request, res: Response) {
  const userId = (req as any).user.user_id;
  const { order_id } = req.params;
  
  try {
    const orders = await query('SELECT * FROM orders WHERE order_id = ?', [order_id]);
    
    if (orders.length === 0) {
      return res.json(error('订单不存在', 404));
    }
    
    const order = orders[0];
    
    if (order.user_id !== userId) {
      return res.json(error('无权操作此订单', 403));
    }
    
    if (order.status !== 'pending') {
      return res.json(error('订单状态异常'));
    }

    const groups = await query('SELECT * FROM course_groups WHERE group_id = ?', [order.group_id]);
    if (groups.length === 0) {
      return res.json(error('课程群不存在', 404));
    }
    
    const group = groups[0];
    
    if (group.member_count >= group.max_members) {
      return res.json(error('课程群已满员'));
    }

    await query(
      'UPDATE orders SET status = ?, paid_at = ? WHERE order_id = ?',
      ['paid', new Date().toISOString().replace('T', ' ').substr(0, 19), order_id]
    );
    
    await query(`
      INSERT INTO group_members (member_id, group_id, user_id)
      VALUES (?, ?, ?)
    `, [Date.now().toString(36), order.group_id, userId]);
    
    await query(
      'UPDATE course_groups SET member_count = member_count + 1 WHERE group_id = ?',
      [order.group_id]
    );

    res.json(success({
      order_id,
      status: 'paid',
      message: '支付成功，已加入课程群',
    }, '支付成功'));
  } catch (err) {
    console.error(err);
    res.json(error('支付失败'));
  }
}

export async function getOrders(req: Request, res: Response) {
  const userId = (req as any).user.user_id;
  const { page = 1, page_size = 10, status } = req.query;
  
  try {
    let sql = `
      SELECT o.*, cg.name as group_name, cg.price as group_price, c.name as course_name, s.name as school_name
      FROM orders o
      LEFT JOIN course_groups cg ON o.group_id = cg.group_id
      LEFT JOIN courses c ON cg.course_id = c.course_id
      LEFT JOIN schools s ON c.school_id = s.school_id
      WHERE o.user_id = ?
    `;
    
    const params: any[] = [userId];
    
    if (status) {
      sql += ' AND o.status = ?';
      params.push(status);
    }
    
    sql += ' ORDER BY o.created_at DESC';

    const all = await query(sql, params);
    const total = all.length;
    const offset = (Number(page) - 1) * Number(page_size);
    const orders = all.slice(offset, offset + Number(page_size));

    res.json(success(pagination(orders, total, Number(page), Number(page_size)), '获取成功'));
  } catch (err) {
    console.error(err);
    res.json(error('获取订单列表失败'));
  }
}

export async function getOrderDetail(req: Request, res: Response) {
  const userId = (req as any).user.user_id;
  const { id } = req.params;
  
  try {
    const orders = await query(`
      SELECT o.*, cg.name as group_name, cg.price as group_price, c.name as course_name, s.name as school_name
      FROM orders o
      LEFT JOIN course_groups cg ON o.group_id = cg.group_id
      LEFT JOIN courses c ON cg.course_id = c.course_id
      LEFT JOIN schools s ON c.school_id = s.school_id
      WHERE o.order_id = ?
    `, [id]);
    
    if (orders.length === 0) {
      return res.json(error('订单不存在', 404));
    }
    
    const order = orders[0];
    
    if (order.user_id !== userId) {
      return res.json(error('无权查看此订单', 403));
    }
    
    res.json(success(order, '获取成功'));
  } catch (err) {
    console.error(err);
    res.json(error('获取订单详情失败'));
  }
}
