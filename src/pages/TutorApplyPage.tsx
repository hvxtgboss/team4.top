import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Award, BookOpen, Star } from 'lucide-react';
import { applyTutor } from '../api/tutor';

function TutorApplyPage() {
  const [real_name, setRealName] = useState('');
  const [gpa, setGpa] = useState('');
  const [rank_percent, setRankPercent] = useState('');
  const [course_experience, setCourseExperience] = useState('');
  const [hourly_rate, setHourlyRate] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleApply() {
    if (!real_name) return;
    
    setLoading(true);
    try {
      await applyTutor({
        real_name,
        gpa: gpa ? parseFloat(gpa) : undefined,
        rank_percent: rank_percent ? parseFloat(rank_percent) : undefined,
        course_experience: course_experience || undefined,
        hourly_rate: hourly_rate ? parseFloat(hourly_rate) : undefined,
      });

      // 申请后仍为学生，等待管理员审核；禁止前端伪造 tutor 角色
      navigate('/tutor/rules');
      alert('申请已提交，请等待管理员审核');
    } catch (error) {
      console.error('申请失败:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-8 text-white text-center mb-8">
        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <GraduationCap className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold">申请成为导师</h1>
        <p className="text-primary-100 mt-2">分享你的知识，帮助更多同学成长</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="card text-center">
          <div className="w-12 h-12 bg-success-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <Award className="w-6 h-6 text-success-500" />
          </div>
          <div className="font-medium text-neutral-800">专业认证</div>
          <div className="text-sm text-neutral-500">审核通过后获得认证标识</div>
        </div>
        <div className="card text-center">
          <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <BookOpen className="w-6 h-6 text-primary-500" />
          </div>
          <div className="font-medium text-neutral-800">创建课程群</div>
          <div className="text-sm text-neutral-500">自由创建和管理学习群</div>
        </div>
        <div className="card text-center">
          <div className="w-12 h-12 bg-warning-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <Star className="w-6 h-6 text-warning-500" />
          </div>
          <div className="font-medium text-neutral-800">获得收益</div>
          <div className="text-sm text-neutral-500">通过课程服务获得报酬</div>
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold text-neutral-800 mb-6">填写申请信息</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">真实姓名 <span className="text-danger-500">*</span></label>
            <input
              type="text"
              placeholder="请输入真实姓名"
              value={real_name}
              onChange={(e) => setRealName(e.target.value)}
              className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">GPA</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="4"
                placeholder="如：3.8"
                value={gpa}
                onChange={(e) => setGpa(e.target.value)}
                className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">专业排名百分比</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="如：10"
                value={rank_percent}
                onChange={(e) => setRankPercent(e.target.value)}
                className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">课程经验描述</label>
            <textarea
              placeholder="请描述你的课程经验、学习方法等..."
              rows={4}
              value={course_experience}
              onChange={(e) => setCourseExperience(e.target.value)}
              className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 resize-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">期望时薪（元/小时）</label>
            <input
              type="number"
              min="0"
              placeholder="选填"
              value={hourly_rate}
              onChange={(e) => setHourlyRate(e.target.value)}
              className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
          </div>
          
          <button
            onClick={handleApply}
            disabled={loading || !real_name}
            className="w-full py-4 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '提交中...' : '提交申请'}
          </button>
          
          <p className="text-sm text-neutral-500 text-center">
            提交后，我们将在1-3个工作日内完成审核
          </p>
        </div>
      </div>
    </div>
  );
}

export default TutorApplyPage;
