/**
 * 课程分类与种子导师数据（前后端共用逻辑的前端镜像；
 * 后端 init-db 使用同名课程列表生成 SQLite 种子）
 */
import { COURSE_CATEGORIES } from './courseCategories';

export interface CatalogTutor {
  user_id: string;
  nickname: string;
  avatar: string;
  school_name: string;
  major: string;
  gpa: number;
  course: string;
  category_id: string;
  score: number;
  student_count: number;
  group_count: number;
  course_experience: string;
}

const SURNAMES = ['林', '陈', '周', '赵', '吴', '郑', '王', '冯', '蒋', '沈', '韩', '杨', '朱', '秦', '尤', '许', '何', '吕', '施', '张'];
const GIVEN = ['知夏', '启明', '晚晴', '予安', '思远', '清扬', '景行', '语桐', '亦辰', '书瑶', '浩然', '子墨', '一诺', '嘉树', '明轩', '若曦', '承泽', '诗涵', '俊杰', '欣然'];
const SCHOOLS = [
  '北京大学',
  '清华大学',
  '复旦大学',
  '上海交通大学',
  '浙江大学',
  '南京大学',
  '中国科学技术大学',
  '武汉大学',
  '北京航空航天大学',
  '哈尔滨工业大学',
];
const MAJORS = [
  '计算机科学与技术',
  '软件工程',
  '人工智能',
  '电子信息工程',
  '数学与应用数学',
  '金融学',
  '物理学',
  '自动化',
  '经济学',
  '英语',
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function scoreFor(userKey: string, course: string): number {
  const n = hash(`${userKey}:${course}`);
  return Math.round((8.5 + (n % 150) / 100) * 10) / 10; // 8.5 ~ 9.9
}

/** 为每门课生成 3 位导师卡片（含该课评分） */
export function buildTutorCatalog(): CatalogTutor[] {
  const list: CatalogTutor[] = [];
  let idx = 0;

  for (const cat of COURSE_CATEGORIES) {
    for (const course of cat.courses) {
      for (let k = 0; k < 3; k++) {
        const n = idx++;
        const user_id = `tutor_c_${n}`;
        const nickname = `${SURNAMES[n % SURNAMES.length]}${GIVEN[n % GIVEN.length]}`;
        list.push({
          user_id,
          nickname,
          avatar: `https://i.pravatar.cc/150?img=${(n % 70) + 1}`,
          school_name: SCHOOLS[n % SCHOOLS.length],
          major: MAJORS[n % MAJORS.length],
          gpa: Math.round((3.5 + (hash(user_id) % 50) / 100) * 100) / 100,
          course,
          category_id: cat.id,
          score: scoreFor(user_id, course),
          student_count: 20 + (hash(`${user_id}-s`) % 280),
          group_count: 1 + (hash(`${user_id}-g`) % 6),
          course_experience: course,
        });
      }
    }
  }
  return list;
}

export const TUTOR_CATALOG = buildTutorCatalog();

export function getTutorsForCourse(course: string | null, categoryId: string, limit = 8): CatalogTutor[] {
  let pool = TUTOR_CATALOG;
  if (course) {
    pool = pool.filter((t) => t.course === course);
  } else {
    pool = pool.filter((t) => t.category_id === categoryId);
  }
  return [...pool].sort((a, b) => b.score - a.score).slice(0, limit);
}
