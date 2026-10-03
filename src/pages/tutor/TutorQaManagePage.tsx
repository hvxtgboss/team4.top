import { useState, useEffect } from 'react';
import { MessageCircle, Send, CheckCircle, Filter, ChevronDown, Clock } from 'lucide-react';
import { getThreads, getThreadDetail, createReply, markSolved } from '../../api/qa';
import { getMyGroups } from '../../api/groups';
import type { QaThread, QaReply, CourseGroup } from '../../types';

function TutorQaManagePage() {
  const [threads, setThreads] = useState<QaThread[]>([]);
  const [groups, setGroups] = useState<CourseGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showGroupFilter, setShowGroupFilter] = useState(false);
  const [selectedThread, setSelectedThread] = useState<QaThread | null>(null);
  const [replies, setReplies] = useState<QaReply[]>([]);
  const [newReply, setNewReply] = useState('');

  useEffect(() => {
    fetchThreads();
    fetchGroups();
  }, []);

  async function fetchThreads() {
    try {
      const result = await getThreads({
        group_id: selectedGroup || undefined,
        page: 1,
        page_size: 50,
      });
      setThreads(result.list);
    } catch (error) {
      console.error('获取问答失败:', error);
    }
  }

  async function fetchGroups() {
    try {
      const result = await getMyGroups();
      setGroups(result);
    } catch (error) {
      console.error('获取课程群失败:', error);
    }
  }

  async function handleOpenThread(thread: QaThread) {
    setSelectedThread(thread);
    try {
      const result = await getThreadDetail(thread.thread_id);
      setReplies(result.replies);
    } catch (error) {
      console.error('获取回答失败:', error);
    }
  }

  async function handleReply() {
    if (!newReply || !selectedThread) return;
    
    try {
      await createReply(selectedThread.thread_id, newReply);
      setNewReply('');
      handleOpenThread(selectedThread);
    } catch (error) {
      console.error('回复失败:', error);
    }
  }

  async function handleMarkSolved() {
    if (!selectedThread) return;
    
    try {
      await markSolved(selectedThread.thread_id);
      handleOpenThread(selectedThread);
      fetchThreads();
    } catch (error) {
      console.error('标记失败:', error);
    }
  }

  const filteredThreads = threads.filter(t => {
    if (selectedGroup && t.group_id !== selectedGroup) return false;
    if (statusFilter === 'unsolved' && t.is_solved) return false;
    if (statusFilter === 'solved' && !t.is_solved) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">答疑管理</h1>
          <p className="text-sm text-neutral-500 mt-1">管理课程群内的问答</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <button
              onClick={() => setShowGroupFilter(!showGroupFilter)}
              className="flex items-center space-x-2 px-4 py-2 border border-neutral-200 rounded-lg hover:border-primary-500 transition-colors"
            >
              <Filter className="w-4 h-4 text-neutral-500" />
              <span className="text-sm text-neutral-600">
                {selectedGroup ? groups.find(g => g.group_id === selectedGroup)?.name : '全部群'}
              </span>
              <ChevronDown className="w-4 h-4 text-neutral-500" />
            </button>
            
            {showGroupFilter && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-neutral-100 z-10">
                <button
                  onClick={() => { setSelectedGroup(''); fetchThreads(); }}
                  className="w-full px-4 py-2 text-sm hover:bg-primary-50 transition-colors"
                  style={{ color: !selectedGroup ? '#5B8FF9' : '#4b5563' }}
                >
                  全部群
                </button>
                {groups.map((group) => (
                  <button
                    key={group.group_id}
                    onClick={() => { setSelectedGroup(group.group_id); fetchThreads(); }}
                    className="w-full px-4 py-2 text-sm hover:bg-primary-50 transition-colors"
                    style={{ color: selectedGroup === group.group_id ? '#5B8FF9' : '#4b5563' }}
                  >
                    {group.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-1 bg-neutral-100 rounded-lg p-1">
            <button
              onClick={() => { setStatusFilter('all'); fetchThreads(); }}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${statusFilter === 'all' ? 'bg-white text-primary-500 shadow-sm' : 'text-neutral-600 hover:text-neutral-800'}`}
            >
              全部
            </button>
            <button
              onClick={() => { setStatusFilter('unsolved'); fetchThreads(); }}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${statusFilter === 'unsolved' ? 'bg-white text-warning-500 shadow-sm' : 'text-neutral-600 hover:text-neutral-800'}`}
            >
              未解决
            </button>
            <button
              onClick={() => { setStatusFilter('solved'); fetchThreads(); }}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${statusFilter === 'solved' ? 'bg-white text-success-500 shadow-sm' : 'text-neutral-600 hover:text-neutral-800'}`}
            >
              已解决
            </button>
          </div>
        </div>
        
        <div className="text-sm text-neutral-500">
          共 {filteredThreads.length} 条提问
        </div>
      </div>

      {!selectedThread ? (
        <div className="space-y-4">
          {filteredThreads.map((thread) => (
            <div
              key={thread.thread_id}
              onClick={() => handleOpenThread(thread)}
              className="card cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="font-medium text-neutral-800">{thread.title}</h3>
                    {thread.is_solved && (
                      <span className="px-2 py-1 bg-success-50 text-success-500 rounded-full text-xs">已解决</span>
                    )}
                  </div>
                  <p className="text-sm text-neutral-600 line-clamp-2">{thread.content}</p>
                  <div className="flex items-center space-x-4 mt-3">
                    <span className="text-sm text-neutral-500">{thread.author_nickname}</span>
                    <span className="text-sm text-neutral-500">
                      <Clock className="w-4 h-4 inline-block mr-1" />
                      {new Date(thread.created_at).toLocaleDateString()}
                    </span>
                    <span className="text-sm text-neutral-500">
                      <MessageCircle className="w-4 h-4 inline-block mr-1" />
                      {thread.reply_count}回复
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {filteredThreads.length === 0 && (
            <div className="card text-center py-16">
              <MessageCircle className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
              <p className="text-neutral-500">暂无提问</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <button
            onClick={() => { setSelectedThread(null); setReplies([]); }}
            className="text-sm text-primary-500 flex items-center"
          >
            ← 返回问答列表
          </button>
          
          <div className="card">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-5 h-5 text-primary-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="font-semibold text-neutral-800">{selectedThread.title}</h3>
                  {selectedThread.is_solved && (
                    <span className="px-2 py-1 bg-success-50 text-success-500 rounded-full text-xs">已解决</span>
                  )}
                </div>
                <p className="text-neutral-600">{selectedThread.content}</p>
                <div className="flex items-center space-x-4 mt-4">
                  <span className="text-sm text-neutral-500">提问者: {selectedThread.author_nickname}</span>
                  <span className="text-sm text-neutral-500">
                    <Clock className="w-4 h-4 inline-block mr-1" />
                    {new Date(selectedThread.created_at).toLocaleDateString()}
                  </span>
                  {!selectedThread.is_solved && (
                    <button
                      onClick={handleMarkSolved}
                      className="px-4 py-2 bg-success-50 text-success-500 rounded-lg text-sm font-medium hover:bg-success-100 transition-colors flex items-center"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      标记已解决
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {replies.map((reply) => (
            <div key={reply.reply_id} className={`card ${reply.is_accepted ? 'border-success-500 bg-success-50/50' : ''}`}>
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-5 h-5 text-neutral-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-neutral-800">{reply.reply_nickname}</span>
                    {reply.reply_role === 'tutor' && (
                      <span className="px-2 py-1 bg-primary-50 text-primary-500 rounded-full text-xs">导师</span>
                    )}
                    {reply.is_accepted && (
                      <span className="px-2 py-1 bg-success-50 text-success-500 rounded-full text-xs">最佳回答</span>
                    )}
                  </div>
                  <p className="text-neutral-600 mt-2">{reply.content}</p>
                  <div className="flex items-center space-x-4 mt-3">
                    <span className="text-sm text-neutral-500">
                      <Clock className="w-4 h-4 inline-block mr-1" />
                      {new Date(reply.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="card">
            <h3 className="font-medium text-neutral-800 mb-4">发表回答</h3>
            <textarea
              placeholder="输入你的回答..."
              value={newReply}
              onChange={(e) => setNewReply(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-neutral-200 rounded-xl mb-4 focus:outline-none focus:border-primary-500 resize-none"
            />
            <button
              onClick={handleReply}
              disabled={!newReply}
              className="px-6 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <Send className="w-5 h-5 mr-2" />
              提交回答
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default TutorQaManagePage;
