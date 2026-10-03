import { useState, useEffect } from 'react';
import { Check, X, GraduationCap, RefreshCw } from 'lucide-react';
import {
  getTutorApplications,
  approveTutorApplication,
  rejectTutorApplication,
} from '../../api/admin';

interface Application {
  user_id: string;
  real_name: string;
  nickname?: string;
  phone?: string;
  school_name?: string;
  major?: string;
  gpa?: number;
  course_experience?: string;
  apply_status: string;
  created_at: string;
}

function AdminTutorAuditPage() {
  const [list, setList] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('pending');
  const [message, setMessage] = useState('');

  useEffect(() => {
    load();
  }, [status]);

  async function load() {
    setLoading(true);
    setMessage('');
    try {
      const data: any = await getTutorApplications(status);
      setList(data.list || []);
    } catch (e: any) {
      setMessage(e?.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }

  async function onApprove(userId: string) {
    await approveTutorApplication(userId);
    setMessage('已通过');
    load();
  }

  async function onReject(userId: string) {
    await rejectTutorApplication(userId);
    setMessage('已拒绝');
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">导师审核</h1>
          <p className="text-sm text-neutral-500 mt-1">通过后申请人将升为导师角色</p>
        </div>
        <button
          type="button"
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 border border-neutral-200 rounded-lg text-sm hover:border-primary-500"
        >
          <RefreshCw className="w-4 h-4" /> 刷新
        </button>
      </div>

      <div className="flex gap-2">
        {['pending', 'approved', 'rejected'].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-sm ${
              status === s ? 'bg-primary-500 text-white' : 'bg-neutral-100 text-neutral-600'
            }`}
          >
            {s === 'pending' ? '待审核' : s === 'approved' ? '已通过' : '已拒绝'}
          </button>
        ))}
      </div>

      {message && <p className="text-sm text-primary-500">{message}</p>}

      <div className="space-y-4">
        {loading && <p className="text-neutral-400">加载中…</p>}
        {!loading && list.length === 0 && (
          <div className="card text-center py-12 text-neutral-400">
            <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-40" />
            暂无申请
          </div>
        )}
        {list.map((item) => (
          <div key={item.user_id} className="card flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-neutral-800">
                {item.real_name}
                <span className="text-neutral-500 font-normal ml-2">@{item.nickname}</span>
              </h3>
              <p className="text-sm text-neutral-500 mt-1">
                {item.school_name || '未填学校'} · {item.major || '未填专业'} · GPA {item.gpa ?? '—'}
              </p>
              <p className="text-sm text-neutral-600 mt-2">擅长：{item.course_experience || '—'}</p>
              <p className="text-xs text-neutral-400 mt-1">{item.phone} · {item.created_at}</p>
            </div>
            {status === 'pending' && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onApprove(item.user_id)}
                  className="inline-flex items-center gap-1 px-4 py-2 bg-success-500 text-white rounded-lg text-sm"
                >
                  <Check className="w-4 h-4" /> 通过
                </button>
                <button
                  type="button"
                  onClick={() => onReject(item.user_id)}
                  className="inline-flex items-center gap-1 px-4 py-2 bg-danger-500 text-white rounded-lg text-sm"
                >
                  <X className="w-4 h-4" /> 拒绝
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminTutorAuditPage;
