import { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  FileText,
  MessageSquare,
  Wallet,
  BookOpen,
  ChevronRight,
  AlertCircle,
  Upload,
  Search,
  ListOrdered,
  X,
  Check,
  Loader2,
} from 'lucide-react';
import { getMyGroups } from '../../api/groups';
import { getMaterials } from '../../api/materials';
import { getThreads } from '../../api/qa';
import { getMyEarnings } from '../../api/tutor';
import { uploadCourseAudio, generateCourseNotes } from '../../api/pyBackend';
import { saveGroupAiNotesBatch } from '../../api/aiNotes';
import ReviewMindMap from '../../components/ReviewMindMap';
import type { CourseGroup } from '../../types';

interface CourseOption {
  key: string;
  course_id: string;
  course_name: string;
  group_count: number;
  group_ids: string[];
  group_names: string[];
}

interface AiNoteWorkflowState {
  course: CourseOption | null;
  audio_url: string | null;
  audio_key: string | null;
  audio_filename: string | null;
  transcript: string | null;
  review_notes: string | null;
}

const WORKFLOW_STORAGE_KEY = 'xuedao_ai_note_workflow';

const AI_NOTE_STEPS = [
  { step: '01', title: '选择课程', Icon: FileText, action: 'select-course' as const },
  { step: '02', title: '上传课程录音', Icon: Upload, action: 'upload-audio' as const },
  { step: '03', title: '生成复习重点及考点', desc: '识别录音并整理考点', Icon: Search, action: 'generate-notes' as const },
  { step: '04', title: '生成押题试卷', desc: '按照题型生成可答试卷', Icon: ListOrdered },
  { step: '05', title: '点评试卷', desc: '查看讲评结果和薄弱知识点', Icon: MessageSquare },
];

function loadWorkflow(): AiNoteWorkflowState {
  try {
    const raw = sessionStorage.getItem(WORKFLOW_STORAGE_KEY);
    if (!raw) {
      return {
        course: null,
        audio_url: null,
        audio_key: null,
        audio_filename: null,
        transcript: null,
        review_notes: null,
      };
    }
    const parsed = JSON.parse(raw);
    return {
      course: parsed.course || null,
      audio_url: parsed.audio_url || null,
      audio_key: parsed.audio_key || null,
      audio_filename: parsed.audio_filename || null,
      transcript: parsed.transcript || null,
      review_notes: parsed.review_notes || null,
    };
  } catch {
    return {
      course: null,
      audio_url: null,
      audio_key: null,
      audio_filename: null,
      transcript: null,
      review_notes: null,
    };
  }
}

function saveWorkflow(state: AiNoteWorkflowState) {
  sessionStorage.setItem(WORKFLOW_STORAGE_KEY, JSON.stringify(state));
}

function TutorManagePage() {
  const [allGroups, setAllGroups] = useState<CourseGroup[]>([]);
  const [pendingMaterials, setPendingMaterials] = useState(0);
  const [unrepliedQuestions, setUnrepliedQuestions] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [nickname, setNickname] = useState('导师');

  const [showCourseModal, setShowCourseModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CourseOption | null>(null);
  const [draftCourseKey, setDraftCourseKey] = useState<string | null>(null);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioKey, setAudioKey] = useState<string | null>(null);
  const [audioFilename, setAudioFilename] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatePhase, setGeneratePhase] = useState('');
  const [generateError, setGenerateError] = useState('');
  const [transcript, setTranscript] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState<string | null>(null);

  const previewGroups = allGroups.slice(0, 3);

  const courseOptions = useMemo(() => {
    const map = new Map<string, CourseOption>();
    for (const g of allGroups) {
      const name = g.course_name || g.name || '未命名课程';
      const key = g.course_id || name;
      const existing = map.get(key);
      if (existing) {
        existing.group_count += 1;
        existing.group_names.push(g.name);
        if (!existing.group_ids.includes(g.group_id)) existing.group_ids.push(g.group_id);
      } else {
        map.set(key, {
          key,
          course_id: g.course_id,
          course_name: name,
          group_count: 1,
          group_ids: [g.group_id],
          group_names: [g.name],
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.course_name.localeCompare(b.course_name, 'zh'));
  }, [allGroups]);

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.nickname) setNickname(user.nickname);
    } catch {
      /* ignore */
    }
    const saved = loadWorkflow();
    if (saved.course) setSelectedCourse(saved.course);
    if (saved.audio_url) setAudioUrl(saved.audio_url);
    if (saved.audio_key) setAudioKey(saved.audio_key);
    if (saved.audio_filename) setAudioFilename(saved.audio_filename);
    if (saved.transcript) setTranscript(saved.transcript);
    if (saved.review_notes) setReviewNotes(saved.review_notes);

    fetchGroups();
    fetchStats();
  }, []);

  useEffect(() => {
    saveWorkflow({
      course: selectedCourse,
      audio_url: audioUrl,
      audio_key: audioKey,
      audio_filename: audioFilename,
      transcript,
      review_notes: reviewNotes,
    });
  }, [selectedCourse, audioUrl, audioKey, audioFilename, transcript, reviewNotes]);

  useEffect(() => {
    if (!selectedCourse?.key || allGroups.length === 0) return;
    const matched = courseOptions.find((c) => c.key === selectedCourse.key);
    if (!matched?.group_ids?.length) return;
    const prev = selectedCourse.group_ids || [];
    const needSync =
      prev.length !== matched.group_ids.length ||
      matched.group_ids.some((id) => !prev.includes(id));
    if (needSync) setSelectedCourse(matched);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 仅在群列表就绪后补全 group_ids
  }, [allGroups, courseOptions]);

  async function fetchGroups() {
    try {
      const result = await getMyGroups();
      setAllGroups(result || []);
      setTotalStudents(result.reduce((sum, g) => sum + (g.member_count || 0), 0));
    } catch (error) {
      console.error('获取课程群失败:', error);
    }
  }

  async function fetchStats() {
    try {
      const materialsResult = await getMaterials({ mine: '1', status: 'pending', page: 1, page_size: 1 });
      setPendingMaterials(materialsResult.total || 0);

      const threadsResult = await getThreads({ page: 1, page_size: 1 });
      setUnrepliedQuestions(threadsResult.total || 0);

      const earnings: any = await getMyEarnings();
      setTotalEarnings(Number(earnings?.total_amount) || 0);
    } catch (error) {
      console.error('获取统计数据失败:', error);
    }
  }

  function openCourseModal() {
    setDraftCourseKey(selectedCourse?.key ?? null);
    setShowCourseModal(true);
  }

  function confirmCourse() {
    const chosen = courseOptions.find((c) => c.key === draftCourseKey) || null;
    setSelectedCourse(chosen);
    setShowCourseModal(false);
  }

  function openUploadModal() {
    if (!selectedCourse) {
      alert('请先完成第一步：选择课程');
      openCourseModal();
      return;
    }
    setUploadError('');
    setShowUploadModal(true);
  }

  async function handleFileSelected(file: File | null) {
    if (!file || !selectedCourse) return;
    setUploading(true);
    setUploadError('');
    try {
      const result = await uploadCourseAudio({
        file,
        course_id: selectedCourse.course_id,
        course_name: selectedCourse.course_name,
      });
      setAudioUrl(result.url);
      setAudioKey(result.key);
      setAudioFilename(result.original_filename || file.name);
      setTranscript(null);
      setReviewNotes(null);
      setShowUploadModal(false);
    } catch (err: any) {
      setUploadError(err?.message || '上传失败，请确认 py_backend 已启动（:5001）');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function openGenerateModal() {
    if (!selectedCourse) {
      alert('请先完成第一步：选择课程');
      openCourseModal();
      return;
    }
    if (!audioUrl) {
      alert('请先完成第二步：上传课程录音');
      openUploadModal();
      return;
    }
    setGenerateError('');
    setGeneratePhase('');
    setShowGenerateModal(true);
  }

  async function handleGenerateNotes() {
    if (!selectedCourse || !audioUrl) return;
    setGenerating(true);
    setGenerateError('');
    setGeneratePhase('正在识别课堂录音（Paraformer）…');
    try {
      const result = await generateCourseNotes({
        audio_url: audioUrl,
        course_id: selectedCourse.course_id,
        course_name: selectedCourse.course_name,
      });
      setGeneratePhase('正在保存到课程群…');
      setTranscript(result.transcript);
      setReviewNotes(result.review_notes);

      const groupIds =
        selectedCourse.group_ids?.length > 0
          ? selectedCourse.group_ids
          : allGroups
              .filter((g) => (g.course_id || g.course_name) === selectedCourse.key || g.course_id === selectedCourse.course_id)
              .map((g) => g.group_id);

      if (groupIds.length > 0) {
        await saveGroupAiNotesBatch({
          group_ids: groupIds,
          audio_url: audioUrl,
          transcript_text: result.transcript,
          review_notes: result.review_notes,
          course_name: selectedCourse.course_name,
        });
      }

      setGeneratePhase('完成');
      setShowGenerateModal(false);
    } catch (err: any) {
      setGenerateError(err?.message || '生成失败，请确认 py_backend 已启动');
      setGeneratePhase('');
    } finally {
      setGenerating(false);
    }
  }

  function stepDesc(item: (typeof AI_NOTE_STEPS)[number]) {
    if ('action' in item && item.action === 'select-course') {
      return selectedCourse ? `已选：${selectedCourse.course_name}` : '当前步骤';
    }
    if ('action' in item && item.action === 'upload-audio') {
      if (audioUrl) return audioUrl;
      return '上传课程录音';
    }
    if ('action' in item && item.action === 'generate-notes') {
      if (reviewNotes) return '已生成复习重点与考点';
      return item.desc || '识别录音并整理考点';
    }
    return item.desc;
  }

  function isStepClickable(item: (typeof AI_NOTE_STEPS)[number]) {
    return 'action' in item;
  }

  function onStepClick(item: (typeof AI_NOTE_STEPS)[number]) {
    if (!('action' in item)) return;
    if (item.action === 'select-course') openCourseModal();
    if (item.action === 'upload-audio') openUploadModal();
    if (item.action === 'generate-notes') openGenerateModal();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">导师工作台</h1>
          <p className="text-sm text-neutral-500 mt-1">欢迎回来，{nickname}！</p>
        </div>
      </div>

      {pendingMaterials > 0 || unrepliedQuestions > 0 ? (
        <div className="bg-warning-50 border border-warning-200 rounded-xl p-4 flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-warning-500" />
          <div className="flex-1">
            <p className="text-sm text-warning-800">
              {pendingMaterials > 0 && <span>有 {pendingMaterials} 条待审核资料</span>}
              {pendingMaterials > 0 && unrepliedQuestions > 0 && <span>，</span>}
              {unrepliedQuestions > 0 && <span>有 {unrepliedQuestions} 条未回复提问</span>}
            </p>
          </div>
          {pendingMaterials > 0 && (
            <Link to="/tutor/materials" className="px-4 py-2 bg-warning-500 text-white rounded-lg text-sm font-medium hover:bg-warning-600 transition-colors">
              去查看
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-success-50 border border-success-200 rounded-xl p-4 flex items-center space-x-3">
          <div className="w-10 h-10 bg-success-100 rounded-full flex items-center justify-center">
            <span className="text-success-500 text-lg">✓</span>
          </div>
          <div>
            <p className="text-sm text-success-800">今日待办已全部完成！</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500">课程群</p>
              <p className="text-2xl font-bold text-neutral-800">{allGroups.length}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-primary-500" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500">学生数</p>
              <p className="text-2xl font-bold text-neutral-800">{totalStudents}</p>
            </div>
            <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-success-500" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500">总收益</p>
              <p className="text-2xl font-bold text-warning-500">¥{totalEarnings.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-warning-100 rounded-xl flex items-center justify-center">
              <Wallet className="w-6 h-6 text-warning-500" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500">待处理</p>
              <p className="text-2xl font-bold text-danger-500">{pendingMaterials + unrepliedQuestions}</p>
              <p className="text-xs text-neutral-500">{pendingMaterials}资料 + {unrepliedQuestions}提问</p>
            </div>
            <div className="w-12 h-12 bg-danger-100 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-danger-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-neutral-800">快捷操作</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Link to="/tutor/groups/create" className="p-4 bg-primary-50 rounded-xl hover:bg-primary-100 transition-colors flex flex-col items-center justify-center">
              <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center mb-2">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium text-neutral-800">创建课程群</span>
            </Link>
            <Link to="/tutor/materials" className="p-4 bg-neutral-50 rounded-xl hover:bg-neutral-100 transition-colors flex flex-col items-center justify-center">
              <div className="w-10 h-10 bg-neutral-500 rounded-lg flex items-center justify-center mb-2">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium text-neutral-800">上传资料</span>
            </Link>
            <Link to="/tutor/qa" className="p-4 bg-neutral-50 rounded-xl hover:bg-neutral-100 transition-colors flex flex-col items-center justify-center">
              <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center mb-2">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium text-neutral-800">答疑管理</span>
            </Link>
            <Link to="/tutor/earnings" className="p-4 bg-neutral-50 rounded-xl hover:bg-neutral-100 transition-colors flex flex-col items-center justify-center">
              <div className="w-10 h-10 bg-warning-500 rounded-lg flex items-center justify-center mb-2">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium text-neutral-800">查看收益</span>
            </Link>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-neutral-800">我的课程群</h2>
            <Link to="/tutor/groups" className="text-sm text-primary-500 flex items-center">
              查看全部 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {previewGroups.map((group) => (
              <Link to={`/groups/${group.group_id}`} key={group.group_id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl hover:bg-primary-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-primary-500" />
                  </div>
                  <div>
                    <p className="font-medium text-neutral-800 text-sm">{group.name}</p>
                    <p className="text-xs text-neutral-500">{group.course_name}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-xs text-neutral-500">{group.member_count}人</span>
                  <span className={`text-xs font-medium ${group.price > 0 ? 'text-warning-500' : 'text-success-500'}`}>
                    {group.price > 0 ? `¥${group.price}` : '免费'}
                  </span>
                </div>
              </Link>
            ))}

            {previewGroups.length === 0 && (
              <div className="text-center py-8 text-neutral-500">暂无课程群</div>
            )}
          </div>
        </div>
      </div>

      <section className="card">
        <div className="flex items-start gap-3 mb-8">
          <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-neutral-800">AI课堂笔记生成流程</h2>
            <p className="text-sm text-neutral-500 mt-1">
              从上传课程到生成课程考点重点，试卷、点评全流程覆盖
            </p>
            {(selectedCourse || audioUrl || reviewNotes) && (
              <div className="mt-3 text-xs text-neutral-500 space-y-1">
                {selectedCourse && (
                  <p>
                    流程课程：<span className="text-primary-500 font-medium">{selectedCourse.course_name}</span>
                  </p>
                )}
                {audioUrl && (
                  <p className="break-all">
                    录音地址：
                    <a href={audioUrl} target="_blank" rel="noreferrer" className="text-primary-500 hover:underline">
                      {audioUrl}
                    </a>
                  </p>
                )}
                {reviewNotes && <p className="text-primary-500 font-medium">第三步：复习重点与考点已生成并写入课程群</p>}
              </div>
            )}
          </div>
        </div>

        <div className="relative">
          <div className="hidden lg:block absolute top-[52px] left-[10%] right-[10%] h-px border-t border-dashed border-neutral-200" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-4">
            {AI_NOTE_STEPS.map((item) => {
              const { step, title, Icon } = item;
              const clickable = isStepClickable(item);
              const desc = stepDesc(item);
              const isUploadDone = 'action' in item && item.action === 'upload-audio' && !!audioUrl;
              const isNotesDone = 'action' in item && item.action === 'generate-notes' && !!reviewNotes;
              const active =
                ('action' in item && item.action === 'select-course' && !selectedCourse) ||
                ('action' in item && item.action === 'upload-audio' && !!selectedCourse && !audioUrl) ||
                ('action' in item && item.action === 'generate-notes' && !!audioUrl && !reviewNotes) ||
                isUploadDone ||
                isNotesDone;

              return (
                <button
                  key={step}
                  type="button"
                  onClick={() => onStepClick(item)}
                  disabled={!clickable}
                  className={`relative flex flex-col items-center text-center px-2 ${
                    clickable ? 'cursor-pointer group' : 'cursor-default'
                  }`}
                >
                  <div className="relative mb-4">
                    <span className="absolute -top-2 -left-2 z-10 w-7 h-7 rounded-full bg-primary-500 text-white text-xs font-semibold flex items-center justify-center shadow-sm">
                      {step}
                    </span>
                    <div
                      className={`w-[72px] h-[72px] rounded-2xl border flex items-center justify-center transition-colors ${
                        clickable
                          ? 'bg-primary-50 border-primary-200 group-hover:bg-primary-100'
                          : 'bg-neutral-50 border-neutral-100'
                      }`}
                    >
                      <Icon className="w-8 h-8 text-primary-500" strokeWidth={1.5} />
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold text-neutral-800 leading-snug">{title}</h3>
                  <p
                    className={`text-xs mt-2 leading-relaxed max-w-[160px] ${
                      active || isUploadDone || isNotesDone ? 'text-primary-500 font-medium' : 'text-neutral-400'
                    } ${isUploadDone ? 'break-all line-clamp-3' : ''}`}
                    title={typeof desc === 'string' ? desc : undefined}
                  >
                    {isUploadDone ? '已上传（点击可重传）' : isNotesDone ? '已生成（点击可重跑）' : desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {audioUrl && (
          <div className="mt-6 p-4 rounded-xl bg-neutral-50 border border-neutral-100">
            <p className="text-sm font-medium text-neutral-800 mb-1">第二步返回的文件地址</p>
            <a
              href={audioUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-primary-500 break-all hover:underline"
            >
              {audioUrl}
            </a>
            {audioFilename && <p className="text-xs text-neutral-400 mt-2">原始文件：{audioFilename}</p>}
            {audioKey && <p className="text-xs text-neutral-400 mt-1">七牛 key：{audioKey}</p>}
          </div>
        )}

        {(transcript || reviewNotes) && (
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
            {transcript && (
              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-100">
                <p className="text-sm font-medium text-neutral-800 mb-2">语音识别结果</p>
                <pre className="text-xs text-neutral-600 whitespace-pre-wrap max-h-48 overflow-y-auto font-sans">
                  {transcript}
                </pre>
              </div>
            )}
            {reviewNotes && (
              <div className="lg:col-span-2 p-4 rounded-xl bg-primary-50/50 border border-primary-100">
                <p className="text-sm font-medium text-neutral-800 mb-2">复习重点与考点</p>
                <div className="max-h-[420px] overflow-auto">
                  <ReviewMindMap raw={reviewNotes} courseName={selectedCourse?.course_name} />
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {showCourseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-black/40" aria-label="关闭" onClick={() => setShowCourseModal(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-neutral-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
              <div>
                <h3 className="text-lg font-bold text-neutral-800">选择课程</h3>
                <p className="text-sm text-neutral-500 mt-0.5">来自你已开启的课程群</p>
              </div>
              <button type="button" onClick={() => setShowCourseModal(false)} className="p-2 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[50vh] overflow-y-auto px-4 py-3 space-y-2">
              {courseOptions.map((course) => {
                const checked = draftCourseKey === course.key;
                return (
                  <button
                    key={course.key}
                    type="button"
                    onClick={() => setDraftCourseKey(course.key)}
                    className={`w-full text-left p-4 rounded-xl border transition-colors flex items-start gap-3 ${
                      checked ? 'border-primary-500 bg-primary-50' : 'border-neutral-100 hover:border-primary-200 hover:bg-neutral-50'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-white border border-neutral-100 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-5 h-5 text-primary-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-neutral-800">{course.course_name}</p>
                      <p className="text-xs text-neutral-500 mt-1">
                        {course.group_count} 个课程群
                        {course.group_names[0] ? ` · ${course.group_names[0]}` : ''}
                        {course.group_count > 1 ? ' 等' : ''}
                      </p>
                    </div>
                    <span
                      className={`mt-1 w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                        checked ? 'bg-primary-500 border-primary-500 text-white' : 'border-neutral-300'
                      }`}
                    >
                      {checked && <Check className="w-3 h-3" />}
                    </span>
                  </button>
                );
              })}

              {courseOptions.length === 0 && (
                <div className="text-center py-12 text-neutral-500">
                  <BookOpen className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                  <p>你还没有开启课程群</p>
                  <Link to="/tutor/groups/create" className="inline-block mt-3 text-sm text-primary-500 hover:text-primary-600" onClick={() => setShowCourseModal(false)}>
                    去创建课程群
                  </Link>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-100 bg-neutral-50">
              <button type="button" onClick={() => setShowCourseModal(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-neutral-600 hover:bg-white border border-neutral-200">
                取消
              </button>
              <button
                type="button"
                disabled={!draftCourseKey}
                onClick={confirmCourse}
                className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                确认选择
              </button>
            </div>
          </div>
        </div>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-black/40" aria-label="关闭" onClick={() => !uploading && setShowUploadModal(false)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-neutral-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
              <div>
                <h3 className="text-lg font-bold text-neutral-800">上传课程录音</h3>
                <p className="text-sm text-neutral-500 mt-0.5">
                  课程：{selectedCourse?.course_name}
                </p>
              </div>
              <button
                type="button"
                disabled={uploading}
                onClick={() => setShowUploadModal(false)}
                className="p-2 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <label className="flex flex-col items-center justify-center px-6 py-10 border-2 border-dashed border-neutral-200 rounded-xl hover:border-primary-400 hover:bg-primary-50/40 transition-colors cursor-pointer">
                {uploading ? (
                  <>
                    <Loader2 className="w-8 h-8 text-primary-500 animate-spin mb-3" />
                    <span className="text-sm text-neutral-600">正在上传到七牛云…</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-neutral-400 mb-3" />
                    <span className="text-sm text-neutral-700 font-medium">点击选择音频文件</span>
                    <span className="text-xs text-neutral-400 mt-2">支持 mp3 / wav / m4a 等</span>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*,.mp3,.wav,.m4a,.aac,.flac,.ogg,.webm"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => handleFileSelected(e.target.files?.[0] || null)}
                />
              </label>
              {uploadError && <p className="mt-4 text-sm text-danger-500">{uploadError}</p>}
            </div>
          </div>
        </div>
      )}

      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="关闭"
            onClick={() => !generating && setShowGenerateModal(false)}
          />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-neutral-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
              <div>
                <h3 className="text-lg font-bold text-neutral-800">生成复习重点及考点</h3>
                <p className="text-sm text-neutral-500 mt-0.5">
                  课程：{selectedCourse?.course_name}
                </p>
              </div>
              <button
                type="button"
                disabled={generating}
                onClick={() => setShowGenerateModal(false)}
                className="p-2 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-neutral-600 leading-relaxed">
                将先用 Paraformer 识别录音内容，再调用百炼应用整理复习重点与考点，并写入对应课程群。
              </p>
              {generating && (
                <div className="flex items-center gap-3 text-sm text-primary-600">
                  <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" />
                  <span>{generatePhase || '处理中…'}</span>
                </div>
              )}
              {generateError && <p className="text-sm text-danger-500">{generateError}</p>}
              <button
                type="button"
                disabled={generating}
                onClick={handleGenerateNotes}
                className="w-full py-3 rounded-xl text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    生成中…
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    开始生成
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TutorManagePage;
