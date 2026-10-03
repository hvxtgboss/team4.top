import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { GraduationCap, Users, BookOpen, Star, Award, ChevronRight, MapPin, MessageCircle, Phone, CheckCircle } from 'lucide-react';
import { getTutorDetail } from '../api/tutor';
import type { TutorProfile } from '../types';

function TutorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<TutorProfile | null>(null);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchTutorDetail();
    }
  }, [id]);

  async function fetchTutorDetail() {
    try {
      const result = await getTutorDetail(id!);
      setProfile(result.profile);
      setGroups(result.groups);
      setLoading(false);
    } catch (error) {
      console.error('获取导师详情失败:', error);
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="text-center py-16">加载中...</div>;
  }

  if (!profile) {
    return <div className="text-center py-16">导师不存在</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-8 text-white">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
            <GraduationCap className="w-12 h-12 text-white" />
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-2xl font-bold mb-2">{profile.nickname}</h1>
            <p className="text-primary-100 flex items-center justify-center md:justify-start">
              <MapPin className="w-4 h-4 mr-2" />
              {profile.school_name} · {profile.major}
            </p>
          </div>
          <div className="flex items-center space-x-6 ml-auto">
            <div className="text-center">
              <div className="text-2xl font-bold">{profile.group_count}</div>
              <div className="text-sm text-primary-100">课程群</div>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div className="text-center">
              <div className="text-2xl font-bold">{profile.student_count}</div>
              <div className="text-sm text-primary-100">学生</div>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div className="text-center">
              <div className="text-2xl font-bold flex items-center">
                <Star className="w-5 h-5 mr-1 text-warning-400 fill-warning-400" />
                4.9
              </div>
              <div className="text-sm text-primary-100">评分</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="card">
            <h2 className="font-semibold text-neutral-800 mb-4 flex items-center">
              <Award className="w-5 h-5 mr-2 text-primary-500" />
              导师资质
            </h2>
            <div className="space-y-4">
              {profile.gpa && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-neutral-600">GPA</span>
                    <span className="font-medium text-success-500">{profile.gpa}</span>
                  </div>
                  <div className="h-3 bg-neutral-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-success-400 to-success-500 rounded-full"
                      style={{ width: `${(profile.gpa / 4) * 100}%` }}
                    />
                  </div>
                </div>
              )}
              {profile.rank_percent && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">专业排名</span>
                  <span className="font-medium text-neutral-800">前 {profile.rank_percent}%</span>
                </div>
              )}
              {profile.hourly_rate && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">时薪</span>
                  <span className="font-medium text-warning-500">¥{profile.hourly_rate}/小时</span>
                </div>
              )}
              {profile.course_experience && (
                <div>
                  <span className="text-sm text-neutral-600 block mb-2">课程经验</span>
                  <p className="text-neutral-800">{profile.course_experience}</p>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <h2 className="font-semibold text-neutral-800 mb-4 flex items-center">
              <BookOpen className="w-5 h-5 mr-2 text-primary-500" />
              课程群 ({groups.length})
            </h2>
            <div className="space-y-4">
              {groups.map((group) => (
                <Link to={`/groups/${group.group_id}`} key={group.group_id} className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl hover:bg-primary-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-primary-500" />
                    </div>
                    <div>
                      <h3 className="font-medium text-neutral-800">{group.name}</h3>
                      <p className="text-sm text-neutral-500">{group.course_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center text-sm text-neutral-500">
                      <Users className="w-4 h-4 mr-1" />
                      {group.member_count}人
                    </span>
                    <span className={`text-sm font-medium ${group.price > 0 ? 'text-warning-500' : 'text-success-500'}`}>
                      {group.price > 0 ? `¥${group.price}` : '免费'}
                    </span>
                    <ChevronRight className="w-5 h-5 text-neutral-400" />
                  </div>
                </Link>
              ))}
              
              {groups.length === 0 && (
                <div className="text-center py-8 text-neutral-500">
                  暂无课程群
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h3 className="font-medium text-neutral-800 mb-4">联系导师</h3>
            <div className="space-y-4">
              <button className="w-full px-6 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors flex items-center justify-center">
                <MessageCircle className="w-5 h-5 mr-2" />
                私信导师
              </button>
              <button className="w-full px-6 py-3 bg-white text-primary-500 border border-primary-500 rounded-xl font-medium hover:bg-primary-50 transition-colors flex items-center justify-center">
                <Phone className="w-5 h-5 mr-2" />
                电话咨询
              </button>
            </div>
          </div>

          <div className="card">
            <h3 className="font-medium text-neutral-800 mb-4">导师认证</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">实名认证</span>
                <span className="flex items-center text-success-500">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  已认证
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">学籍认证</span>
                <span className="flex items-center text-success-500">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  已认证
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">资质审核</span>
                <span className="flex items-center text-success-500">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  已通过
                </span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-medium text-neutral-800 mb-4">统计数据</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-500">答疑次数</span>
                <span className="font-medium text-neutral-800">1,234</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-500">好评率</span>
                <span className="font-medium text-success-500">98%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-500">活跃天数</span>
                <span className="font-medium text-neutral-800">365天</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TutorDetailPage;
