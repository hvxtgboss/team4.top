import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { setupTestApp, request } from './helpers';

describe('角色与管理员审核闭环', () => {
  let app: any;
  let adminToken = '';
  let studentToken = '';
  let studentId = '';

  before(async () => {
    app = await setupTestApp();

    const adminLogin = await request(app).post('/api/auth/login').send({ phone: '13900000000' });
    assert.equal(adminLogin.body.code, 200);
    adminToken = adminLogin.body.data.token;
    assert.equal(adminLogin.body.data.user.role, 'admin');

    const reg = await request(app)
      .post('/api/auth/register')
      .send({
        phone: '13811112222',
        nickname: '测试学生',
        school_id: 'sch001',
        major: '计算机科学与技术',
      });
    assert.equal(reg.body.code, 200);
    assert.equal(reg.body.data.user.role, 'student');
    studentToken = reg.body.data.token;
    studentId = reg.body.data.user.user_id;
  });

  it('注册强制为 student，即使传 tutor 也不生效', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        phone: '13811113333',
        nickname: '想当导师的人',
        role: 'tutor',
        school_id: 'sch002',
      });
    assert.equal(res.body.code, 200);
    assert.equal(res.body.data.user.role, 'student');
  });

  it('非管理员无法访问 /api/admin/*', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${studentToken}`);
    assert.equal(res.body.code, 403);
  });

  it('学生申请导师后仍为 student，且进入 pending 列表', async () => {
    const apply = await request(app)
      .post('/api/tutor/apply')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ real_name: '测试学生', gpa: 3.7, course_experience: '高等数学' });
    assert.equal(apply.body.code, 200);

    const me = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${studentToken}`);
    // me 可能走不同路由 — 用 login 再取
    const again = await request(app).post('/api/auth/login').send({ phone: '13811112222' });
    assert.equal(again.body.data.user.role, 'student');

    const apps = await request(app)
      .get('/api/admin/tutor-applications?status=pending')
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(apps.body.code, 200);
    assert.ok(apps.body.data.list.some((x: any) => x.user_id === studentId));
  });

  it('管理员通过后 role 变为 tutor', async () => {
    const res = await request(app)
      .post(`/api/admin/tutor-applications/${studentId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(res.body.code, 200);
    assert.equal(res.body.data.role, 'tutor');

    const login = await request(app).post('/api/auth/login').send({ phone: '13811112222' });
    assert.equal(login.body.data.user.role, 'tutor');
  });

  it('管理员统计与用户列表来自真实数据库', async () => {
    const stats = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(stats.body.code, 200);
    assert.ok(stats.body.data.totalUsers >= 2);
    assert.ok(stats.body.data.totalTutors >= 1);

    const users = await request(app)
      .get('/api/admin/users?role=tutor&page_size=300')
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(users.body.code, 200);
    assert.ok(users.body.data.list.some((u: any) => u.user_id === studentId));
  });
});
