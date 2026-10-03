import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { setupTestApp, request } from './helpers';

describe('入群支付与删除课程群', () => {
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
        .send({ phone: '13690001111', nickname: '入群测试', school_id: 'sch001' })
    ).body.data.token;

    const paid = await request(app)
      .post('/api/groups')
      .set('Authorization', `Bearer ${tutorToken}`)
      .send({ name: '付费群', school_name: '北京大学', course_name: '高等数学', price: 88 });
    paidGroupId = paid.body.data.group_id;
    await request(app)
      .post(`/api/admin/groups/${paidGroupId}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'approve' });

    const free = await request(app)
      .post('/api/groups')
      .set('Authorization', `Bearer ${tutorToken}`)
      .send({ name: '免费群', school_name: '北京大学', course_name: '大学英语', price: 0 });
    freeGroupId = free.body.data.group_id;
    await request(app)
      .post(`/api/admin/groups/${freeGroupId}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'approve' });
  });

  it('付费群禁止直接 join', async () => {
    const res = await request(app)
      .post(`/api/groups/${paidGroupId}/join`)
      .set('Authorization', `Bearer ${studentToken}`);
    assert.equal(res.body.code, 400);
  });

  it('免费群可直接 join', async () => {
    const res = await request(app)
      .post(`/api/groups/${freeGroupId}/join`)
      .set('Authorization', `Bearer ${studentToken}`);
    assert.equal(res.body.code, 200);
  });

  it('导师可关闭自己的课程群', async () => {
    const res = await request(app)
      .delete(`/api/groups/${freeGroupId}`)
      .set('Authorization', `Bearer ${tutorToken}`);
    assert.equal(res.body.code, 200);
  });
});
