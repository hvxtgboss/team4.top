import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Filter, Plus, Clock, CheckCircle, Loader2 } from 'lucide-react';
import type { Course } from '@/types';

const mockCourses: Course[] = [
  {
    course_id: '1',
    user_id: '1',
    name: '宏观经济学',
    category: '经济学',
    description: '宏观经济学基础课程，涵盖GDP、通货膨胀、货币政策等核心内容',
    cover_image: '',
    status: 'completed',
    created_at: '2024-01-15',
    updated_at: '2024-01-15',
  },
  {
    course_id: '2',
    user_id: '1',
    name: '中国近代史纲要',
    category: '历史学',
    description: '从鸦片战争到新中国成立的历史发展脉络',
    cover_image: '',
    status: 'processing',
    created_at: '2024-01-10',
    updated_at: '2024-01-10',
  },
  {
    course_id: '3',
    user_id: '1',
    name: '高等数学',
    category: '数学',
    description: '微积分、线性代数、概率论基础',
    cover_image: '',
    status: 'pending',
    created_at: '2024-01-08',
    updated_at: '2024-01-08',
  },
];

function CourseListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<Course['status'] | 'all'>('all');
  const navigate = useNavigate();

  const filteredCourses = mockCourses.filter((course) => {
    const matchesSearch = course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || course.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusIcon = (status: Course['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-success-500" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-primary-500 animate-spin" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-neutral-400" />;
    }
  };

  const getStatusText = (status: Course['status']) => {
    switch (status) {
      case 'completed':
        return '已完成';
      case 'processing':
        return '处理中';
      case 'pending':
        return '待处理';
    }
  };

  const getStatusColor = (status: Course['status']) => {
    switch (status) {
      case 'completed':
        return 'text-success-500 bg-success-50';
      case 'processing':
        return 'text-primary-500 bg-primary-50';
      case 'pending':
        return 'text-neutral-500 bg-neutral-100';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-neutral-800">我的课程</h1>
        <Link
          to="/courses/create"
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          新建课程
        </Link>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="搜索课程名称或分类"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-neutral-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as Course['status'] | 'all')}
            className="px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500"
          >
            <option value="all">全部状态</option>
            <option value="pending">待处理</option>
            <option value="processing">处理中</option>
            <option value="completed">已完成</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCourses.map((course) => (
          <div
            key={course.course_id}
            onClick={() => navigate(`/courses/${course.course_id}`)}
            className="card cursor-pointer hover:border-primary-200"
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-lg font-semibold text-neutral-800">{course.name}</h3>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getStatusColor(course.status)}`}>
                {getStatusIcon(course.status)}
                <span>{getStatusText(course.status)}</span>
              </div>
            </div>
            <p className="text-sm text-neutral-500 mb-3 line-clamp-2">{course.description}</p>
            <div className="flex items-center justify-between text-xs text-neutral-400">
              <span className="px-2 py-1 bg-neutral-100 rounded">{course.category}</span>
              <span>创建于 {course.created_at}</span>
            </div>
          </div>
        ))}
      </div>

      {filteredCourses.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-neutral-400" />
          </div>
          <p className="text-neutral-500">没有找到匹配的课程</p>
          <Link to="/courses/create" className="btn-secondary mt-4">
            新建课程
          </Link>
        </div>
      )}
    </div>
  );
}

export default CourseListPage;
