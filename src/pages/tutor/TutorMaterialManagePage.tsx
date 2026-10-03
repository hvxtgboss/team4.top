import { useState, useEffect } from 'react';
import { Upload, FileText, Download, Eye, Trash2, Filter, ChevronDown, Plus } from 'lucide-react';
import { getMaterials, uploadMaterial, deleteMaterial } from '../../api/materials';
import { getMyGroups } from '../../api/groups';
import type { Material, CourseGroup } from '../../types';

function TutorMaterialManagePage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [groups, setGroups] = useState<CourseGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [showGroupFilter, setShowGroupFilter] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newMaterial, setNewMaterial] = useState({ 
    group_id: '', 
    title: '', 
    file: null as File | null, 
    description: '' 
  });

  useEffect(() => {
    fetchMaterials();
    fetchGroups();
  }, []);

  async function fetchMaterials() {
    try {
      const result = await getMaterials({
        page: 1,
        page_size: 50,
        mine: '1',
      });
      setMaterials(result?.list || []);
    } catch (error) {
      console.error('获取资料失败:', error);
    }
  }

  async function fetchGroups() {
    try {
      const result = await getMyGroups();
      setGroups(result || []);
    } catch (error) {
      console.error('获取课程群失败:', error);
    }
  }

  async function handleUpload() {
    if (!newMaterial.group_id || !newMaterial.title || !newMaterial.file) return;
    
    setUploading(true);
    try {
      await uploadMaterial({
        group_id: newMaterial.group_id,
        title: newMaterial.title,
        description: newMaterial.description,
        file: newMaterial.file,
      });
      setNewMaterial({ group_id: '', title: '', file: null, description: '' });
      fetchMaterials();
    } catch (error: any) {
      console.error('上传失败:', error);
      alert(error.message || '上传失败');
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(material_id: string) {
    if (!confirm('确定要删除这个资料吗？')) return;
    
    try {
      await deleteMaterial(material_id);
      fetchMaterials();
    } catch (error) {
      console.error('删除失败:', error);
    }
  }

  const filteredMaterials = selectedGroup 
    ? materials.filter(m => m.group_id === selectedGroup)
    : materials;

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return 'PDF';
    if (fileType.includes('word') || fileType.includes('document')) return 'DOC';
    if (fileType.includes('image')) return 'IMG';
    return 'FILE';
  };

  const getFileColor = (fileType: string) => {
    if (fileType.includes('pdf')) return 'bg-red-100 text-red-500';
    if (fileType.includes('word') || fileType.includes('document')) return 'bg-blue-100 text-blue-500';
    if (fileType.includes('image')) return 'bg-green-100 text-green-500';
    return 'bg-neutral-100 text-neutral-500';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">资料管理</h1>
          <p className="text-sm text-neutral-500 mt-1">管理课程群内的学习资料</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6">
        <h2 className="font-semibold text-neutral-800 mb-6 flex items-center">
          <Plus className="w-5 h-5 mr-2 text-primary-500" />
          上传资料
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">课程群 <span className="text-red-500">*</span></label>
            <select
              value={newMaterial.group_id}
              onChange={(e) => setNewMaterial({ ...newMaterial, group_id: e.target.value })}
              className="w-full px-4 py-4 border border-neutral-200 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 bg-white"
            >
              <option value="">请选择课程群</option>
              {groups.map((group) => (
                <option key={group.group_id} value={group.group_id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">资料标题 <span className="text-red-500">*</span></label>
            <input
              type="text"
              placeholder="输入资料标题"
              value={newMaterial.title}
              onChange={(e) => setNewMaterial({ ...newMaterial, title: e.target.value })}
              className="w-full px-4 py-4 border border-neutral-200 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-neutral-700 mb-2">选择文件 <span className="text-red-500">*</span></label>
          <div className="flex items-center space-x-4">
            <label className="flex-1 flex items-center justify-center px-6 py-8 border-2 border-dashed border-neutral-200 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-colors cursor-pointer">
              <div className="flex flex-col items-center space-y-2">
                <Upload className="w-8 h-8 text-neutral-400" />
                {newMaterial.file ? (
                  <div className="text-center">
                    <span className="text-sm text-neutral-700">{newMaterial.file.name}</span>
                    <span className="text-xs text-neutral-500 block">{formatFileSize(newMaterial.file.size)}</span>
                  </div>
                ) : (
                  <>
                    <span className="text-sm text-neutral-500">点击或拖拽上传文件</span>
                    <span className="text-xs text-neutral-400">支持 PDF、Word、图片，最大 50MB</span>
                  </>
                )}
              </div>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp"
                onChange={(e) => setNewMaterial({ ...newMaterial, file: e.target.files?.[0] || null })}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-neutral-700 mb-2">资料描述</label>
          <textarea
            placeholder="描述资料内容..."
            rows={3}
            value={newMaterial.description}
            onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })}
            className="w-full px-4 py-4 border border-neutral-200 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 resize-none"
          />
        </div>

        <button
          onClick={handleUpload}
          disabled={!newMaterial.group_id || !newMaterial.title || !newMaterial.file || uploading}
          className="mt-6 px-8 py-4 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {uploading ? (
            <>
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
              上传中...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5 mr-2" />
              上传资料
            </>
          )}
        </button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <button
              onClick={() => setShowGroupFilter(!showGroupFilter)}
              className="flex items-center space-x-2 px-4 py-3 border border-neutral-200 rounded-xl hover:border-primary-500 transition-colors"
            >
              <Filter className="w-5 h-5 text-neutral-500" />
              <span className="text-sm text-neutral-600">
                {selectedGroup ? groups.find(g => g.group_id === selectedGroup)?.name : '全部课程群'}
              </span>
              <ChevronDown className="w-4 h-4 text-neutral-500" />
            </button>
            
            {showGroupFilter && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-neutral-100 z-10 max-h-64 overflow-y-auto">
                <button
                  onClick={() => { setSelectedGroup(''); setShowGroupFilter(false); }}
                  className="w-full px-4 py-3 text-sm hover:bg-primary-50 transition-colors"
                  style={{ color: !selectedGroup ? '#5B8FF9' : '#4b5563' }}
                >
                  全部课程群
                </button>
                {groups.map((group) => (
                  <button
                    key={group.group_id}
                    onClick={() => { setSelectedGroup(group.group_id); setShowGroupFilter(false); }}
                    className="w-full px-4 py-3 text-sm hover:bg-primary-50 transition-colors"
                    style={{ color: selectedGroup === group.group_id ? '#5B8FF9' : '#4b5563' }}
                  >
                    {group.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="text-sm text-neutral-500">
          共 {filteredMaterials.length} 条资料
        </div>
      </div>

      <div className="space-y-4">
        {filteredMaterials.map((material) => (
          <div key={material.material_id} className="bg-white rounded-xl shadow-sm border border-neutral-100 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${getFileColor(material.file_type)}`}>
                  <span className="text-xs font-bold">{getFileIcon(material.file_type)}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-800">{material.title}</h3>
                  <p className="text-sm text-neutral-500 mt-1">
                    {groups.find(g => g.group_id === material.group_id)?.name} · {material.uploader_nickname} · {new Date(material.created_at).toLocaleDateString()}
                  </p>
                  {material.description && (
                    <p className="text-sm text-neutral-600 mt-1 line-clamp-2">{material.description}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    material.status === 'approved'
                      ? 'bg-success-50 text-success-600'
                      : material.status === 'rejected'
                        ? 'bg-danger-50 text-danger-600'
                        : 'bg-warning-50 text-warning-600'
                  }`}
                >
                  {material.status === 'approved' ? '已通过' : material.status === 'rejected' ? '已拒绝' : '待审核'}
                </span>
                <span className="text-sm text-neutral-500">
                  {formatFileSize(material.file_size)}
                </span>
                <span className="text-sm text-neutral-500">
                  <Download className="w-4 h-4 inline-block mr-1" />
                  {material.download_count}次下载
                </span>
                
                <div className="flex items-center space-x-2">
                  <a 
                    href={material.file_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    <Eye className="w-5 h-5" />
                  </a>
                  <button 
                    onClick={() => handleDelete(material.material_id)}
                    className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {filteredMaterials.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-neutral-100 text-center py-16">
            <FileText className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-500">暂无资料</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default TutorMaterialManagePage;
