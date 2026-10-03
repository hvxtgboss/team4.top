import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { setupTestApp, request } from './helpers';

describe('学生主路径回归', () => {
  let app: any;

  before(async () => {
    app = await setupTestApp();
  });

  it('health', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.body.code, 200);
  });

  it('学校与专业列表可用', async () => {
    const schools = await request(app).get('/api/schools');
    assert.equal(schools.body.code, 200);
    assert.ok(schools.body.data.length >= 10);

    const majors = await request(app).get('/api/schools/majors');
    assert.equal(majors.body.code, 200);
    assert.ok(majors.body.data.length >= 10);
  });

  it('注册登录后可浏览课程群', async () => {
    const reg = await request(app)
      .post('/api/auth/register')
      .send({ phone: '13600002222', nickname: '浏览者', school_id: 'sch001' });
    assert.equal(reg.body.code, 200);

    const groups = await request(app).get('/api/groups?page=1&page_size=5');
    assert.equal(groups.body.code, 200);
    assert.ok(Array.isArray(groups.body.data.list));
  });
});
