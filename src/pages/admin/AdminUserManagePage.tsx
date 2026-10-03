import { useState, useEffect } from 'react';
import { Search, Shield, GraduationCap, User } from 'lucide-react';
import { getAdminUsers } from '../../api/admin';

interface AdminUser {
  user_id: string;
  phone: string;
  nickname: string;
  role: 'student' | 'tutor' | 'admin';
  school_name?: string;
  major?: string;
  status: string;
  created_at: string;
}

function AdminUserManagePage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [roleFilter, setRoleFilter] = useState('');
  const [keyword, setKeyword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    load();
  }, [roleFilter]);

  async function load() {
    setError('');
    try {
      const data: any = await getAdminUsers({
        role: roleFilter || undefined,
        keyword: keyword || undefined,
        page: 1,
        page_size: 50,
      });
      setUsers(data.list || []);
      setTotal(data.total || 0);
    } catch (e: any) {
      setError(e?.message || '加载失败');
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-800">用户管理</h1>
        <p className="text-sm text-neutral-500 mt-1">共 {total} 人（真实数据库）</p>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
            placeholder="搜索昵称或手机号"
            className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg"
          />
        </div>
        <div className="flex gap-2 bg-neutral-100 p-1 rounded-lg">
          {[
            { v: '', t: '全部' },
            { v: 'student', t: '学生' },
            { v: 'tutor', t: '导师' },
            { v: 'admin', t: '管理员' },
          ].map((x) => (
            <button
              key={x.v}
              type="button"
              onClick={() => setRoleFilter(x.v)}
              className={`px-3 py-1.5 rounded-md text-sm ${
                roleFilter === x.v ? 'bg-white shadow-sm text-primary-500' : 'text-neutral-600'
              }`}
            >
              {x.t}
            </button>
          ))}
        </div>
        <button type="button" onClick={load} className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm">
          搜索
        </button>
      </div>

      {error && <p className="text-sm text-danger-500">{error}</p>}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-neutral-500 border-b border-neutral-100">
              <th className="py-3 pr-4">用户</th>
              <th className="py-3 pr-4">角色</th>
              <th className="py-3 pr-4">学校/专业</th>
              <th className="py-3 pr-4">手机</th>
              <th className="py-3">注册时间</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.user_id} className="border-b border-neutral-50">
                <td className="py-3 pr-4 font-medium text-neutral-800">{user.nickname}</td>
                <td className="py-3 pr-4">
                  <span className="inline-flex items-center gap-1">
                    {user.role === 'admin' && <Shield className="w-4 h-4 text-danger-500" />}
                    {user.role === 'tutor' && <GraduationCap className="w-4 h-4 text-success-500" />}
                    {user.role === 'student' && <User className="w-4 h-4 text-primary-500" />}
                    {user.role}
                  </span>
                </td>
                <td className="py-3 pr-4 text-neutral-500">
                  {user.school_name || '—'} / {user.major || '—'}
                </td>
                <td className="py-3 pr-4 text-neutral-500">{user.phone}</td>
                <td className="py-3 text-neutral-400">{user.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminUserManagePage;
