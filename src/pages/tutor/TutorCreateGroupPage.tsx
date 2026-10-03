import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, GraduationCap, Briefcase, DollarSign, Users, Send, ArrowLeft } from 'lucide-react';
import { createGroup } from '../../api/groups';
import { getSchools } from '../../api/schools';
import type { School } from '../../types';

function TutorCreateGroupPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    school_name: '',
    course_name: '',
    major: '',
    description: '',
    price: 0,
    max_members: 50,
  });
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchSchools();
  }, []);

  async function fetchSchools() {
    try {
      const result = await getSchools();
      setSchools(result);
    } catch (error) {
      console.error('获取学校列表失败:', error);
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = '课程群名称不能为空';
    }
    if (!formData.school_name.trim()) {
      newErrors.school_name = '学校名称不能为空';
    }
    if (!formData.course_name.trim()) {
      newErrors.course_name = '课程名称不能为空';
    }
    if (formData.price < 0) {
      newErrors.price = '价格不能为负数';
    }
    if (formData.max_members <= 0) {
      newErrors.max_members = '人数限制必须大于0';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      await createGroup(formData);
      navigate('/tutor/groups');
    } catch (error: any) {
      console.error('创建课程群失败:', error);
      alert(error.message || '创建课程群失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center space-x-4 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-neutral-100 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-neutral-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">创建课程群</h1>
          <p className="text-sm text-neutral-500 mt-1">填写课程群信息，开始辅导之旅</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6">
          <h2 className="text-lg font-semibold text-neutral-800 mb-6 flex items-center">
            <BookOpen className="w-5 h-5 mr-2 text-primary-500" />
            基本信息
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">课程群名称 <span className="text-red-500">*</span></label>
              <div className="relative">
                <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="例如：高等数学期末冲刺群"
                  className={`w-full pl-12 pr-4 py-4 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                    errors.name ? 'border-red-500 focus:ring-red-100' : 'border-neutral-200 focus:border-primary-500 focus:ring-primary-100'
                  }`}
                />
              </div>
              {errors.name && <p className="text-red-500 text-sm mt-2">{errors.name}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">学校 <span className="text-red-500">*</span></label>
                <div className="relative">
                  <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <select
                    value={formData.school_name}
                    onChange={(e) => handleInputChange('school_name', e.target.value)}
                    className={`w-full pl-12 pr-4 py-4 border rounded-xl focus:outline-none focus:ring-2 transition-colors appearance-none bg-white ${
                      errors.school_name ? 'border-red-500 focus:ring-red-100' : 'border-neutral-200 focus:border-primary-500 focus:ring-primary-100'
                    }`}
                  >
                    <option value="">选择学校</option>
                    {schools.map((school) => (
                      <option key={school.school_id} value={school.name}>
                        {school.name}
                      </option>
                    ))}
                    <option value="custom">自定义学校</option>
                  </select>
                </div>
                {errors.school_name && <p className="text-red-500 text-sm mt-2">{errors.school_name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">课程名称 <span className="text-red-500">*</span></label>
                <div className="relative">
                  <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type="text"
                    value={formData.course_name}
                    onChange={(e) => handleInputChange('course_name', e.target.value)}
                    placeholder="例如：高等数学"
                    className={`w-full pl-12 pr-4 py-4 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                      errors.course_name ? 'border-red-500 focus:ring-red-100' : 'border-neutral-200 focus:border-primary-500 focus:ring-primary-100'
                    }`}
                  />
                </div>
                {errors.course_name && <p className="text-red-500 text-sm mt-2">{errors.course_name}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">专业</label>
              <div className="relative">
                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="text"
                  value={formData.major}
                  onChange={(e) => handleInputChange('major', e.target.value)}
                  placeholder="例如：计算机科学与技术"
                  className="w-full pl-12 pr-4 py-4 border border-neutral-200 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">课程介绍</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="详细介绍课程内容、辅导方式、学习目标等..."
                rows={4}
                className="w-full px-4 py-4 border border-neutral-200 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 resize-none"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6">
          <h2 className="text-lg font-semibold text-neutral-800 mb-6 flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-primary-500" />
            收费与规模
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">价格（元）</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  className={`w-full pl-12 pr-4 py-4 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                    errors.price ? 'border-red-500 focus:ring-red-100' : 'border-neutral-200 focus:border-primary-500 focus:ring-primary-100'
                  }`}
                />
              </div>
              {errors.price && <p className="text-red-500 text-sm mt-2">{errors.price}</p>}
              <p className="text-sm text-neutral-500 mt-2">设置为0表示免费课程群</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">人数限制</label>
              <div className="relative">
                <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="number"
                  value={formData.max_members}
                  onChange={(e) => handleInputChange('max_members', parseInt(e.target.value) || 0)}
                  placeholder="50"
                  min="1"
                  className={`w-full pl-12 pr-4 py-4 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                    errors.max_members ? 'border-red-500 focus:ring-red-100' : 'border-neutral-200 focus:border-primary-500 focus:ring-primary-100'
                  }`}
                />
              </div>
              {errors.max_members && <p className="text-red-500 text-sm mt-2">{errors.max_members}</p>}
              <p className="text-sm text-neutral-500 mt-2">设置课程群最大成员数量</p>
            </div>
          </div>
        </div>

        <div className="flex space-x-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 py-4 border border-neutral-200 text-neutral-700 rounded-xl font-medium hover:bg-neutral-50 transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-4 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
                创建中...
              </span>
            ) : (
              <span className="flex items-center">
                <Send className="w-5 h-5 mr-2" />
                创建课程群
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default TutorCreateGroupPage;
