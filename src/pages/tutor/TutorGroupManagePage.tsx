import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, Users, BookOpen, MessageCircle } from 'lucide-react';
import { getMyGroups, deleteGroup } from '../../api/groups';
import type { CourseGroup } from '../../types';

function TutorGroupManagePage() {
  const [groups, setGroups] = useState<CourseGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGroups();
  }, []);

  async function fetchGroups() {
    try {
      const result = await getMyGroups();
      setGroups(result);
      setLoading(false);
    } catch (error) {
      console.error('获取课程群失败:', error);
      setLoading(false);
    }
  }

  async function handleDelete(group_id: string) {
    if (!confirm('确定要删除这个课程群吗？')) return;
    
    try {
      await deleteGroup(group_id);
      fetchGroups();
    } catch (error) {
      console.error('删除课程群失败:', error);
    }
  }

  if (loading) {
    return <div className="text-center py-16">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">课程群管理</h1>
          <p className="text-sm text-neutral-500 mt-1">管理你创建的课程群</p>
        </div>
        <Link to="/tutor/groups/create" className="px-6 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors flex items-center">
          <Plus className="w-5 h-5 mr-2" />
          创建课程群
        </Link>
      </div>

      {groups.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-neutral-300" />
          </div>
          <p className="text-neutral-500 mb-4">暂无课程群</p>
          <Link to="/tutor/groups/create" className="px-6 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors">
            创建第一个课程群
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <div key={group.group_id} className="card">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-primary-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-800">{group.name}</h3>
                    <p className="text-sm text-neutral-500">{group.course_name} · {group.school_name}</p>
                    <p className="text-sm text-neutral-600 mt-1 line-clamp-2">{group.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className="flex items-center text-primary-500">
                      <Users className="w-4 h-4 mr-1" />
                      <span className="font-semibold">{group.member_count}/{group.max_members}</span>
                    </div>
                    <div className="text-xs text-neutral-500">成员</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center text-neutral-500">
                      <BookOpen className="w-4 h-4 mr-1" />
                      <span className="font-semibold">23</span>
                    </div>
                    <div className="text-xs text-neutral-500">资料</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center text-neutral-500">
                      <MessageCircle className="w-4 h-4 mr-1" />
                      <span className="font-semibold">45</span>
                    </div>
                    <div className="text-xs text-neutral-500">问答</div>
                  </div>
                  <div className="text-center">
                    <div className={`font-semibold ${group.price > 0 ? 'text-warning-500' : 'text-success-500'}`}>
                      {group.price > 0 ? `¥${group.price}` : '免费'}
                    </div>
                    <div className="text-xs text-neutral-500">费用</div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Link to={`/groups/${group.group_id}`} className="px-4 py-2 bg-primary-50 text-primary-500 rounded-lg text-sm font-medium hover:bg-primary-100 transition-colors">
                      查看详情
                    </Link>
                    <button className="p-2 text-neutral-400 hover:text-danger-500 transition-colors" onClick={() => handleDelete(group.group_id)}>
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TutorGroupManagePage;
