import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { setupTestApp, request } from './helpers';

describe('群内 QA 最小路径', () => {
  let app: any;
  let adminToken = '';
  let tutorToken = '';
  let studentToken = '';
  let outsiderToken = '';
  let groupId = '';
  let threadId = '';

  before(async () => {
    app = await setupTestApp();
    adminToken = (await request(app).post('/api/auth/login').send({ phone: '13900000000' })).body
      .data.token;
    tutorToken = (await request(app).post('/api/auth/login').send({ phone: '13800000001' })).body
      .data.token;

    studentToken = (
      await request(app)
        .post('/api/auth/register')
        .send({ phone: '13680002222', nickname: '问答学生', school_id: 'sch001' })
    ).body.data.token;

    outsiderToken = (
      await request(app)
        .post('/api/auth/register')
        .send({ phone: '13680003333', nickname: '路人', school_id: 'sch001' })
    ).body.data.token;

    const create = await request(app)
      .post('/api/groups')
      .set('Authorization', `Bearer ${tutorToken}`)
      .send({
        name: '答疑免费群',
        school_name: '北京大学',
        course_name: '高等数学',
        price: 0,
      });
    assert.equal(create.body.code, 200, JSON.stringify(create.body));
    groupId = create.body.data.group_id;

    await request(app)
      .post(`/api/admin/groups/${groupId}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'approve' });

    const join = await request(app)
      .post(`/api/groups/${groupId}/join`)
      .set('Authorization', `Bearer ${studentToken}`);
    assert.equal(join.body.code, 200, JSON.stringify(join.body));
  });

  it('非成员不能提问', async () => {
    const res = await request(app)
      .post('/api/qa')
      .set('Authorization', `Bearer ${outsiderToken}`)
      .send({ group_id: groupId, title: '外人提问', content: '不该成功' });
    assert.equal(res.body.code, 403);
  });

  it('成员可提问，列表返回标准 success 结构', async () => {
    const create = await request(app)
      .post('/api/qa')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ group_id: groupId, title: '洛必达怎么用？', content: '求详细步骤' });
    assert.equal(create.body.code, 200, JSON.stringify(create.body));
    threadId = create.body.data.thread_id;
    assert.ok(threadId);

    const list = await request(app).get(`/api/qa?group_id=${groupId}`);
    assert.equal(list.body.code, 200);
    assert.ok(Array.isArray(list.body.data.list));
    assert.ok(list.body.data.list.some((t: any) => t.thread_id === threadId));
  });

  it('导师可回复，详情含 replies', async () => {
    const reply = await request(app)
      .post(`/api/qa/${threadId}/replies`)
      .set('Authorization', `Bearer ${tutorToken}`)
      .send({ content: '先判断 0/0 型再求导' });
    assert.equal(reply.body.code, 200, JSON.stringify(reply.body));

    const detail = await request(app).get(`/api/qa/${threadId}`);
    assert.equal(detail.body.code, 200);
    assert.equal(detail.body.data.thread.thread_id, threadId);
    assert.ok(detail.body.data.replies.some((r: any) => r.content.includes('0/0')));
  });

  it('非成员不能回复', async () => {
    const res = await request(app)
      .post(`/api/qa/${threadId}/replies`)
      .set('Authorization', `Bearer ${outsiderToken}`)
      .send({ content: '路人回复' });
    assert.equal(res.body.code, 403);
  });
});
