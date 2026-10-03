import { useState, useEffect } from 'react';
import { Wallet } from 'lucide-react';
import { getMyEarnings } from '../../api/tutor';

interface EarningRow {
  order_id: string;
  amount: number;
  group_name?: string;
  student_nickname?: string;
  paid_at?: string;
}

function TutorEarningsPage() {
  const [total, setTotal] = useState(0);
  const [count, setCount] = useState(0);
  const [list, setList] = useState<EarningRow[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    getMyEarnings()
      .then((data: any) => {
        setTotal(data.total_amount || 0);
        setCount(data.order_count || 0);
        setList(data.list || []);
      })
      .catch((e: any) => setError(e?.message || '加载失败（需导师身份）'));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-800">收益统计</h1>
        <p className="text-sm text-neutral-500 mt-1">已支付订单汇总（真实数据）</p>
      </div>

      {error && <p className="text-sm text-danger-500">{error}</p>}

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="card">
          <p className="text-sm text-neutral-500">累计收益</p>
          <p className="text-3xl font-bold text-primary-500 mt-2">¥{total}</p>
        </div>
        <div className="card">
          <p className="text-sm text-neutral-500">成交订单</p>
          <p className="text-3xl font-bold text-neutral-800 mt-2">{count}</p>
        </div>
      </div>

      <div className="space-y-3">
        {list.map((row) => (
          <div key={row.order_id} className="card flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wallet className="w-5 h-5 text-success-500" />
              <div>
                <p className="font-medium text-neutral-800">{row.group_name}</p>
                <p className="text-sm text-neutral-500">
                  {row.student_nickname || '同学'} · {row.paid_at || ''}
                </p>
              </div>
            </div>
            <p className="font-semibold text-primary-500">+¥{row.amount}</p>
          </div>
        ))}
        {list.length === 0 && !error && (
          <p className="text-center text-neutral-400 py-12">暂无收益记录</p>
        )}
      </div>
    </div>
  );
}

export default TutorEarningsPage;
