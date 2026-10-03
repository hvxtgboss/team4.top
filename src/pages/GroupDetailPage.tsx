import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Users, BookOpen, MessageCircle, Download, Send, ChevronRight, GraduationCap, Clock, CreditCard, X, Check, Sparkles } from 'lucide-react';
import { getGroupDetail, joinGroup } from '../api/groups';
import { getGroupMaterials } from '../api/materials';
import { getThreads, createThread, getThreadDetail, createReply } from '../api/qa';
import { createOrder, simulatePayment } from '../api/orders';
import { getGroupAiNotes } from '../api/aiNotes';
import ReviewMindMap from '../components/ReviewMindMap';
import type { CourseGroup, Material, QaThread, QaReply, GroupAiNotes } from '../types';

function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [group, setGroup] = useState<CourseGroup | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [threads, setThreads] = useState<QaThread[]>([]);
  const [aiNotes, setAiNotes] = useState<GroupAiNotes | null>(null);
  const [activeTab, setActiveTab] = useState<'materials' | 'qa'>('materials');
  const [newQuestion, setNewQuestion] = useState({ title: '', content: '' });
  const [newReply, setNewReply] = useState('');
  const [selectedThread, setSelectedThread] = useState<QaThread | null>(null);
  const [replies, setReplies] = useState<QaReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    if (id) {
      fetchGroupDetail();
      fetchMaterials();
      fetchThreads();
      fetchAiNotes();
    }
  }, [id]);

  async function fetchGroupDetail() {
    try {
      const result = await getGroupDetail(id!);
      setGroup(result);
      setLoading(false);
    } catch (error) {
      console.error('获取群详情失败:', error);
      setLoading(false);
    }
  }

  async function fetchMaterials() {
    try {
      const result = await getGroupMaterials(id!);
      setMaterials(result.list);
    } catch (error) {
      console.error('获取资料失败:', error);
    }
  }

  async function fetchThreads() {
    try {
      const result = await getThreads({ group_id: id, page: 1, page_size: 20 });
      setThreads(result.list);
    } catch (error) {
      console.error('获取问答失败:', error);
    }
  }

  async function fetchAiNotes() {
    try {
      const result = await getGroupAiNotes(id!);
      setAiNotes(result);
    } catch (error) {
      console.error('获取 AI 笔记失败:', error);
      setAiNotes(null);
    }
  }

  async function handleJoinGroup() {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    
    if (!group || group.price === 0) {
      try {
        await joinGroup(id!);
        fetchGroupDetail();
      } catch (error) {
        console.error('加入群失败:', error);
      }
      return;
    }
    
    setShowPaymentModal(true);
  }

  async function handlePayment() {
    if (!group) return;
    
    setPaymentLoading(true);
    
    try {
      const orderResult = await createOrder({ group_id: id! });
      await simulatePayment(orderResult.order_id);
      setPaymentSuccess(true);
      setTimeout(() => {
        setShowPaymentModal(false);
        setPaymentSuccess(false);
        fetchGroupDetail();
        fetchMaterials();
        fetchThreads();
      }, 2000);
    } catch (error: any) {
      console.error('支付失败:', error);
      alert(error.message || '支付失败');
    } finally {
      setPaymentLoading(false);
    }
  }

  async function handleCreateQuestion() {
    if (!newQuestion.title || !newQuestion.content) return;
    
    try {
      await createThread({
        group_id: id!,
        title: newQuestion.title,
        content: newQuestion.content,
      });
      setNewQuestion({ title: '', content: '' });
      fetchThreads();
    } catch (error) {
      console.error('提问失败:', error);
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

  async function handleCreateReply() {
    if (!newReply || !selectedThread) return;
    
    try {
      await createReply(selectedThread.thread_id, newReply);
      setNewReply('');
      handleOpenThread(selectedThread);
    } catch (error) {
      console.error('回答失败:', error);
    }
  }

  if (loading) {
    return <div className="text-center py-16">加载中...</div>;
  }

  if (!group) {
    return <div className="text-center py-16">课程群不存在</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
        <div className="bg-gradient-to-br from-primary-500 to-primary-600 p-8 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm">{group.school_name}</span>
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm">{group.course_name}</span>
              </div>
              <h1 className="text-2xl font-bold mb-2">{group.name}</h1>
              <p className="text-primary-100">{group.description}</p>
            </div>
            <div className="flex flex-col items-end space-y-4">
              <div className="flex items-center space-x-4">
                <span className="flex items-center text-primary-100">
                  <Users className="w-5 h-5 mr-2" />
                  {group.member_count}/{group.max_members}成员
                </span>
                <span className="flex items-center text-primary-100">
                  <BookOpen className="w-5 h-5 mr-2" />
                  {materials.length}资料
                </span>
                <span className="flex items-center text-primary-100">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  {threads.length}问答
                </span>
              </div>
              {group.is_member || group.has_purchased ? (
                <span className="px-6 py-3 bg-success-500 text-white rounded-xl font-medium">
                  {group.has_purchased || group.price > 0 ? '已购买' : '已加入'}
                </span>
              ) : (
                <button
                  onClick={handleJoinGroup}
                  className="px-6 py-3 bg-white text-primary-500 rounded-xl font-medium hover:bg-primary-50 transition-colors"
                >
                  {group.price > 0 ? `¥${group.price} 付款加入` : '免费加入'}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-primary-500" />
            </div>
            <div>
              <p className="font-medium text-neutral-800">{group.tutor_nickname}</p>
              <p className="text-sm text-neutral-500">课程导师</p>
            </div>
            <Link to={`/tutors/${group.tutor_id}`} className="ml-auto text-sm text-primary-500 flex items-center">
              查看导师主页 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="border-t border-neutral-100 pt-6">
            <h3 className="font-medium text-neutral-800 mb-3">企业微信答疑群</h3>
            {group.wecom_qr_url && !group.wecom_qr_locked ? (
              <div className="flex flex-col sm:flex-row items-center gap-4 bg-neutral-50 rounded-xl p-4">
                <img
                  src={group.wecom_qr_url}
                  alt="企业微信群二维码"
                  className="w-40 h-40 rounded-lg bg-white border border-neutral-200 object-contain"
                />
                <div className="text-center sm:text-left">
                  <p className="text-sm text-neutral-700 font-medium">已解锁 · 扫码加入企微答疑群</p>
                  <p className="text-xs text-neutral-500 mt-2">
                    {group.has_purchased || group.price > 0
                      ? '支付成功后可查看，请使用企业微信扫码'
                      : '入群后可查看，请使用企业微信扫码'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-neutral-50 rounded-xl p-6 text-center border border-dashed border-neutral-200">
                <p className="text-sm text-neutral-600 font-medium">企微二维码已锁定</p>
                <p className="text-xs text-neutral-500 mt-2">
                  {group.price > 0 ? '付款加入后即可查看企业微信答疑群二维码' : '免费加入后即可查看企业微信答疑群二维码'}
                </p>
                {!group.is_member && (
                  <button
                    onClick={handleJoinGroup}
                    className="mt-4 px-5 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600"
                  >
                    {group.price > 0 ? `¥${group.price} 付款解锁` : '免费加入解锁'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex space-x-2 bg-white rounded-xl shadow-sm border border-neutral-100 p-2">
        <button
          onClick={() => setActiveTab('materials')}
          className={`flex-1 py-3 rounded-lg font-medium transition-colors ${activeTab === 'materials' ? 'bg-primary-500 text-white' : 'text-neutral-600 hover:bg-neutral-50'}`}
        >
          <BookOpen className="w-5 h-5 inline-block mr-2" />
          学习资料 ({materials.length})
        </button>
        <button
          onClick={() => setActiveTab('qa')}
          className={`flex-1 py-3 rounded-lg font-medium transition-colors ${activeTab === 'qa' ? 'bg-primary-500 text-white' : 'text-neutral-600 hover:bg-neutral-50'}`}
        >
          <MessageCircle className="w-5 h-5 inline-block mr-2" />
          在线答疑 ({threads.length})
        </button>
      </div>

      {activeTab === 'materials' && (
        <div className="space-y-4">
          {materials.map((material) => (
            <div key={material.material_id} className="card">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-primary-500" />
                  </div>
                  <div>
                    <h3 className="font-medium text-neutral-800">{material.title}</h3>
                    <p className="text-sm text-neutral-500">
                      {material.uploader_nickname} · {new Date(material.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-neutral-500">
                    <Download className="w-4 h-4 inline-block mr-1" />
                    {material.download_count}次下载
                  </span>
                  <button className="px-4 py-2 bg-primary-50 text-primary-500 rounded-lg text-sm font-medium hover:bg-primary-100 transition-colors">
                    下载
                  </button>
                </div>
              </div>
              {material.description && (
                <p className="text-sm text-neutral-600 mt-4 pl-14">{material.description}</p>
              )}
            </div>
          ))}
          
          {materials.length === 0 && (
            <div className="card text-center py-16">
              <BookOpen className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
              <p className="text-neutral-500">暂无学习资料</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'qa' && (
        <div className="space-y-4">
          {group.is_member && (
            <div className="card">
              <h3 className="font-medium text-neutral-800 mb-4">发起提问</h3>
              <input
                type="text"
                placeholder="问题标题"
                value={newQuestion.title}
                onChange={(e) => setNewQuestion({ ...newQuestion, title: e.target.value })}
                className="w-full px-4 py-3 border border-neutral-200 rounded-xl mb-4 focus:outline-none focus:border-primary-500"
              />
              <textarea
                placeholder="详细描述你的问题..."
                value={newQuestion.content}
                onChange={(e) => setNewQuestion({ ...newQuestion, content: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border border-neutral-200 rounded-xl mb-4 focus:outline-none focus:border-primary-500 resize-none"
              />
              <button
                onClick={handleCreateQuestion}
                className="px-6 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors flex items-center"
              >
                <Send className="w-5 h-5 mr-2" />
                提交问题
              </button>
            </div>
          )}

          {!selectedThread ? (
            <div className="space-y-4">
              {threads.map((thread) => (
                <div key={thread.thread_id} className="card cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleOpenThread(thread)}>
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
                    <ChevronRight className="w-5 h-5 text-neutral-400" />
                  </div>
                </div>
              ))}
              
              {threads.length === 0 && (
                <div className="card text-center py-16">
                  <MessageCircle className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                  <p className="text-neutral-500">暂无问答</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={() => setSelectedThread(null)}
                className="text-sm text-primary-500 flex items-center"
              >
                <ChevronRight className="w-4 h-4 rotate-180 mr-1" />
                返回问答列表
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
                    </div>
                  </div>
                </div>
              </div>

              {replies.map((reply) => (
                <div key={reply.reply_id} className={`card ${reply.is_accepted ? 'border-success-500 bg-success-50/50' : ''}`}>
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <GraduationCap className="w-5 h-5 text-neutral-500" />
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
                        <span className="text-sm text-neutral-500">
                          <MessageCircle className="w-4 h-4 inline-block mr-1" />
                          {reply.like_count}点赞
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {group.is_member && (
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
                    onClick={handleCreateReply}
                    className="px-6 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors flex items-center"
                  >
                    <Send className="w-5 h-5 mr-2" />
                    提交回答
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {(() => {
        const hasReview = !!(aiNotes?.review_notes || '').trim();
        const hasTranscript = !!(aiNotes?.transcript_text || '').trim();
        if (!hasReview && !hasTranscript) return null;
        return (
          <section className="card space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-500" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-800">AI 课堂笔记</h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {aiNotes?.course_name ? `${aiNotes.course_name} · ` : ''}
                  复习重点、考点与课堂转写
                </p>
              </div>
            </div>

            {hasReview && (
              <div>
                <p className="text-sm font-medium text-neutral-700 mb-2">复习重点与考点</p>
                <ReviewMindMap
                  raw={aiNotes!.review_notes || ''}
                  courseName={aiNotes?.course_name || group?.course_name}
                />
              </div>
            )}

            {hasTranscript && (
              <div>
                <p className="text-sm font-medium text-neutral-700 mb-2">课堂录音识别</p>
                <div className="rounded-xl bg-neutral-50 border border-neutral-100 p-4">
                  <pre className="text-sm text-neutral-600 whitespace-pre-wrap font-sans leading-relaxed max-h-72 overflow-y-auto">
                    {aiNotes!.transcript_text}
                  </pre>
                </div>
              </div>
            )}

            {aiNotes?.audio_url && (
              <p className="text-xs text-neutral-400 break-all">
                录音：
                <a href={aiNotes.audio_url} target="_blank" rel="noreferrer" className="text-primary-500 hover:underline">
                  {aiNotes.audio_url}
                </a>
              </p>
            )}
          </section>
        );
      })()}

      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-neutral-800">确认支付</h3>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-neutral-500" />
                </button>
              </div>

              {paymentSuccess ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-success-500" />
                  </div>
                  <h4 className="text-lg font-semibold text-neutral-800 mb-2">支付成功</h4>
                  <p className="text-neutral-500">已成功加入课程群</p>
                </div>
              ) : (
                <>
                  <div className="bg-neutral-50 rounded-xl p-4 mb-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                        <GraduationCap className="w-6 h-6 text-primary-500" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-neutral-800">{group?.name}</h4>
                        <p className="text-sm text-neutral-500">{group?.school_name} · {group?.course_name}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-600">课程群费用</span>
                      <span className="text-xl font-bold text-primary-500">¥{group?.price}</span>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
                      <span className="font-medium text-neutral-800">应付金额</span>
                      <span className="text-2xl font-bold text-primary-500">¥{group?.price}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 mb-6 p-4 bg-primary-50 rounded-xl">
                    <CreditCard className="w-5 h-5 text-primary-500" />
                    <span className="text-sm text-primary-700">使用模拟支付完成交易</span>
                  </div>

                  <button
                    onClick={handlePayment}
                    disabled={paymentLoading}
                    className="w-full py-4 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {paymentLoading ? (
                      <>
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
                        支付中...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5 mr-2" />
                        确认支付 ¥{group?.price}
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GroupDetailPage;
