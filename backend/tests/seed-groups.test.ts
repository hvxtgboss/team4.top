import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { setupTestApp, request } from './helpers';

describe('热门课程群与推荐导师对应', () => {
  let app: any;

  before(async () => {
    app = await setupTestApp();
  });

  it('种子课程群数量充足且已审核通过', async () => {
    const res = await request(app).get('/api/groups?page_size=20');
    assert.equal(res.body.code, 200);
    assert.ok(res.body.data.total >= 50, `期望大量种子群，实际 ${res.body.data.total}`);
    assert.ok(res.body.data.list.length >= 12);
    assert.ok(res.body.data.list.every((g: any) => g.tutor_id && g.tutor_nickname));
  });

  it('按课程筛选的群，导师应出现在同课程推荐列表中', async () => {
    const groups = await request(app).get('/api/groups?keyword=高等数学&page_size=10');
    assert.equal(groups.body.code, 200);
    assert.ok(groups.body.data.list.length >= 1);
    assert.ok(groups.body.data.list.every((g: any) => String(g.course_name).includes('高等数学')));

    const recommend = await request(app).get('/api/tutor/recommend?course=高等数学&page_size=20');
    assert.equal(recommend.body.code, 200);
    const recIds = new Set(recommend.body.data.list.map((t: any) => t.user_id));

    const matched = groups.body.data.list.filter((g: any) => recIds.has(g.tutor_id));
    assert.ok(
      matched.length >= 1,
      '至少有一个高等数学课程群的导师出现在推荐列表'
    );
  });

  it('按分类筛选公共基础课程群', async () => {
    const res = await request(app).get('/api/groups?category_id=general&page_size=12');
    assert.equal(res.body.code, 200);
    assert.ok(res.body.data.list.length >= 6);
    const generalCourses = [
      '高等数学',
      '线性代数',
      '概率论与数理统计',
      '大学物理',
      '大学英语',
      '马克思主义基本原理',
      '思想道德与法治',
      '体育',
      '军事理论',
    ];
    assert.ok(res.body.data.list.every((g: any) => generalCourses.includes(g.course_name)));
  });
});
