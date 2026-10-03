import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Plus, FileText, Clock, CheckCircle, Loader2, Play, MoreHorizontal, Trash2, Edit3 } from 'lucide-react';
import type { Course, Note } from '@/types';

const mockCourse: Course = {
  course_id: '1',
  user_id: '1',
  name: '宏观经济学',
  category: '经济学',
  description: '宏观经济学基础课程，涵盖GDP、通货膨胀、货币政策等核心内容。本课程将帮助学生理解宏观经济运行机制，掌握经济分析方法。',
  cover_image: '',
  status: 'completed',
  created_at: '2024-01-15',
  updated_at: '2024-01-15',
};

const mockNotes: Note[] = [
  {
    note_id: '1',
    course_id: '1',
    title: '第一章：国民经济核算',
    full_text: '国民经济核算是对整个国民经济活动进行系统的计算、测定和描述的宏观经济管理手段。主要指标包括GDP、GNP等...',
    key_points: ['GDP的三种核算方法', '名义GDP与实际GDP', 'GDP平减指数'],
    summary: '本章主要介绍了国民经济核算的基本概念和方法，重点讲解了GDP的三种核算方法：生产法、支出法和收入法。',
    status: 'generated',
    created_at: '2024-01-15',
    updated_at: '2024-01-15',
  },
  {
    note_id: '2',
    course_id: '1',
    title: '第二章：通货膨胀与通货紧缩',
    full_text: '通货膨胀是指货币供应量超过经济实际需要，导致货币贬值、物价持续上涨的现象...',
    key_points: ['通货膨胀的类型', '通货膨胀的成因', '通货膨胀的影响'],
    summary: '本章分析了通货膨胀的类型、成因和影响，介绍了衡量通货膨胀的主要指标CPI和PPI。',
    status: 'generated',
    created_at: '2024-01-16',
    updated_at: '2024-01-16',
  },
];

function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'notes' | 'upload'>('notes');

  const course = mockCourse;
  const notes = mockNotes;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/courses')}
          className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-neutral-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">{course.name}</h1>
          <p className="text-sm text-neutral-500">{course.category}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card mb-6">
            <h2 className="text-lg font-semibold text-neutral-800 mb-4">课程简介</h2>
            <p className="text-neutral-600 leading-relaxed">{course.description}</p>
            <div className="flex items-center gap-6 mt-4 pt-4 border-t border-neutral-100">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-neutral-400" />
                <span className="text-sm text-neutral-500">创建于 {course.created_at}</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-neutral-400" />
                <span className="text-sm text-neutral-500">{notes.length} 个笔记</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab('notes')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'notes'
                  ? 'bg-primary-500 text-white'
                  : 'bg-white text-neutral-600 border border-neutral-200 hover:border-primary-300'
              }`}
            >
              笔记列表
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'upload'
                  ? 'bg-primary-500 text-white'
                  : 'bg-white text-neutral-600 border border-neutral-200 hover:border-primary-300'
              }`}
            >
              上传内容
            </button>
          </div>

          {activeTab === 'notes' && (
            <div className="space-y-4">
              {notes.map((note) => (
                <div
                  key={note.note_id}
                  onClick={() => navigate(`/notes/${note.note_id}`)}
                  className="card cursor-pointer hover:border-primary-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Play className="w-4 h-4 text-primary-500" />
                        <h3 className="text-lg font-semibold text-neutral-800">{note.title}</h3>
                      </div>
                      <p className="text-sm text-neutral-500 line-clamp-2">{note.summary}</p>
                      <div className="flex items-center gap-2 mt-3">
                        {note.key_points.slice(0, 3).map((point, index) => (
                          <span key={index} className="px-2 py-1 bg-primary-50 text-primary-600 text-xs rounded">
                            {point}
                          </span>
                        ))}
                        {note.key_points.length > 3 && (
                          <span className="text-xs text-neutral-400">+{note.key_points.length - 3} 更多</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
                        <Edit3 className="w-4 h-4 text-neutral-400" />
                      </button>
                      <button className="p-2 hover:bg-danger-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4 text-neutral-400 hover:text-danger-500" />
                      </button>
                      <button className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
                        <MoreHorizontal className="w-4 h-4 text-neutral-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="card">
              <div className="border-2 border-dashed border-neutral-200 rounded-xl p-12 text-center hover:border-primary-400 hover:bg-primary-50 transition-all cursor-pointer">
                <Upload className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-neutral-700 mb-2">点击或拖拽文件到此处上传</p>
                <p className="text-sm text-neutral-500">支持 MP3、WAV、M4A、MP4、AVI、MOV 格式</p>
                <p className="text-xs text-neutral-400 mt-2">单文件最大 500MB</p>
              </div>
              <div className="mt-4 flex items-center justify-center gap-4">
                <button className="btn-primary flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  选择文件上传
                </button>
                <button className="btn-outline flex items-center gap-2">
                  输入课程链接
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="card">
            <h3 className="text-sm font-semibold text-neutral-700 mb-3">课程统计</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-500">笔记数量</span>
                <span className="text-lg font-bold text-primary-500">{notes.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-500">学习进度</span>
                <span className="text-lg font-bold text-success-500">100%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: '100%' }}></div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-sm font-semibold text-neutral-700 mb-3">最近学习</h3>
            <div className="space-y-2">
              {notes.slice(0, 2).map((note) => (
                <div
                  key={note.note_id}
                  onClick={() => navigate(`/notes/${note.note_id}`)}
                  className="flex items-center gap-3 p-2 hover:bg-neutral-50 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-700 truncate">{note.title}</p>
                    <p className="text-xs text-neutral-400">{note.created_at}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="text-sm font-semibold text-neutral-700 mb-3">课程操作</h3>
            <div className="space-y-2">
              <button className="w-full btn-primary flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" />
                上传新内容
              </button>
              <button className="w-full btn-outline">编辑课程信息</button>
              <button className="w-full text-danger-500 hover:bg-danger-50 py-2 rounded-lg transition-colors">
                删除课程
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CourseDetailPage;
