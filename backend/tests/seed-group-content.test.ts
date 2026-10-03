import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { setupTestApp, request } from './helpers';

describe('群内资料与答疑种子内容', () => {
  let app: any;
  let studentToken = '';
  let groupId = '';
  let tutorId = '';
  let courseName = '';

  before(async () => {
    app = await setupTestApp();

    const groups = await request(app).get('/api/groups?keyword=高等数学&page_size=1');
    assert.equal(groups.body.code, 200);
    assert.ok(groups.body.data.list.length >= 1);
    const g = groups.body.data.list[0];
    groupId = g.group_id;
    tutorId = g.tutor_id;
    courseName = g.course_name;

    // 用演示学生登录（种子已写入）
    const login = await request(app).post('/api/auth/login').send({ phone: '13600000001' });
    assert.equal(login.body.code, 200);
    studentToken = login.body.data.token;
  });

  it('成员可看到该群导师上传的学习资料', async () => {
    const res = await request(app)
      .get(`/api/materials/group/${groupId}`)
      .set('Authorization', `Bearer ${studentToken}`);
    assert.equal(res.body.code, 200, JSON.stringify(res.body));
    assert.ok(res.body.data.list.length >= 3);
    assert.ok(res.body.data.list.every((m: any) => m.status === 'approved'));
    assert.ok(res.body.data.list.every((m: any) => m.user_id === tutorId));
    assert.ok(res.body.data.list.some((m: any) => String(m.title).includes(courseName)));
  });

  it('群内答疑帖与导师回复齐全', async () => {
    const list = await request(app).get(`/api/qa?group_id=${groupId}`);
    assert.equal(list.body.code, 200);
    assert.ok(list.body.data.list.length >= 3);

    const threadId = list.body.data.list[0].thread_id;
    const detail = await request(app).get(`/api/qa/${threadId}`);
    assert.equal(detail.body.code, 200);
    assert.ok(detail.body.data.replies.length >= 1);
    assert.ok(detail.body.data.replies.some((r: any) => r.user_id === tutorId));
  });

  it('非成员无法查看群资料', async () => {
    const outsider = await request(app)
      .post('/api/auth/register')
      .send({ phone: '13681112222', nickname: '旁观者', school_id: 'sch001' });
    const res = await request(app)
      .get(`/api/materials/group/${groupId}`)
      .set('Authorization', `Bearer ${outsider.body.data.token}`);
    assert.equal(res.body.code, 403);
  });
});
