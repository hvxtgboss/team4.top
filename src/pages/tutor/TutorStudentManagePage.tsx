import { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import { getMyStudents } from '../../api/tutor';
import { getMyGroups } from '../../api/groups';
import type { CourseGroup } from '../../types';

interface StudentRow {
  user_id: string;
  nickname: string;
  school_name?: string;
  major?: string;
  group_name?: string;
  group_id: string;
  joined_at: string;
}

function TutorStudentManagePage() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [groups, setGroups] = useState<CourseGroup[]>([]);
  const [groupId, setGroupId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    getMyGroups()
      .then(setGroups)
      .catch(() => undefined);
    load();
  }, []);

  useEffect(() => {
    load();
  }, [groupId]);

  async function load() {
    setError('');
    try {
      const data: any = await getMyStudents(groupId || undefined);
      setStudents(data.list || []);
    } catch (e: any) {
      setError(e?.message || '加载失败（需导师身份）');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">学生管理</h1>
          <p className="text-sm text-neutral-500 mt-1">来自你课程群的真实成员 · 共 {students.length} 人</p>
        </div>
        <select
          value={groupId}
          onChange={(e) => setGroupId(e.target.value)}
          className="px-3 py-2 border border-neutral-200 rounded-lg text-sm"
        >
          <option value="">全部课程群</option>
          {groups.map((g) => (
            <option key={g.group_id} value={g.group_id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-sm text-danger-500">{error}</p>}

      <div className="grid gap-3">
        {students.map((s) => (
          <div key={`${s.user_id}-${s.group_id}`} className="card flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary-500" />
              </div>
              <div>
                <p className="font-medium text-neutral-800">{s.nickname}</p>
                <p className="text-sm text-neutral-500">
                  {s.school_name || '—'} · {s.major || '—'} · {s.group_name}
                </p>
              </div>
            </div>
            <p className="text-xs text-neutral-400">{s.joined_at}</p>
          </div>
        ))}
        {students.length === 0 && !error && (
          <p className="text-center text-neutral-400 py-12">暂无学生加入</p>
        )}
      </div>
    </div>
  );
}

export default TutorStudentManagePage;
