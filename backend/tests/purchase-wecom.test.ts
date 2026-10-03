import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { setupTestApp, request } from './helpers';

describe('支付记录 / 已购买 / 企微二维码', () => {
  let app: any;
  let adminToken = '';
  let tutorToken = '';
  let studentToken = '';
  let paidGroupId = '';
  let freeGroupId = '';

  before(async () => {
    app = await setupTestApp();
    adminToken = (await request(app).post('/api/auth/login').send({ phone: '13900000000' })).body
      .data.token;
    tutorToken = (await request(app).post('/api/auth/login').send({ phone: '13800000001' })).body
      .data.token;
    studentToken = (
      await request(app)
        .post('/api/auth/register')
        .send({ phone: '13670004444', nickname: '购买同学', school_id: 'sch001' })
    ).body.data.token;

    const paid = await request(app)
      .post('/api/groups')
      .set('Authorization', `Bearer ${tutorToken}`)
      .send({
        name: '企微付费群',
        school_name: '北京大学',
        course_name: '高等数学',
        price: 66,
      });
    paidGroupId = paid.body.data.group_id;
    await request(app)
      .post(`/api/admin/groups/${paidGroupId}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'approve' });

    // 给付费群补企微二维码
    const { run } = await import('../src/utils/db');
    await run(`UPDATE course_groups SET wecom_qr_url = ? WHERE group_id = ?`, [
      `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=wecom-${paidGroupId}`,
      paidGroupId,
    ]);

    const free = await request(app)
      .post('/api/groups')
      .set('Authorization', `Bearer ${tutorToken}`)
      .send({
        name: '企微免费群',
        school_name: '北京大学',
        course_name: '大学英语',
        price: 0,
      });
    freeGroupId = free.body.data.group_id;
    await request(app)
      .post(`/api/admin/groups/${freeGroupId}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'approve' });
    await run(`UPDATE course_groups SET wecom_qr_url = ? WHERE group_id = ?`, [
      `https://example.com/qr/${freeGroupId}`,
      freeGroupId,
    ]);
  });

  it('未支付时企微二维码锁定，不返回真实 URL', async () => {
    const res = await request(app)
      .get(`/api/groups/${paidGroupId}`)
      .set('Authorization', `Bearer ${studentToken}`);
    assert.equal(res.body.code, 200);
    assert.equal(res.body.data.is_member, false);
    assert.equal(res.body.data.has_purchased, false);
    assert.equal(res.body.data.wecom_qr_locked, true);
    assert.equal(res.body.data.wecom_qr_url, null);
  });

  it('支付后显示已购买，并可查看企微二维码；订单列表可见', async () => {
    const order = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ group_id: paidGroupId });
    assert.equal(order.body.code, 200);

    const pay = await request(app)
      .post(`/api/orders/${order.body.data.order_id}/pay`)
      .set('Authorization', `Bearer ${studentToken}`);
    assert.equal(pay.body.code, 200);

    const detail = await request(app)
      .get(`/api/groups/${paidGroupId}`)
      .set('Authorization', `Bearer ${studentToken}`);
    assert.equal(detail.body.data.is_member, true);
    assert.equal(detail.body.data.has_purchased, true);
    assert.equal(detail.body.data.wecom_qr_locked, false);
    assert.ok(detail.body.data.wecom_qr_url);

    const orders = await request(app)
      .get('/api/orders?status=paid')
      .set('Authorization', `Bearer ${studentToken}`);
    assert.equal(orders.body.code, 200);
    assert.ok(orders.body.data.list.some((o: any) => o.group_id === paidGroupId));

    const my = await request(app)
      .get('/api/groups/my')
      .set('Authorization', `Bearer ${studentToken}`);
    assert.ok(my.body.data.some((g: any) => g.group_id === paidGroupId));

    // 再次下单应拒绝
    const again = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ group_id: paidGroupId });
    assert.equal(again.body.code, 400);
  });

  it('免费入群后也可查看企微二维码', async () => {
    const join = await request(app)
      .post(`/api/groups/${freeGroupId}/join`)
      .set('Authorization', `Bearer ${studentToken}`);
    assert.equal(join.body.code, 200);

    const detail = await request(app)
      .get(`/api/groups/${freeGroupId}`)
      .set('Authorization', `Bearer ${studentToken}`);
    assert.equal(detail.body.data.is_member, true);
    assert.equal(detail.body.data.wecom_qr_locked, false);
    assert.ok(detail.body.data.wecom_qr_url);
  });
});
