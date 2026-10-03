import { getDatabase } from './db';

export async function initDatabase() {
  const db = await getDatabase();

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      user_id TEXT PRIMARY KEY,
      phone TEXT UNIQUE NOT NULL,
      email TEXT,
      nickname TEXT NOT NULL,
      avatar TEXT,
      role TEXT NOT NULL DEFAULT 'student',
      school_id TEXT,
      school_college TEXT,
      major TEXT,
      grade TEXT,
      student_id TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS schools (
      school_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      province TEXT,
      city TEXT,
      type TEXT,
      category TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS majors (
      major_id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      category TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS courses (
      course_id TEXT PRIMARY KEY,
      school_id TEXT,
      name TEXT NOT NULL,
      code TEXT,
      department TEXT,
      credit REAL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (school_id) REFERENCES schools(school_id)
    );

    CREATE TABLE IF NOT EXISTS course_groups (
      group_id TEXT PRIMARY KEY,
      tutor_id TEXT,
      course_id TEXT,
      name TEXT NOT NULL,
      description TEXT,
      price REAL DEFAULT 0,
      max_members INTEGER DEFAULT 100,
      cover_image TEXT,
      member_count INTEGER DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tutor_id) REFERENCES users(user_id),
      FOREIGN KEY (course_id) REFERENCES courses(course_id)
    );

    CREATE TABLE IF NOT EXISTS group_members (
      member_id TEXT PRIMARY KEY,
      group_id TEXT,
      user_id TEXT,
      joined_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (group_id) REFERENCES course_groups(group_id),
      FOREIGN KEY (user_id) REFERENCES users(user_id)
    );

    CREATE TABLE IF NOT EXISTS materials (
      material_id TEXT PRIMARY KEY,
      group_id TEXT,
      user_id TEXT,
      title TEXT NOT NULL,
      file_url TEXT NOT NULL,
      file_type TEXT,
      file_size INTEGER,
      description TEXT,
      download_count INTEGER DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (group_id) REFERENCES course_groups(group_id),
      FOREIGN KEY (user_id) REFERENCES users(user_id)
    );

    CREATE TABLE IF NOT EXISTS qa_threads (
      thread_id TEXT PRIMARY KEY,
      group_id TEXT,
      user_id TEXT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      is_solved INTEGER DEFAULT 0,
      view_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (group_id) REFERENCES course_groups(group_id),
      FOREIGN KEY (user_id) REFERENCES users(user_id)
    );

    CREATE TABLE IF NOT EXISTS qa_replies (
      reply_id TEXT PRIMARY KEY,
      thread_id TEXT,
      user_id TEXT,
      content TEXT NOT NULL,
      is_accepted INTEGER DEFAULT 0,
      like_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (thread_id) REFERENCES qa_threads(thread_id),
      FOREIGN KEY (user_id) REFERENCES users(user_id)
    );

    CREATE TABLE IF NOT EXISTS tutor_profiles (
      profile_id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE,
      real_name TEXT,
      student_card TEXT,
      gpa REAL,
      rank_percent REAL,
      course_experience TEXT,
      hourly_rate REAL,
      apply_status TEXT NOT NULL DEFAULT 'pending',
      approved_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(user_id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      order_id TEXT PRIMARY KEY,
      user_id TEXT,
      group_id TEXT,
      amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      paid_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(user_id),
      FOREIGN KEY (group_id) REFERENCES course_groups(group_id)
    );

    CREATE TABLE IF NOT EXISTS tutor_course_scores (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      course_name TEXT NOT NULL,
      category_id TEXT,
      score REAL NOT NULL,
      student_count INTEGER DEFAULT 0,
      UNIQUE(user_id, course_name),
      FOREIGN KEY (user_id) REFERENCES users(user_id)
    );

    CREATE TABLE IF NOT EXISTS group_ai_notes (
      note_id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL UNIQUE,
      audio_url TEXT,
      transcript_text TEXT,
      review_notes TEXT,
      course_name TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (group_id) REFERENCES course_groups(group_id)
    );
  `);

  // 兼容旧库
  try {
    await db.exec(`ALTER TABLE schools ADD COLUMN category TEXT`);
  } catch {
    /* already exists */
  }
  try {
    await db.exec(`ALTER TABLE course_groups ADD COLUMN audit_status TEXT DEFAULT 'approved'`);
  } catch {
    /* already exists */
  }
  try {
    await db.exec(`ALTER TABLE course_groups ADD COLUMN wecom_qr_url TEXT`);
  } catch {
    /* already exists */
  }
  await db.run(
    `UPDATE course_groups SET audit_status = 'approved' WHERE audit_status IS NULL OR audit_status = ''`
  );

  await initSeedData(db);

  console.log('数据库初始化完成');
}

/** 院校来源参考：https://www.salary.top/employment-report 就业质量报告列表与筛选维度 */
const SEED_SCHOOLS: Array<{
  school_id: string;
  name: string;
  province: string;
  city: string;
  type: string;
  category: string;
}> = [
  { school_id: 'sch001', name: '北京大学', province: '北京', city: '北京', type: '985', category: '综合' },
  { school_id: 'sch002', name: '清华大学', province: '北京', city: '北京', type: '985', category: '理工' },
  { school_id: 'sch003', name: '中国人民大学', province: '北京', city: '北京', type: '985', category: '综合' },
  { school_id: 'sch004', name: '北京交通大学', province: '北京', city: '北京', type: '211', category: '理工' },
  { school_id: 'sch005', name: '北京工业大学', province: '北京', city: '北京', type: '211', category: '理工' },
  { school_id: 'sch006', name: '北京航空航天大学', province: '北京', city: '北京', type: '985', category: '理工' },
  { school_id: 'sch007', name: '北京理工大学', province: '北京', city: '北京', type: '985', category: '理工' },
  { school_id: 'sch008', name: '北京科技大学', province: '北京', city: '北京', type: '211', category: '理工' },
  { school_id: 'sch009', name: '北方工业大学', province: '北京', city: '北京', type: 'ordinary', category: '理工' },
  { school_id: 'sch010', name: '北京化工大学', province: '北京', city: '北京', type: '211', category: '理工' },
  { school_id: 'sch011', name: '浙江大学', province: '浙江', city: '杭州', type: '985', category: '综合' },
  { school_id: 'sch012', name: '复旦大学', province: '上海', city: '上海', type: '985', category: '综合' },
  { school_id: 'sch013', name: '上海交通大学', province: '上海', city: '上海', type: '985', category: '综合' },
  { school_id: 'sch014', name: '南京大学', province: '江苏', city: '南京', type: '985', category: '综合' },
  { school_id: 'sch015', name: '中国科学技术大学', province: '安徽', city: '合肥', type: '985', category: '理工' },
  { school_id: 'sch016', name: '武汉大学', province: '湖北', city: '武汉', type: '985', category: '综合' },
  { school_id: 'sch017', name: '西安交通大学', province: '陕西', city: '西安', type: '985', category: '理工' },
  { school_id: 'sch018', name: '哈尔滨工业大学', province: '黑龙江', city: '哈尔滨', type: '985', category: '理工' },
  { school_id: 'sch019', name: '同济大学', province: '上海', city: '上海', type: '985', category: '理工' },
  { school_id: 'sch020', name: '南开大学', province: '天津', city: '天津', type: '985', category: '综合' },
];

/** 常见本科专业（按薪赛道「学校类别」维度归类，便于筛选） */
const SEED_MAJORS: Array<{ major_id: string; name: string; category: string }> = [
  { major_id: 'maj001', name: '计算机科学与技术', category: '理工' },
  { major_id: 'maj002', name: '软件工程', category: '理工' },
  { major_id: 'maj003', name: '人工智能', category: '理工' },
  { major_id: 'maj004', name: '电子信息工程', category: '理工' },
  { major_id: 'maj005', name: '自动化', category: '理工' },
  { major_id: 'maj006', name: '机械工程', category: '理工' },
  { major_id: 'maj007', name: '土木工程', category: '理工' },
  { major_id: 'maj008', name: '化学工程与工艺', category: '理工' },
  { major_id: 'maj009', name: '材料科学与工程', category: '理工' },
  { major_id: 'maj010', name: '数学与应用数学', category: '理工' },
  { major_id: 'maj011', name: '物理学', category: '理工' },
  { major_id: 'maj012', name: '临床医学', category: '医药' },
  { major_id: 'maj013', name: '药学', category: '医药' },
  { major_id: 'maj014', name: '护理学', category: '医药' },
  { major_id: 'maj015', name: '经济学', category: '财经' },
  { major_id: 'maj016', name: '金融学', category: '财经' },
  { major_id: 'maj017', name: '会计学', category: '财经' },
  { major_id: 'maj018', name: '工商管理', category: '财经' },
  { major_id: 'maj019', name: '法学', category: '政法' },
  { major_id: 'maj020', name: '汉语言文学', category: '综合' },
  { major_id: 'maj021', name: '英语', category: '语言' },
  { major_id: 'maj022', name: '新闻学', category: '综合' },
  { major_id: 'maj023', name: '教育学', category: '师范' },
  { major_id: 'maj024', name: '心理学', category: '师范' },
  { major_id: 'maj025', name: '设计学', category: '艺术' },
];

const DEMO_TUTORS = [
  {
    user_id: 'tutor_demo_01',
    phone: '13800000001',
    nickname: '林知夏',
    avatar: 'https://i.pravatar.cc/150?img=5',
    school_id: 'sch001',
    major: '计算机科学与技术',
    real_name: '林知夏',
    gpa: 3.85,
    course_experience: '高等数学、数据结构',
  },
  {
    user_id: 'tutor_demo_02',
    phone: '13800000002',
    nickname: '陈启明',
    avatar: 'https://i.pravatar.cc/150?img=12',
    school_id: 'sch002',
    major: '电子信息工程',
    real_name: '陈启明',
    gpa: 3.92,
    course_experience: '电路原理、信号与系统',
  },
  {
    user_id: 'tutor_demo_03',
    phone: '13800000003',
    nickname: '周晚晴',
    avatar: 'https://i.pravatar.cc/150?img=9',
    school_id: 'sch012',
    major: '金融学',
    real_name: '周晚晴',
    gpa: 3.78,
    course_experience: '微观经济学、公司金融',
  },
  {
    user_id: 'tutor_demo_04',
    phone: '13800000004',
    nickname: '赵予安',
    avatar: 'https://i.pravatar.cc/150?img=32',
    school_id: 'sch006',
    major: '人工智能',
    real_name: '赵予安',
    gpa: 3.88,
    course_experience: '机器学习、线性代数',
  },
];

async function initSeedData(db: any) {
  for (const s of SEED_SCHOOLS) {
    await db.run(
      `INSERT INTO schools (school_id, name, province, city, type, category)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(school_id) DO UPDATE SET
         name = excluded.name,
         province = excluded.province,
         city = excluded.city,
         type = excluded.type,
         category = excluded.category`,
      [s.school_id, s.name, s.province, s.city, s.type, s.category]
    );
  }
  console.log(`学校数据已同步（${SEED_SCHOOLS.length} 所，参考薪赛道就业质量报告院校）`);

  for (const m of SEED_MAJORS) {
    await db.run(
      `INSERT INTO majors (major_id, name, category)
       VALUES (?, ?, ?)
       ON CONFLICT(major_id) DO UPDATE SET
         name = excluded.name,
         category = excluded.category`,
      [m.major_id, m.name, m.category]
    );
  }
  console.log(`专业数据已同步（${SEED_MAJORS.length} 个）`);

  // 默认管理员：手机号登录 13900000000
  const admin = await db.get(`SELECT user_id FROM users WHERE phone = ?`, ['13900000000']);
  if (!admin) {
    await db.run(
      `INSERT INTO users (user_id, phone, nickname, role, status)
       VALUES ('admin_001', '13900000000', '平台管理员', 'admin', 'active')`
    );
  } else {
    await db.run(`UPDATE users SET role = 'admin', nickname = '平台管理员' WHERE phone = ?`, [
      '13900000000',
    ]);
  }
  console.log('管理员账号已就绪：手机号 13900000000');

  const approved = await db.get(
    `SELECT COUNT(*) as count FROM tutor_profiles WHERE apply_status = 'approved'`
  );
  if (approved.count === 0) {
    for (const t of DEMO_TUTORS) {
      await db.run(
        `INSERT OR REPLACE INTO users
          (user_id, phone, nickname, avatar, role, school_id, major, status)
         VALUES (?, ?, ?, ?, 'tutor', ?, ?, 'active')`,
        [t.user_id, t.phone, t.nickname, t.avatar, t.school_id, t.major]
      );
      const profileId = `tp_${t.user_id}`;
      await db.run(
        `INSERT OR REPLACE INTO tutor_profiles
          (profile_id, user_id, real_name, gpa, course_experience, apply_status, approved_at)
         VALUES (?, ?, ?, ?, ?, 'approved', CURRENT_TIMESTAMP)`,
        [profileId, t.user_id, t.real_name, t.gpa, t.course_experience]
      );
    }
    console.log(`演示导师已导入（${DEMO_TUTORS.length} 位）`);
  }

  await seedRecommendTutors(db);
  await seedDemoGroups(db);
  await seedGroupContent(db);
}

import { SEED_COURSE_TREE } from './course-tree';

/** 与前端 courseCategories 对齐的课程目录（用于推荐导师种子） */
// SEED_COURSE_TREE 见 ./course-tree.ts

const SUR = ['林', '陈', '周', '赵', '吴', '郑', '王', '冯', '蒋', '沈'];
const GIVEN = ['知夏', '启明', '晚晴', '予安', '思远', '清扬', '景行', '语桐', '亦辰', '书瑶'];

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

async function seedRecommendTutors(db: any) {
  const cnt = await db.get(`SELECT COUNT(*) as c FROM tutor_course_scores`);
  if (cnt.c > 0) return;

  let n = 0;
  for (const cat of SEED_COURSE_TREE) {
    for (const course of cat.courses) {
      for (let k = 0; k < 2; k++) {
        const idx = n++;
        const userId = `rec_tutor_${idx}`;
        const phone = `1378${String(100000 + idx).slice(-6)}`;
        const nickname = `${SUR[idx % SUR.length]}${GIVEN[idx % GIVEN.length]}`;
        const schoolId = `sch${String((idx % 20) + 1).padStart(3, '0')}`;
        const score = Math.round((8.5 + (hashStr(`${userId}:${course}`) % 150) / 100) * 10) / 10;
        const students = 20 + (hashStr(userId) % 200);

        await db.run(
          `INSERT OR IGNORE INTO users (user_id, phone, nickname, avatar, role, school_id, major, status)
           VALUES (?, ?, ?, ?, 'tutor', ?, ?, 'active')`,
          [
            userId,
            phone,
            nickname,
            `https://i.pravatar.cc/150?img=${(idx % 70) + 1}`,
            schoolId,
            course,
          ]
        );
        await db.run(
          `INSERT OR IGNORE INTO tutor_profiles
            (profile_id, user_id, real_name, gpa, course_experience, apply_status, approved_at)
           VALUES (?, ?, ?, ?, ?, 'approved', CURRENT_TIMESTAMP)`,
          [`tp_${userId}`, userId, nickname, 3.5 + (idx % 50) / 100, course]
        );
        await db.run(
          `INSERT OR IGNORE INTO tutor_course_scores (id, user_id, course_name, category_id, score, student_count)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [`tcs_${idx}`, userId, course, cat.id, score, students]
        );
      }
    }
  }
  console.log(`推荐导师课程评分已导入（${n} 条）`);
}

/** 为每位有课程评分的导师生成对应课程群（首页热门群与推荐导师对齐） */
async function seedDemoGroups(db: any) {
  // 演示导师专长也写入评分表，保证「推荐导师 ↔ 课程群」可对应
  for (const t of DEMO_TUTORS) {
    const courses = t.course_experience.split(/[、,，]/).map((s) => s.trim()).filter(Boolean);
    for (const course of courses) {
      const cat = SEED_COURSE_TREE.find((c) => c.courses.includes(course));
      const categoryId = cat?.id || 'other';
      const score = Math.round((9 + (hashStr(`${t.user_id}:${course}`) % 100) / 100) * 10) / 10;
      await db.run(
        `INSERT OR IGNORE INTO tutor_course_scores (id, user_id, course_name, category_id, score, student_count)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [`tcs_demo_${t.user_id}_${course}`, t.user_id, course, categoryId, score, 80 + (hashStr(t.user_id) % 40)]
      );
    }
  }

  const rows = await db.all(
    `
    SELECT tcs.*, u.nickname, u.avatar, u.school_id, s.name as school_name
    FROM tutor_course_scores tcs
    JOIN users u ON tcs.user_id = u.user_id
    LEFT JOIN schools s ON u.school_id = s.school_id
    ORDER BY tcs.category_id, tcs.course_name, tcs.score DESC
  `
  );

  let created = 0;
  let idx = 0;
  for (const row of rows) {
    idx++;
    const already = await db.get(
      `
      SELECT cg.group_id FROM course_groups cg
      JOIN courses c ON cg.course_id = c.course_id
      WHERE cg.tutor_id = ? AND c.name = ?
      LIMIT 1
    `,
      [row.user_id, row.course_name]
    );
    if (already) continue;

    const schoolId = row.school_id || 'sch001';
    const schoolName = row.school_name || '北京大学';
    const courseKey = `${schoolId}:${row.course_name}`;
    const courseId = `course_seed_${hashStr(courseKey).toString(36)}`;

    await db.run(
      `INSERT OR IGNORE INTO courses (course_id, school_id, name, code, department, credit)
       VALUES (?, ?, ?, '', '', 3)`,
      [courseId, schoolId, row.course_name]
    );

    const groupId = `grp_seed_${String(idx).padStart(4, '0')}_${hashStr(row.user_id + row.course_name)
      .toString(36)
      .slice(0, 6)}`;
    const price = hashStr(groupId) % 4 === 0 ? 0 : 39 + (hashStr(groupId + 'p') % 8) * 10;
    const memberCount = Math.min(96, Math.max(12, Math.floor((row.student_count || 40) / 2)));
    const name = `${row.course_name} · ${row.nickname}答疑群`;
    const description = `${schoolName}学霸「${row.nickname}」主讲「${row.course_name}」，配套答疑与资料。`;

    await db.run(
      `INSERT OR IGNORE INTO course_groups
        (group_id, tutor_id, course_id, name, description, price, max_members, member_count, status, audit_status, wecom_qr_url)
       VALUES (?, ?, ?, ?, ?, ?, 100, ?, 'active', 'approved', ?)`,
      [
        groupId,
        row.user_id,
        courseId,
        name,
        description,
        price,
        memberCount,
        `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(`wecom://group/${groupId}`)}`,
      ]
    );

    await db.run(
      `INSERT OR IGNORE INTO group_members (member_id, group_id, user_id)
       VALUES (?, ?, ?)`,
      [`gm_seed_${groupId}`, groupId, row.user_id]
    );
    created++;
  }

  if (created > 0) {
    console.log(`演示课程群已导入/补齐（新增 ${created} 个，与推荐导师课程一一对应）`);
  }
}

const DEMO_STUDENTS = [
  { user_id: 'stu_seed_01', phone: '13600000001', nickname: '阿哲', school_id: 'sch001', major: '计算机科学与技术' },
  { user_id: 'stu_seed_02', phone: '13600000002', nickname: '小满', school_id: 'sch002', major: '电子信息工程' },
  { user_id: 'stu_seed_03', phone: '13600000003', nickname: '清禾', school_id: 'sch011', major: '金融学' },
];

const MATERIAL_TEMPLATES = [
  { suffix: '期末复习提纲', type: 'application/pdf', ext: 'pdf', size: 820_000 },
  { suffix: '重点习题精讲', type: 'application/pdf', ext: 'pdf', size: 1_240_000 },
  { suffix: '知识点速查笔记', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', ext: 'docx', size: 460_000 },
];

const QA_TEMPLATES = [
  {
    title: (course: string) => `「${course}」这道典型题怎么入手？`,
    content: (course: string) =>
      `老师好，我在复习「${course}」时卡在一道典型例题上，条件看懂了但不知道第一步该怎么转化，能按解题思路拆一下吗？`,
    reply: (course: string) =>
      `先把题目条件写成「已知/求解」两栏，再对照「${course}」这章的核心定义对号入座。常见卡点是概念没用准——你把已知条件发我，我帮你标出该用哪条定理。`,
  },
  {
    title: (course: string) => `${course}期末会考哪些高频点？`,
    content: (course: string) =>
      `马上期末了，想请教「${course}」历年高频考点优先级，以及群里那份复习提纲该怎么配合刷题？`,
    reply: (course: string) =>
      `建议按「定义→例题→错题回炉」三轮：先过提纲目录，再做精讲里标★的题。群资料里的「${course}期末复习提纲」就是按这个顺序排的，有空对照做一遍。`,
  },
  {
    title: (course: string) => `作业里的证明题卡壳了`,
    content: (course: string) =>
      `「${course}」作业有一道证明题，我证到一半推不动了，是不是缺了某个中间引理？`,
    reply: (course: string) =>
      `多数情况是漏了「${course}」里的一个等价条件。你可以先尝试反证或举特例检验中间步骤是否仍成立；若特例也挂，说明前面某步已经不等价了。`,
  },
];

/** 为每个课程群填充学习资料 + 在线答疑（与群主导师对应） */
async function seedGroupContent(db: any) {
  for (const s of DEMO_STUDENTS) {
    await db.run(
      `INSERT OR IGNORE INTO users (user_id, phone, nickname, avatar, role, school_id, major, status)
       VALUES (?, ?, ?, ?, 'student', ?, ?, 'active')`,
      [
        s.user_id,
        s.phone,
        s.nickname,
        `https://i.pravatar.cc/150?u=${s.user_id}`,
        s.school_id,
        s.major,
      ]
    );
  }

  const groups = await db.all(
    `
    SELECT cg.group_id, cg.tutor_id, c.name as course_name, u.nickname as tutor_nickname
    FROM course_groups cg
    JOIN courses c ON cg.course_id = c.course_id
    JOIN users u ON cg.tutor_id = u.user_id
    WHERE cg.status = 'active' AND IFNULL(cg.audit_status, 'approved') = 'approved'
  `
  );

  let matN = 0;
  let qaN = 0;

  for (const g of groups) {
    const marked = await db.get(
      `SELECT 1 as ok FROM materials WHERE material_id = ?`,
      [`mat_seed_${g.group_id}_0`]
    );
    if (marked) continue;

    // 演示学生入群（便于提问归属真实）
    for (const s of DEMO_STUDENTS) {
      await db.run(
        `INSERT OR IGNORE INTO group_members (member_id, group_id, user_id)
         VALUES (?, ?, ?)`,
        [`gm_${g.group_id}_${s.user_id}`, g.group_id, s.user_id]
      );
    }

    for (let i = 0; i < MATERIAL_TEMPLATES.length; i++) {
      const tpl = MATERIAL_TEMPLATES[i];
      const materialId = `mat_seed_${g.group_id}_${i}`;
      const title = `${g.course_name}${tpl.suffix}.${tpl.ext}`;
      await db.run(
        `INSERT OR IGNORE INTO materials
          (material_id, group_id, user_id, title, file_url, file_type, file_size, description, download_count, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved')`,
        [
          materialId,
          g.group_id,
          g.tutor_id,
          title,
          `/uploads/materials/seed/${materialId}.${tpl.ext}`,
          tpl.type,
          tpl.size + (hashStr(materialId) % 50_000),
          `由导师「${g.tutor_nickname}」整理的「${g.course_name}」学习资料（演示）。`,
          20 + (hashStr(materialId) % 180),
        ]
      );
      matN++;
    }

    for (let i = 0; i < QA_TEMPLATES.length; i++) {
      const tpl = QA_TEMPLATES[i];
      const stu = DEMO_STUDENTS[i % DEMO_STUDENTS.length];
      const threadId = `qa_seed_${g.group_id}_${i}`;
      const solved = i === 1 ? 1 : 0;
      await db.run(
        `INSERT OR IGNORE INTO qa_threads
          (thread_id, group_id, user_id, title, content, is_solved, view_count)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          threadId,
          g.group_id,
          stu.user_id,
          tpl.title(g.course_name),
          tpl.content(g.course_name),
          solved,
          15 + (hashStr(threadId) % 90),
        ]
      );

      const replyId = `qr_seed_${g.group_id}_${i}`;
      await db.run(
        `INSERT OR IGNORE INTO qa_replies
          (reply_id, thread_id, user_id, content, is_accepted, like_count)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          replyId,
          threadId,
          g.tutor_id,
          tpl.reply(g.course_name),
          solved,
          3 + (hashStr(replyId) % 20),
        ]
      );
      qaN++;
    }
  }

  if (matN > 0 || qaN > 0) {
    console.log(`群内演示内容已导入（资料 ${matN} 条，答疑帖 ${qaN} 条）`);
  }

  // 为已有种子群补齐企微二维码
  await db.run(
    `
    UPDATE course_groups
    SET wecom_qr_url = 'https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=' || 'wecom%3A%2F%2Fgroup%2F' || group_id
    WHERE (wecom_qr_url IS NULL OR wecom_qr_url = '')
      AND group_id LIKE 'grp_seed_%'
  `
  );
}
