import { useState, useEffect } from 'react';
import { Check, X, FileText, RefreshCw } from 'lucide-react';
import { getAdminMaterials, reviewMaterial } from '../../api/admin';

function AdminMaterialAuditPage() {
  const [list, setList] = useState<any[]>([]);
  const [status, setStatus] = useState('pending');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    load();
  }, [status]);

  async function load() {
    try {
      const data: any = await getAdminMaterials(status);
      setList(data.list || []);
    } catch (e: any) {
      setMsg(e?.message || '加载失败');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">资料审核</h1>
          <p className="text-sm text-neutral-500 mt-1">导师上传的资料需审核后对学生可见</p>
        </div>
        <button type="button" onClick={load} className="flex items-center gap-2 px-3 py-2 border rounded-lg text-sm">
          <RefreshCw className="w-4 h-4" /> 刷新
        </button>
      </div>
      <div className="flex gap-2">
        {['pending', 'approved', 'rejected'].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-sm ${status === s ? 'bg-primary-500 text-white' : 'bg-neutral-100'}`}
          >
            {s === 'pending' ? '待审核' : s === 'approved' ? '已通过' : '已拒绝'}
          </button>
        ))}
      </div>
      {msg && <p className="text-sm text-primary-500">{msg}</p>}
      <div className="space-y-3">
        {list.map((m) => (
          <div key={m.material_id} className="card flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-primary-500 mt-1" />
              <div>
                <p className="font-medium text-neutral-800">{m.title}</p>
                <p className="text-sm text-neutral-500">
                  {m.group_name} · {m.uploader_nickname} · {m.created_at}
                </p>
              </div>
            </div>
            {status === 'pending' && (
              <div className="flex gap-2">
                <button
                  type="button"
                  className="px-3 py-2 bg-success-500 text-white rounded-lg text-sm inline-flex items-center gap-1"
                  onClick={async () => {
                    await reviewMaterial(m.material_id, 'approve');
                    setMsg('已通过');
                    load();
                  }}
                >
                  <Check className="w-4 h-4" /> 通过
                </button>
                <button
                  type="button"
                  className="px-3 py-2 bg-danger-500 text-white rounded-lg text-sm inline-flex items-center gap-1"
                  onClick={async () => {
                    await reviewMaterial(m.material_id, 'reject');
                    setMsg('已拒绝');
                    load();
                  }}
                >
                  <X className="w-4 h-4" /> 拒绝
                </button>
              </div>
            )}
          </div>
        ))}
        {list.length === 0 && <p className="text-center text-neutral-400 py-10">暂无记录</p>}
      </div>
    </div>
  );
}

export default AdminMaterialAuditPage;
