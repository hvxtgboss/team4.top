import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Filter, ChevronDown, GraduationCap, Users, BookOpen, Star } from 'lucide-react';
import { getTutors } from '../api/tutor';
import { getSchools } from '../api/schools';
import type { TutorProfile, School } from '../types';

function TutorListPage() {
  const [searchParams] = useSearchParams();
  const courseFromUrl = searchParams.get('course') || '';

  const [tutors, setTutors] = useState<TutorProfile[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [keyword, setKeyword] = useState(courseFromUrl);
  const [selectedSchool, setSelectedSchool] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showSchoolFilter, setShowSchoolFilter] = useState(false);

  useEffect(() => {
    fetchSchools();
  }, []);

  useEffect(() => {
    setKeyword(courseFromUrl);
    setPage(1);
  }, [courseFromUrl]);

  useEffect(() => {
    fetchTutors();
  }, [page, selectedSchool, courseFromUrl]);

  async function fetchSchools() {
    try {
      const result = await getSchools();
      setSchools(result);
    } catch (error) {
      console.error('获取学校列表失败:', error);
    }
  }

  async function fetchTutors(overrideKeyword?: string) {
    try {
      const kw = (overrideKeyword ?? keyword).trim();
      const result = await getTutors({
        school_id: selectedSchool || undefined,
        course: courseFromUrl || undefined,
        keyword: kw && kw !== courseFromUrl ? kw : undefined,
        page,
        page_size: 12,
      });
      setTutors(result.list);
      setTotal(result.total);
    } catch (error) {
      console.error('获取导师列表失败:', error);
    }
  }

  const handleSearch = () => {
    setPage(1);
    fetchTutors(keyword);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">认证导师</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {courseFromUrl ? `筛选课程：${courseFromUrl} · ` : ''}
            找到 {total} 位认证导师
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="搜索导师姓名、学校或专业..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-12 pr-4 py-3 text-neutral-800 border border-neutral-200 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative">
              <button
                onClick={() => setShowSchoolFilter(!showSchoolFilter)}
                className="flex items-center space-x-2 px-4 py-3 border border-neutral-200 rounded-xl hover:border-primary-500 transition-colors"
              >
                <Filter className="w-5 h-5 text-neutral-500" />
                <span className="text-sm text-neutral-600">
                  {selectedSchool ? schools.find((s) => s.school_id === selectedSchool)?.name : '学校'}
                </span>
                {showSchoolFilter ? (
                  <ChevronDown className="w-4 h-4 rotate-180 text-neutral-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-neutral-500" />
                )}
              </button>

              {showSchoolFilter && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-neutral-100 z-10 max-h-64 overflow-y-auto">
                  <button
                    onClick={() => {
                      setSelectedSchool('');
                      setShowSchoolFilter(false);
                      setPage(1);
                    }}
                    className="w-full px-4 py-2 text-sm hover:bg-primary-50 transition-colors"
                    style={{ color: !selectedSchool ? '#5B8FF9' : '#4b5563' }}
                  >
                    全部学校
                  </button>
                  {schools.map((school) => (
                    <button
                      key={school.school_id}
                      onClick={() => {
                        setSelectedSchool(school.school_id);
                        setShowSchoolFilter(false);
                        setPage(1);
                      }}
                      className="w-full px-4 py-2 text-sm hover:bg-primary-50 transition-colors"
                      style={{ color: selectedSchool === school.school_id ? '#5B8FF9' : '#4b5563' }}
                    >
                      {school.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleSearch}
              className="px-6 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors"
            >
              搜索
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {tutors.map((tutor) => (
          <Link to={`/tutors/${tutor.user_id}`} key={tutor.user_id} className="card block hover:shadow-lg transition-shadow">
            <div className="flex flex-col items-center text-center">
              <img
                src={
                  tutor.avatar ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(tutor.user_id)}`
                }
                alt={tutor.nickname || '导师头像'}
                className="w-20 h-20 rounded-full object-cover mb-4 ring-2 ring-primary-100 bg-primary-50"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
              <h3 className="font-semibold text-neutral-800 text-lg">{tutor.nickname}</h3>
              <p className="text-sm text-primary-500 mt-1">{tutor.school_name}</p>
              <p className="text-sm text-neutral-500">{tutor.major}</p>

              <div className="flex items-center justify-center space-x-4 mt-4 pt-4 border-t border-neutral-100">
                <div className="text-center">
                  <div className="flex items-center justify-center text-success-500">
                    <BookOpen className="w-4 h-4 mr-1" />
                    <span className="font-semibold">{tutor.group_count}</span>
                  </div>
                  <div className="text-xs text-neutral-500">课程群</div>
                </div>
                <div className="w-px h-8 bg-neutral-200" />
                <div className="text-center">
                  <div className="flex items-center justify-center text-primary-500">
                    <Users className="w-4 h-4 mr-1" />
                    <span className="font-semibold">{tutor.student_count}</span>
                  </div>
                  <div className="text-xs text-neutral-500">学生</div>
                </div>
                <div className="w-px h-8 bg-neutral-200" />
                <div className="text-center">
                  <div className="flex items-center justify-center text-warning-500">
                    <Star className="w-4 h-4 mr-1" />
                    <span className="font-semibold">4.9</span>
                  </div>
                  <div className="text-xs text-neutral-500">评分</div>
                </div>
              </div>

              {tutor.gpa && (
                <div className="mt-4 w-full">
                  <div className="flex items-center justify-between text-xs text-neutral-500 mb-1">
                    <span>GPA</span>
                    <span>{tutor.gpa}</span>
                  </div>
                  <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-success-400 to-success-500 rounded-full"
                      style={{ width: `${(tutor.gpa / 4) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>

      {tutors.length === 0 && (
        <div className="text-center py-16">
          <GraduationCap className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <p className="text-neutral-500">暂无认证导师</p>
        </div>
      )}
    </div>
  );
}

export default TutorListPage;
