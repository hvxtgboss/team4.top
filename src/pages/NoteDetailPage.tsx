import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Lightbulb, BookOpen, HelpCircle, Share2, Download, Edit3, Trash2, CheckCircle, Circle, ChevronDown, ChevronUp } from 'lucide-react';
import type { Note, Question } from '@/types';

const mockNote: Note = {
  note_id: '1',
  course_id: '1',
  title: '第一章：国民经济核算',
  full_text: `## 一、国民经济核算的概念

国民经济核算是对整个国民经济活动进行系统的计算、测定和描述的宏观经济管理手段。它以整个国民经济为对象，通过一系列科学的核算原则和方法，把国民经济各个部门、各个环节的经济活动进行系统的记录、整理和分析。

## 二、GDP的三种核算方法

### 1. 生产法

生产法是从生产的角度衡量常住单位在核算期内新创造价值的一种方法，即从国民经济各个部门在核算期内生产的总产品价值中，扣除生产过程中投入的中间产品价值，得到增加值。

公式：增加值 = 总产出 - 中间投入

### 2. 支出法

支出法是从最终使用的角度衡量核算期内生产的所有货物和服务的去向。

公式：GDP = 消费 + 投资 + 政府购买 + 净出口

### 3. 收入法

收入法是从生产过程创造收入的角度，根据生产要素在生产过程中应得的收入份额反映最终成果的一种核算方法。

公式：GDP = 工资 + 利息 + 租金 + 利润 + 间接税 + 折旧

## 三、名义GDP与实际GDP

名义GDP是用生产物品和劳务的当年价格计算的全部最终产品的市场价值。

实际GDP是用从前某一年作为基期的价格计算出来的全部最终产品的市场价值。

## 四、GDP平减指数

GDP平减指数是名义GDP与实际GDP的比率，用于衡量通货膨胀水平。

公式：GDP平减指数 = (名义GDP / 实际GDP) × 100`,
  key_points: [
    'GDP的三种核算方法：生产法、支出法、收入法',
    '名义GDP与实际GDP的区别',
    'GDP平减指数的计算方法',
    '国民经济核算的重要性',
    '中间产品与最终产品的区分',
  ],
  summary: '本章主要介绍了国民经济核算的基本概念和方法。重点讲解了GDP的三种核算方法：生产法（总产出-中间投入）、支出法（消费+投资+政府购买+净出口）和收入法（工资+利息+租金+利润+间接税+折旧）。同时分析了名义GDP与实际GDP的区别，以及GDP平减指数在衡量通货膨胀中的作用。掌握这些概念对于理解宏观经济运行至关重要。',
  status: 'generated',
  created_at: '2024-01-15',
  updated_at: '2024-01-15',
};

const mockQuestions: Question[] = [
  {
    question_id: '1',
    note_id: '1',
    type: 'single',
    content: 'GDP的三种核算方法不包括以下哪一项？',
    options: ['生产法', '支出法', '收入法', '统计法'],
    answer: '统计法',
    analysis: 'GDP的三种核算方法分别是生产法、支出法和收入法。统计法不是GDP核算的方法。',
    related_knowledge: 'GDP的三种核算方法',
  },
  {
    question_id: '2',
    note_id: '1',
    type: 'single',
    content: '支出法计算GDP的公式是？',
    options: [
      'GDP = 总产出 - 中间投入',
      'GDP = 消费 + 投资 + 政府购买 + 净出口',
      'GDP = 工资 + 利息 + 租金 + 利润',
      'GDP = 名义GDP / 实际GDP',
    ],
    answer: 'GDP = 消费 + 投资 + 政府购买 + 净出口',
    analysis: '支出法从最终使用角度衡量GDP，包括消费、投资、政府购买和净出口四个部分。',
    related_knowledge: '支出法计算GDP',
  },
  {
    question_id: '3',
    note_id: '1',
    type: 'fill',
    content: '名义GDP与实际GDP的比率称为______。',
    options: [],
    answer: 'GDP平减指数',
    analysis: 'GDP平减指数是衡量通货膨胀水平的重要指标，等于名义GDP除以实际GDP再乘以100。',
    related_knowledge: 'GDP平减指数',
  },
];

type TabType = 'notes' | 'keyPoints' | 'summary' | 'questions';

function NoteDetailPage() {
  useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('notes');
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});

  const note = mockNote;
  const questions = mockQuestions;

  const toggleQuestion = (questionId: string) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
    }
    setExpandedQuestions(newExpanded);
  };

  const handleAnswerSelect = (questionId: string, answer: string) => {
    setSelectedAnswers({ ...selectedAnswers, [questionId]: answer });
  };

  const tabs: { id: TabType; icon: typeof FileText; label: string }[] = [
    { id: 'notes', icon: FileText, label: '课堂笔记' },
    { id: 'keyPoints', icon: Lightbulb, label: '重点提取' },
    { id: 'summary', icon: BookOpen, label: '知识点总结' },
    { id: 'questions', icon: HelpCircle, label: '测试题' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/courses/1')}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-neutral-800">{note.title}</h1>
            <p className="text-sm text-neutral-500">生成于 {note.created_at}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-outline flex items-center gap-2">
            <Share2 className="w-4 h-4" />
            分享
          </button>
          <button className="btn-outline flex items-center gap-2">
            <Download className="w-4 h-4" />
            导出
          </button>
          <button className="btn-outline flex items-center gap-2">
            <Edit3 className="w-4 h-4" />
            编辑
          </button>
          <button className="p-2 hover:bg-danger-50 rounded-lg transition-colors">
            <Trash2 className="w-4 h-4 text-danger-500" />
          </button>
        </div>
      </div>

      <div className="card">
        <div className="flex border-b border-neutral-100 mb-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-all ${
                activeTab === tab.id
                  ? 'text-primary-500 border-b-2 border-primary-500'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-4">
          {activeTab === 'notes' && (
            <div className="prose prose-sm max-w-none">
              <div
                dangerouslySetInnerHTML={{
                  __html: note.full_text
                    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
                    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\n/g, '<br />'),
                }}
              />
            </div>
          )}

          {activeTab === 'keyPoints' && (
            <div className="space-y-3">
              {note.key_points.map((point, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-primary-50 rounded-lg">
                  <Lightbulb className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                  <span className="text-neutral-700">{point}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'summary' && (
            <div className="p-4 bg-neutral-50 rounded-lg">
              <BookOpen className="w-6 h-6 text-primary-500 mb-3" />
              <p className="text-neutral-700 leading-relaxed">{note.summary}</p>
            </div>
          )}

          {activeTab === 'questions' && (
            <div className="space-y-4">
              {questions.map((question) => (
                <div key={question.question_id} className="border border-neutral-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleQuestion(question.question_id)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-neutral-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                        selectedAnswers[question.question_id] === question.answer
                          ? 'bg-success-500 text-white'
                          : selectedAnswers[question.question_id]
                          ? 'bg-danger-500 text-white'
                          : 'bg-neutral-100 text-neutral-600'
                      }`}>
                        {selectedAnswers[question.question_id] === question.answer ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <Circle className="w-4 h-4" />
                        )}
                      </span>
                      <span className="font-medium text-neutral-700">{question.content}</span>
                    </div>
                    {expandedQuestions.has(question.question_id) ? (
                      <ChevronUp className="w-5 h-5 text-neutral-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-neutral-400" />
                    )}
                  </button>
                  {expandedQuestions.has(question.question_id) && (
                    <div className="px-4 pb-4">
                      {question.type !== 'fill' && (
                        <div className="space-y-2 mt-2">
                          {question.options.map((option, index) => (
                            <button
                              key={index}
                              onClick={() => handleAnswerSelect(question.question_id, option)}
                              className={`w-full text-left px-4 py-2 rounded-lg transition-all ${
                                selectedAnswers[question.question_id] === option
                                  ? option === question.answer
                                    ? 'bg-success-50 border border-success-200 text-success-700'
                                    : 'bg-danger-50 border border-danger-200 text-danger-700'
                                  : 'bg-neutral-50 border border-neutral-100 hover:border-primary-200'
                              }`}
                            >
                              <span className="font-medium mr-2">{String.fromCharCode(65 + index)}.</span>
                              {option}
                            </button>
                          ))}
                        </div>
                      )}
                      {question.type === 'fill' && (
                        <div className="mt-2">
                          <input
                            type="text"
                            placeholder="输入答案"
                            value={selectedAnswers[question.question_id] || ''}
                            onChange={(e) => handleAnswerSelect(question.question_id, e.target.value)}
                            className="input-field w-full mb-2"
                          />
                        </div>
                      )}
                      <div className="mt-3 p-3 bg-neutral-50 rounded-lg">
                        <p className="text-sm font-medium text-neutral-700 mb-1">正确答案：{question.answer}</p>
                        <p className="text-sm text-neutral-500">{question.analysis}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default NoteDetailPage;
