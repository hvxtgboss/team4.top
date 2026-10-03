import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { setupTestApp, request } from './helpers';

describe('资料与课程群审核 + 推荐导师', () => {
  let app: any;
  let adminToken = '';
  let tutorToken = '';
  let groupId = '';

  before(async () => {
    app = await setupTestApp();
    adminToken = (await request(app).post('/api/auth/login').send({ phone: '13900000000' })).body
      .data.token;
    tutorToken = (await request(app).post('/api/auth/login').send({ phone: '13800000001' })).body
      .data.token;

    const create = await request(app)
      .post('/api/groups')
      .set('Authorization', `Bearer ${tutorToken}`)
      .send({
        name: '待审课程群',
        school_name: '北京大学',
        course_name: '线性代数',
        price: 10,
      });
    assert.equal(create.body.code, 200);
    groupId = create.body.data.group_id;
  });

  it('新建课程群默认为 pending，公网列表不可见', async () => {
    const pending = await request(app)
      .get('/api/admin/groups?status=pending')
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(pending.body.code, 200);
    assert.ok(pending.body.data.list.some((g: any) => g.group_id === groupId));

    const publicList = await request(app).get('/api/groups?keyword=待审课程群');
    assert.equal(publicList.body.code, 200);
    assert.equal(publicList.body.data.list.length, 0);
  });

  it('管理员通过课程群后公网可见', async () => {
    const res = await request(app)
      .post(`/api/admin/groups/${groupId}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'approve' });
    assert.equal(res.body.code, 200);
    assert.equal(res.body.data.audit_status, 'approved');

    const publicList = await request(app).get('/api/groups?keyword=待审课程群');
    assert.ok(publicList.body.data.list.some((g: any) => g.group_id === groupId));
  });

  it('资料上传为 pending，审核通过后状态变更', async () => {
    // 不走 multer 真上传：直接插库模拟 pending 资料
    const { run } = await import('../src/utils/db');
    const mid = 'mat_test_001';
    await run(
      `INSERT INTO materials (material_id, group_id, user_id, title, file_url, file_type, file_size, status)
       VALUES (?, ?, 'tutor_demo_01', '复习笔记', '/x', 'application/pdf', 100, 'pending')`,
      [mid, groupId]
    );

    const list = await request(app)
      .get('/api/admin/materials?status=pending')
      .set('Authorization', `Bearer ${adminToken}`);
    assert.ok(list.body.data.list.some((m: any) => m.material_id === mid));

    const review = await request(app)
      .post(`/api/admin/materials/${mid}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'approve' });
    assert.equal(review.body.code, 200);
    assert.equal(review.body.data.status, 'approved');
  });

  it('按课程推荐导师来自 tutor_course_scores', async () => {
    const res = await request(app).get('/api/tutor/recommend?course=高等数学&page_size=4');
    assert.equal(res.body.code, 200);
    assert.ok(res.body.data.list.length >= 1);
    assert.ok(res.body.data.list.every((t: any) => t.course_name === '高等数学'));
    assert.ok(res.body.data.list[0].score >= 8.5);
  });

  it('按分类推荐导师', async () => {
    const res = await request(app).get('/api/tutor/recommend?category_id=cs&page_size=4');
    assert.equal(res.body.code, 200);
    assert.ok(res.body.data.list.length >= 1);
    assert.ok(res.body.data.list.every((t: any) => t.category_id === 'cs'));
  });

  it('推荐导师可打开详情', async () => {
    const rec = await request(app).get('/api/tutor/recommend?course=高等数学&page_size=1');
    assert.equal(rec.body.code, 200);
    const uid = rec.body.data.list[0].user_id;
    const detail = await request(app).get(`/api/tutor/${uid}`);
    assert.equal(detail.body.code, 200);
    assert.equal(detail.body.data.profile.user_id, uid);
  });

  it('按课程筛选导师列表', async () => {
    const res = await request(app).get('/api/tutor?course=高等数学&page_size=10');
    assert.equal(res.body.code, 200);
    assert.ok(res.body.data.list.length >= 1);
  });

  it('统计含 pending 课程群与资料', async () => {
    const stats = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(stats.body.code, 200);
    assert.ok(typeof stats.body.data.pendingGroupAudit === 'number');
    assert.ok(typeof stats.body.data.pendingMaterialAudit === 'number');
  });
});
