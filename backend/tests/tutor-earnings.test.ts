import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { setupTestApp, request } from './helpers';

describe('导师学生与收益', () => {
  let app: any;
  let tutorToken = '';
  let studentToken = '';
  let groupId = '';

  before(async () => {
    app = await setupTestApp();

    // 用种子导师登录（init 写入的 demo）
    const tutorLogin = await request(app).post('/api/auth/login').send({ phone: '13800000001' });
    assert.equal(tutorLogin.body.code, 200);
    assert.equal(tutorLogin.body.data.user.role, 'tutor');
    tutorToken = tutorLogin.body.data.token;

    const stu = await request(app)
      .post('/api/auth/register')
      .send({
        phone: '13700001111',
        nickname: '付费同学',
        school_id: 'sch001',
      });
    studentToken = stu.body.data.token;

    // 导师建群（需看 groups create API）
    const create = await request(app)
      .post('/api/groups')
      .set('Authorization', `Bearer ${tutorToken}`)
      .send({
        name: '高数冲刺群',
        description: '测试',
        price: 99,
        max_members: 50,
        school_name: '北京大学',
        course_name: '高等数学',
      });
    assert.equal(create.body.code, 200, JSON.stringify(create.body));
    groupId = create.body.data.group_id;

    const adminLogin = await request(app).post('/api/auth/login').send({ phone: '13900000000' });
    const approve = await request(app)
      .post(`/api/admin/groups/${groupId}/review`)
      .set('Authorization', `Bearer ${adminLogin.body.data.token}`)
      .send({ action: 'approve' });
    assert.equal(approve.body.code, 200, JSON.stringify(approve.body));

    const order = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ group_id: groupId });
    assert.equal(order.body.code, 200, JSON.stringify(order.body));

    const pay = await request(app)
      .post(`/api/orders/${order.body.data.order_id}/pay`)
      .set('Authorization', `Bearer ${studentToken}`);
    assert.equal(pay.body.code, 200, JSON.stringify(pay.body));
  });

  it('导师可看到名下学生', async () => {
    const res = await request(app)
      .get('/api/tutor/students')
      .set('Authorization', `Bearer ${tutorToken}`);
    assert.equal(res.body.code, 200);
    assert.ok(res.body.data.total >= 1);
    assert.ok(res.body.data.list.some((s: any) => s.nickname === '付费同学'));
  });

  it('导师收益统计来自已支付订单', async () => {
    const res = await request(app)
      .get('/api/tutor/earnings')
      .set('Authorization', `Bearer ${tutorToken}`);
    assert.equal(res.body.code, 200);
    assert.ok(res.body.data.total_amount >= 99);
    assert.ok(res.body.data.order_count >= 1);
  });

  it('学生不能访问导师收益接口', async () => {
    const res = await request(app)
      .get('/api/tutor/earnings')
      .set('Authorization', `Bearer ${studentToken}`);
    assert.equal(res.body.code, 403);
  });
});
