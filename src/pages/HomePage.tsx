import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Users,
  BookOpen,
  MessageCircle,
  Star,
  ChevronRight,
  Filter,
  UserRound,
  MessagesSquare,
  Heart,
} from 'lucide-react';
import { getGroups } from '../api/groups';
import { getRecommendTutors } from '../api/tutor';
import { COURSE_CATEGORIES } from '../data/courseCategories';
import { BRAND_NAME, BRAND_TAGLINE, BRAND_SUBTITLE } from '../data/brand';
import type { CourseGroup } from '../types';

const TRUST_ITEMS = [
  { icon: Filter, label: '严格的学霸入选标准' },
  { icon: UserRound, label: '数千学霸覆盖各专业' },
  { icon: MessagesSquare, label: '一对一 | 一对多定制学习' },
  { icon: Heart, label: '已有数万同学跟学' },
];

interface RecommendTutor {
  user_id: string;
  nickname: string;
  avatar?: string;
  school_name?: string;
  major?: string;
  course_name: string;
  score: number;
  student_count?: number;
  group_count?: number;
  gpa?: number;
}

function HomePage() {
  const navigate = useNavigate();
  const [hotGroups, setHotGroups] = useState<CourseGroup[]>([]);
  const [recommendTutors, setRecommendTutors] = useState<RecommendTutor[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState(COURSE_CATEGORIES[0].id);
  const [activeCourse, setActiveCourse] = useState<string | null>(null);

  const activeCategory =
    COURSE_CATEGORIES.find((c) => c.id === activeCategoryId) ?? COURSE_CATEGORIES[0];

  useEffect(() => {
    fetchHotGroups();
  }, [activeCourse, activeCategoryId]);

  useEffect(() => {
    fetchRecommend();
  }, [activeCourse, activeCategoryId]);

  async function fetchHotGroups() {
    try {
      const result = await getGroups({
        page: 1,
        page_size: 12,
        keyword: activeCourse || undefined,
        category_id: activeCourse ? undefined : activeCategoryId,
      });
      setHotGroups(result.list);
    } catch (error) {
      console.error('获取热门课程群失败:', error);
    }
  }

  async function fetchRecommend() {
    try {
      const data: any = await getRecommendTutors({
        course: activeCourse || undefined,
        category_id: activeCourse ? undefined : activeCategoryId,
        page_size: 8,
      });
      setRecommendTutors(data.list || []);
    } catch (error) {
      console.error('获取推荐导师失败:', error);
      setRecommendTutors([]);
    }
  }

  function handleSearch() {
    const q = searchKeyword.trim();
    navigate(q ? `/groups?keyword=${encodeURIComponent(q)}` : '/groups');
  }

  function handleSelectCategory(id: string) {
    setActiveCategoryId(id);
    setActiveCourse(null);
  }

  function handleSelectCourse(course: string) {
    setActiveCourse((prev) => (prev === course ? null : course));
  }

  return (
    <div className="space-y-8">
      <section className="bg-neutral-50 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-10 border-b border-neutral-100">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-primary-500 font-semibold tracking-wide mb-2">{BRAND_NAME}</p>
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-800 mb-2">
            学霸互助，定制学习
          </h1>
          <p className="text-neutral-500 mb-2">{BRAND_TAGLINE}</p>
          <p className="text-sm text-neutral-400 mb-6">{BRAND_SUBTITLE}</p>

          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="你想学的课程："
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-12 pr-24 py-3.5 text-neutral-800 bg-white border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
            <button
              type="button"
              onClick={handleSearch}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-5 py-2 bg-primary-500 text-white rounded-md text-sm font-medium hover:bg-primary-600 transition-colors"
            >
              搜索
            </button>
          </div>
        </div>
      </section>

      <section className="bg-white border border-neutral-100 rounded-xl overflow-hidden">
        <div className="px-4 pt-4 pb-1">
          <p className="text-sm text-neutral-500 mb-3">你想找的课程：</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {COURSE_CATEGORIES.map((cat) => {
              const selected = cat.id === activeCategoryId;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleSelectCategory(cat.id)}
                  className={`pb-3 text-sm md:text-base font-medium transition-colors relative ${
                    selected ? 'text-primary-500' : 'text-neutral-700 hover:text-primary-500'
                  }`}
                >
                  {cat.name}
                  {selected && (
                    <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-primary-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-neutral-100 bg-white px-4 py-4">
          <div className="flex flex-wrap gap-x-5 gap-y-2.5">
            {activeCategory.courses.map((course) => {
              const selected = activeCourse === course;
              return (
                <button
                  key={course}
                  type="button"
                  onClick={() => handleSelectCourse(course)}
                  className={`text-sm transition-colors ${
                    selected
                      ? 'text-primary-500 font-medium'
                      : 'text-neutral-600 hover:text-primary-500'
                  }`}
                >
                  {course}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 与分类联动的推荐导师 */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-warning-500" />
              <h2 className="text-xl font-bold text-neutral-800">推荐导师</h2>
            </div>
            <p className="text-sm text-neutral-500 mt-1">
              {activeCourse
                ? `「${activeCourse}」高分学霸 · 按课程评分排序`
                : `「${activeCategory.name}」方向学霸 · 点击子课程查看专属评分`}
            </p>
          </div>
          <Link to="/tutors" className="text-sm text-primary-500 hover:text-primary-600 flex items-center">
            查看全部 <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {recommendTutors.map((tutor) => (
            <Link
              to={`/tutors/${tutor.user_id}`}
              key={`${tutor.user_id}-${tutor.course_name}`}
              className="card block hover:shadow-lg transition-shadow"
            >
              <div className="flex flex-col items-center text-center">
                <img
                  src={tutor.avatar}
                  alt={tutor.nickname}
                  className="w-16 h-16 rounded-full object-cover mb-3 ring-2 ring-primary-100 bg-primary-50"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
                <h3 className="font-medium text-neutral-800">{tutor.nickname}</h3>
                <p className="text-sm text-neutral-500">{tutor.school_name}</p>
                <p className="text-xs text-primary-500 mt-1 font-medium truncate w-full px-2">
                  擅长：{tutor.course_name}
                </p>
                <p className="text-sm text-neutral-500 truncate w-full px-2">{tutor.major}</p>
                <div className="flex items-center gap-1 mt-3 text-warning-500">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="font-semibold text-neutral-800">{Number(tutor.score).toFixed(1)}</span>
                  <span className="text-xs text-neutral-400">课程分</span>
                </div>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="text-xs text-neutral-500">{tutor.group_count ?? 0}个群</span>
                  <span className="text-xs text-neutral-500">{tutor.student_count ?? 0}学生</span>
                </div>
                {tutor.gpa != null && (
                  <span className="mt-2 px-3 py-1 bg-success-50 text-success-500 text-xs rounded-full">
                    GPA {tutor.gpa}
                  </span>
                )}
              </div>
            </Link>
          ))}
          {recommendTutors.length === 0 && (
            <p className="col-span-full text-center text-neutral-400 py-8">暂无推荐导师</p>
          )}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-neutral-800">
              {activeCourse ? `「${activeCourse}」相关课程群` : '热门课程群'}
            </h2>
            <p className="text-sm text-neutral-500 mt-1">
              {activeCategory.name}
              {activeCourse ? ` · ${activeCourse}` : ' · 精选推荐'}
            </p>
          </div>
          <Link to="/groups" className="text-sm text-primary-500 hover:text-primary-600 flex items-center">
            查看全部 <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {hotGroups.map((group) => (
            <div key={group.group_id} className="card hover:shadow-lg transition-shadow">
              <Link to={`/groups/${group.group_id}`} className="block">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-6 h-6 text-primary-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-neutral-800 truncate">{group.name}</h3>
                    <p className="text-sm text-neutral-500 truncate">{group.course_name}</p>
                    <p className="text-sm text-neutral-500 mt-1">{group.school_name}</p>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center space-x-3">
                        <span className="flex items-center text-sm text-neutral-500">
                          <Users className="w-4 h-4 mr-1" />
                          {group.member_count}人
                        </span>
                        <span className="flex items-center text-sm text-neutral-500">
                          <MessageCircle className="w-4 h-4 mr-1" />
                          答疑
                        </span>
                      </div>
                      <span className="text-primary-500 font-medium">
                        {group.price > 0 ? `¥${group.price}` : '免费'}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
              {group.tutor_id && (
                <Link
                  to={`/tutors/${group.tutor_id}`}
                  className="mt-4 pt-3 border-t border-neutral-100 flex items-center gap-2 hover:opacity-80"
                >
                  <img
                    src={
                      group.tutor_avatar ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(group.tutor_id)}`
                    }
                    alt={group.tutor_nickname || '导师'}
                    className="w-8 h-8 rounded-full object-cover bg-primary-50"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-neutral-800 truncate">
                      {group.tutor_nickname || '认证导师'}
                    </p>
                    <p className="text-xs text-neutral-400">主讲导师 · 查看主页</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-300 flex-shrink-0" />
                </Link>
              )}
            </div>
          ))}
          {hotGroups.length === 0 && (
            <p className="col-span-full text-center text-neutral-400 py-10">
              {activeCourse ? '该课程暂无课程群，可先约上方推荐导师' : '暂无课程群'}
            </p>
          )}
        </div>
      </section>

      <section className="bg-gradient-to-r from-primary-50 to-success-50 rounded-2xl p-8">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-neutral-800 mb-2">成为导师，分享知识</h2>
            <p className="text-neutral-600">
              成绩优秀、有课程经验？先了解入选规则，再加入「{BRAND_NAME}」导师团队
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex flex-wrap gap-3">
            <Link
              to="/tutor/rules"
              className="px-6 py-3 border border-primary-500 text-primary-500 rounded-lg font-medium hover:bg-primary-50 transition-colors"
            >
              查看导师规则
            </Link>
            <Link
              to="/tutor/apply"
              className="px-6 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
            >
              申请成为导师
            </Link>
          </div>
        </div>
      </section>

      {/* 在行风格深色信任栏 */}
      <section className="bg-neutral-900 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {TRUST_ITEMS.map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center">
                <Icon className="w-6 h-6 text-white" strokeWidth={1.5} />
              </div>
              <p className="text-sm md:text-base text-white font-medium leading-snug">{label}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default HomePage;
