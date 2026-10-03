import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Upload, BookOpen } from 'lucide-react';

const categories = [
  '经济学',
  '历史学',
  '数学',
  '物理学',
  '化学',
  '生物学',
  '计算机科学',
  '文学',
  '外语',
  '艺术',
  '其他',
];

function CreateCoursePage() {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const handleNext = () => {
    if (!name || !category) {
      alert('请填写课程名称和分类');
      return;
    }
    setStep(2);
  };

  const handleSubmit = () => {
    alert('课程创建成功！');
    navigate('/courses');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/courses')}
          className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-neutral-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">新建课程</h1>
          <p className="text-sm text-neutral-500">创建一个新的AI课堂笔记课程</p>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
            step >= 1 ? 'bg-primary-500 text-white' : 'bg-neutral-200 text-neutral-500'
          }`}>
            1
          </div>
          <div className={`flex-1 h-1 rounded-full ${step >= 2 ? 'bg-primary-500' : 'bg-neutral-200'}`}></div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
            step >= 2 ? 'bg-primary-500 text-white' : 'bg-neutral-200 text-neutral-500'
          }`}>
            2
          </div>
        </div>

        {step === 1 && (
          <form onSubmit={(e) => { e.preventDefault(); handleNext(); }}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-700 mb-2">课程名称 <span className="text-danger-500">*</span></label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="请输入课程名称"
                className="input-field"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-700 mb-2">课程分类 <span className="text-danger-500">*</span></label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input-field"
              >
                <option value="">请选择分类</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-700 mb-2">课程描述</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="请输入课程描述（选填）"
                rows={3}
                className="input-field resize-none"
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-neutral-700 mb-2">课程封面</label>
              <div
                onClick={() => document.getElementById('cover-upload')?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  coverImage ? 'border-primary-400 bg-primary-50' : 'border-neutral-200 hover:border-primary-400 hover:bg-primary-50'
                }`}
              >
                {coverImage ? (
                  <div className="flex flex-col items-center gap-2">
                    <img src={coverImage} alt="封面" className="w-20 h-20 object-cover rounded-lg" />
                    <span className="text-sm text-primary-600">点击更换封面</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-10 h-10 text-neutral-400" />
                    <span className="text-sm text-neutral-600">点击上传封面</span>
                    <span className="text-xs text-neutral-400">支持 JPG、PNG 格式，建议尺寸 600x400</span>
                  </div>
                )}
              </div>
              <input
                id="cover-upload"
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setCoverImage(URL.createObjectURL(file));
                  }
                }}
              />
            </div>
            <button type="submit" className="btn-primary w-full py-3">
              下一步：上传课程内容
            </button>
          </form>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-lg font-semibold text-neutral-800 mb-4">上传课程内容</h2>
            <p className="text-sm text-neutral-500 mb-4">上传课程录音或视频，AI将自动生成笔记和测试题</p>
            <div className="border-2 border-dashed border-neutral-200 rounded-xl p-12 text-center hover:border-primary-400 hover:bg-primary-50 transition-all cursor-pointer mb-4">
              <Upload className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-neutral-700 mb-2">点击或拖拽文件到此处上传</p>
              <p className="text-sm text-neutral-500">支持 MP3、WAV、M4A、MP4、AVI、MOV 格式</p>
              <p className="text-xs text-neutral-400 mt-2">单文件最大 500MB</p>
            </div>
            <div className="flex items-center justify-center gap-4 mb-6">
              <button className="btn-primary flex items-center gap-2">
                <Plus className="w-4 h-4" />
                选择文件上传
              </button>
              <button className="btn-outline flex items-center gap-2">
                输入课程链接
              </button>
            </div>
            <div className="flex items-center justify-between">
              <button
                onClick={() => setStep(1)}
                className="btn-outline"
              >
                上一步
              </button>
              <button
                onClick={handleSubmit}
                className="btn-primary flex items-center gap-2"
              >
                <BookOpen className="w-4 h-4" />
                开始生成笔记
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CreateCoursePage;
