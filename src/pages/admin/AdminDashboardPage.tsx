import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, BookOpen, MessageCircle, GraduationCap, AlertCircle, ChevronRight, FileText } from 'lucide-react';
import { getAdminStats } from '../../api/admin';

function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalGroups: 0,
    totalMaterials: 0,
    totalTutors: 0,
    totalQuestions: 0,
    pendingTutorAudit: 0,
    pendingGroupAudit: 0,
    pendingMaterialAudit: 0,
    pendingComplaints: 0,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    getAdminStats()
      .then((data: any) => setStats((prev) => ({ ...prev, ...data })))
      .catch((e: any) => setError(e?.message || '加载统计失败，请确认已用管理员账号登录'));
  }, []);

  const pendingTotal =
    stats.pendingTutorAudit + stats.pendingGroupAudit + stats.pendingMaterialAudit;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-800">管理后台</h1>
        <p className="text-sm text-neutral-500 mt-1">数据来自真实数据库</p>
      </div>

      {error && <p className="text-sm text-danger-500">{error}</p>}

      {pendingTotal > 0 && (
        <div className="bg-warning-50 border border-warning-200 rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-warning-500" />
            <div>
              <p className="text-sm text-warning-800 font-medium">待办审核</p>
              <p className="text-xs text-warning-600 mt-1">
                导师 {stats.pendingTutorAudit} · 课程群 {stats.pendingGroupAudit} · 资料{' '}
                {stats.pendingMaterialAudit}
              </p>
            </div>
          </div>
          <Link
            to="/admin/tutor-audit"
            className="px-4 py-2 bg-warning-500 text-white rounded-lg text-sm font-medium"
          >
            去处理
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: '用户总数', value: stats.totalUsers, icon: Users },
          { label: '课程群', value: stats.totalGroups, icon: BookOpen },
          { label: '学习资料', value: stats.totalMaterials, icon: FileText },
          { label: '认证导师', value: stats.totalTutors, icon: GraduationCap },
          { label: '问答帖', value: stats.totalQuestions, icon: MessageCircle },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="card">
            <p className="text-sm text-neutral-500">{label}</p>
            <div className="flex items-center justify-between mt-2">
              <p className="text-2xl font-bold text-neutral-800">{value}</p>
              <Icon className="w-6 h-6 text-primary-500" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Link to="/admin/users" className="card flex items-center justify-between hover:shadow-md">
          <span className="font-medium text-neutral-800">用户管理</span>
          <ChevronRight className="w-5 h-5 text-neutral-400" />
        </Link>
        <Link to="/admin/tutor-audit" className="card flex items-center justify-between hover:shadow-md">
          <span className="font-medium text-neutral-800">导师审核</span>
          <ChevronRight className="w-5 h-5 text-neutral-400" />
        </Link>
        <Link to="/admin/group-audit" className="card flex items-center justify-between hover:shadow-md">
          <span className="font-medium text-neutral-800">课程群审核</span>
          <ChevronRight className="w-5 h-5 text-neutral-400" />
        </Link>
        <Link to="/admin/material-audit" className="card flex items-center justify-between hover:shadow-md">
          <span className="font-medium text-neutral-800">资料审核</span>
          <ChevronRight className="w-5 h-5 text-neutral-400" />
        </Link>
      </div>
    </div>
  );
}

export default AdminDashboardPage;
