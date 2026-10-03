import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Users, BookOpen, Filter, ChevronDown, ChevronRight } from 'lucide-react';
import { getGroups } from '../api/groups';
import { getSchools, getCourses } from '../api/schools';
import type { CourseGroup, School, Course } from '../types';

function GroupListPage() {
  const [groups, setGroups] = useState<CourseGroup[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [keyword, setKeyword] = useState('');
  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showSchoolFilter, setShowSchoolFilter] = useState(false);
  const [showCourseFilter, setShowCourseFilter] = useState(false);

  useEffect(() => {
    fetchSchools();
    fetchGroups();
  }, []);

  useEffect(() => {
    if (selectedSchool) {
      fetchCoursesBySchool();
    }
  }, [selectedSchool]);

  async function fetchSchools() {
    try {
      const result = await getSchools();
      setSchools(result);
    } catch (error) {
      console.error('获取学校列表失败:', error);
    }
  }

  async function fetchCoursesBySchool() {
    try {
      const result = await getCourses(selectedSchool);
      setCourses(result);
    } catch (error) {
      console.error('获取课程列表失败:', error);
    }
  }

  async function fetchGroups() {
    try {
      const result = await getGroups({
        school_id: selectedSchool || undefined,
        course_id: selectedCourse || undefined,
        keyword: keyword || undefined,
        page,
        page_size: 10,
      });
      setGroups(result.list);
      setTotal(result.total);
    } catch (error) {
      console.error('获取课程群列表失败:', error);
    }
  }

  const handleSearch = () => {
    setPage(1);
    fetchGroups();
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchGroups();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">课程群</h1>
          <p className="text-sm text-neutral-500 mt-1">找到 {total} 个课程群</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="搜索课程名称、学校或导师..."
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
                  {selectedSchool ? schools.find(s => s.school_id === selectedSchool)?.name : '学校'}
                </span>
                {showSchoolFilter ? <ChevronUp className="w-4 h-4 text-neutral-500" /> : <ChevronDown className="w-4 h-4 text-neutral-500" />}
              </button>
              
              {showSchoolFilter && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-neutral-100 z-10 max-h-64 overflow-y-auto">
                  <button
                    onClick={() => { setSelectedSchool(''); setSelectedCourse(''); handleSearch(); }}
                    className="w-full px-4 py-2 text-sm hover:bg-primary-50 transition-colors"
                    style={{ color: !selectedSchool ? '#5B8FF9' : '#4b5563' }}
                  >
                    全部学校
                  </button>
                  {schools.map((school) => (
                    <button
                      key={school.school_id}
                      onClick={() => { setSelectedSchool(school.school_id); setSelectedCourse(''); handleSearch(); }}
                      className="w-full px-4 py-2 text-sm hover:bg-primary-50 transition-colors"
                      style={{ color: selectedSchool === school.school_id ? '#5B8FF9' : '#4b5563' }}
                    >
                      {school.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {selectedSchool && (
              <div className="relative">
                <button
                  onClick={() => setShowCourseFilter(!showCourseFilter)}
                  className="flex items-center space-x-2 px-4 py-3 border border-neutral-200 rounded-xl hover:border-primary-500 transition-colors"
                >
                  <span className="text-sm text-neutral-600">
                    {selectedCourse ? courses.find(c => c.course_id === selectedCourse)?.name : '课程'}
                  </span>
                  {showCourseFilter ? <ChevronUp className="w-4 h-4 text-neutral-500" /> : <ChevronDown className="w-4 h-4 text-neutral-500" />}
                </button>
                
                {showCourseFilter && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-neutral-100 z-10 max-h-64 overflow-y-auto">
                    <button
                      onClick={() => { setSelectedCourse(''); handleSearch(); }}
                      className="w-full px-4 py-2 text-sm hover:bg-primary-50 transition-colors"
                      style={{ color: !selectedCourse ? '#5B8FF9' : '#4b5563' }}
                    >
                      全部课程
                    </button>
                    {courses.map((course) => (
                      <button
                        key={course.course_id}
                        onClick={() => { setSelectedCourse(course.course_id); handleSearch(); }}
                        className="w-full px-4 py-2 text-sm hover:bg-primary-50 transition-colors"
                        style={{ color: selectedCourse === course.course_id ? '#5B8FF9' : '#4b5563' }}
                      >
                        {course.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            <button
              onClick={handleSearch}
              className="px-6 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors"
            >
              搜索
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {groups.map((group) => (
          <Link to={`/groups/${group.group_id}`} key={group.group_id} className="card block hover:shadow-lg transition-shadow">
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-8 h-8 text-primary-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-neutral-800">{group.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${group.price > 0 ? 'bg-warning-50 text-warning-500' : 'bg-success-50 text-success-500'}`}>
                    {group.price > 0 ? `¥${group.price}` : '免费'}
                  </span>
                </div>
                <p className="text-sm text-neutral-500 mt-1">{group.course_name} · {group.school_name}</p>
                <p className="text-sm text-neutral-600 mt-2 line-clamp-2">{group.description}</p>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center text-sm text-neutral-500">
                      <Users className="w-4 h-4 mr-1" />
                      {group.member_count}/{group.max_members}成员
                    </span>
                    <span className="flex items-center text-sm text-neutral-500">
                      <BookOpen className="w-4 h-4 mr-1" />
                      23资料
                    </span>
                  </div>
                  <span className="text-sm text-primary-500 flex items-center">
                    查看详情 <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {groups.length === 0 && (
        <div className="text-center py-16">
          <BookOpen className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <p className="text-neutral-500">暂无课程群</p>
        </div>
      )}

      {total > 10 && (
        <div className="flex items-center justify-center space-x-2">
          <button
            onClick={() => page > 1 && handlePageChange(page - 1)}
            disabled={page === 1}
            className="px-4 py-2 border border-neutral-200 rounded-lg hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            上一页
          </button>
          {Array.from({ length: Math.ceil(total / 10) }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => handlePageChange(p)}
              className={`px-4 py-2 rounded-lg ${page === p ? 'bg-primary-500 text-white' : 'border border-neutral-200 hover:bg-neutral-50'}`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => page < Math.ceil(total / 10) && handlePageChange(page + 1)}
            disabled={page === Math.ceil(total / 10)}
            className="px-4 py-2 border border-neutral-200 rounded-lg hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}

export default GroupListPage;
