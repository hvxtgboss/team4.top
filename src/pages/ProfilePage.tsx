import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, BookOpen, Settings, GraduationCap, ChevronRight, Award, Wallet, CreditCard } from 'lucide-react';
import { getUserInfo } from '../api/auth';
import { getMyGroups } from '../api/groups';
import { getTutorProfile } from '../api/tutor';
import { getOrders } from '../api/orders';
import type { User as UserType, CourseGroup, Order } from '../types';

function ProfilePage() {
  const [user, setUser] = useState<UserType | null>(null);
  const [groups, setGroups] = useState<CourseGroup[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tutorProfile, setTutorProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'groups' | 'orders' | 'tutor'>('info');

  useEffect(() => {
    fetchUserInfo();
    fetchMyGroups();
    fetchOrders();
  }, []);

  useEffect(() => {
    if (user?.role === 'tutor') {
      fetchTutorProfile();
    }
  }, [user?.role]);

  async function fetchUserInfo() {
    try {
      const result = await getUserInfo();
      setUser(result);
      localStorage.setItem('user', JSON.stringify(result));
    } catch (error) {
      console.error('获取用户信息失败:', error);
    }
  }

  async function fetchMyGroups() {
    try {
      const result = await getMyGroups();
      setGroups(result);
    } catch (error) {
      console.error('获取我的课程群失败:', error);
    }
  }

  async function fetchOrders() {
    try {
      const result = await getOrders({ page: 1, page_size: 50 });
      setOrders(result.list || []);
    } catch (error) {
      console.error('获取支付记录失败:', error);
    }
  }

  async function fetchTutorProfile() {
    try {
      const result = await getTutorProfile();
      setTutorProfile(result);
    } catch (error) {
      console.error('获取导师资料失败:', error);
    }
  }

  const paidOrders = orders.filter((o) => o.status === 'paid');

  if (!user) {
    return <div className="text-center py-16">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-8 text-white">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
            <User className="w-12 h-12" />
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-2xl font-bold">{user.nickname}</h1>
            <p className="text-primary-100 mt-2">
              {user.role === 'tutor' ? '认证导师' : user.role === 'admin' ? '管理员' : '学生'}
            </p>
            {user.school_id && (
              <p className="text-primary-100">{user.major || '未填写专业'}</p>
            )}
          </div>
          <div className="flex items-center space-x-6 ml-auto">
            <div className="text-center">
              <div className="text-2xl font-bold">{groups.length}</div>
              <div className="text-sm text-primary-100">已加入</div>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div className="text-center">
              <div className="text-2xl font-bold">{paidOrders.length}</div>
              <div className="text-sm text-primary-100">已支付</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 bg-white rounded-xl shadow-sm border border-neutral-100 p-2">
        <button
          onClick={() => setActiveTab('info')}
          className={`flex-1 min-w-[120px] py-3 rounded-lg font-medium transition-colors ${activeTab === 'info' ? 'bg-primary-500 text-white' : 'text-neutral-600 hover:bg-neutral-50'}`}
        >
          <User className="w-5 h-5 inline-block mr-2" />
          个人信息
        </button>
        <button
          onClick={() => setActiveTab('groups')}
          className={`flex-1 min-w-[120px] py-3 rounded-lg font-medium transition-colors ${activeTab === 'groups' ? 'bg-primary-500 text-white' : 'text-neutral-600 hover:bg-neutral-50'}`}
        >
          <BookOpen className="w-5 h-5 inline-block mr-2" />
          我的课程群 ({groups.length})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex-1 min-w-[120px] py-3 rounded-lg font-medium transition-colors ${activeTab === 'orders' ? 'bg-primary-500 text-white' : 'text-neutral-600 hover:bg-neutral-50'}`}
        >
          <CreditCard className="w-5 h-5 inline-block mr-2" />
          支付记录 ({paidOrders.length})
        </button>
        {user.role === 'tutor' && (
          <button
            onClick={() => setActiveTab('tutor')}
            className={`flex-1 min-w-[120px] py-3 rounded-lg font-medium transition-colors ${activeTab === 'tutor' ? 'bg-primary-500 text-white' : 'text-neutral-600 hover:bg-neutral-50'}`}
          >
            <GraduationCap className="w-5 h-5 inline-block mr-2" />
            导师中心
          </button>
        )}
      </div>

      {activeTab === 'info' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 card">
            <h2 className="font-semibold text-neutral-800 mb-4">基本信息</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl">
                <span className="text-neutral-600">手机号</span>
                <span className="font-medium">{user.phone}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl">
                <span className="text-neutral-600">昵称</span>
                <span className="font-medium">{user.nickname}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl">
                <span className="text-neutral-600">角色</span>
                <span className={`font-medium ${user.role === 'tutor' ? 'text-primary-500' : user.role === 'admin' ? 'text-warning-500' : 'text-success-500'}`}>
                  {user.role === 'tutor' ? '认证导师' : user.role === 'admin' ? '管理员' : '学生'}
                </span>
              </div>
              {user.major && (
                <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl">
                  <span className="text-neutral-600">专业</span>
                  <span className="font-medium">{user.major}</span>
                </div>
              )}
              <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl">
                <span className="text-neutral-600">注册时间</span>
                <span className="font-medium">{new Date(user.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {user.role !== 'tutor' && (
              <Link to="/tutor/apply" className="card block hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-primary-500" />
                    </div>
                    <div>
                      <p className="font-medium text-neutral-800">申请成为导师</p>
                      <p className="text-sm text-neutral-500">分享知识，获得收益</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-neutral-400" />
                </div>
              </Link>
            )}

            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className="card w-full text-left hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-warning-50 rounded-lg flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-warning-500" />
                  </div>
                  <div>
                    <p className="font-medium text-neutral-800">支付记录</p>
                    <p className="text-sm text-neutral-500">{paidOrders.length} 笔已支付订单</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-neutral-400" />
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('groups')}
              className="card w-full text-left hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-primary-500" />
                  </div>
                  <div>
                    <p className="font-medium text-neutral-800">已加入的群</p>
                    <p className="text-sm text-neutral-500">{groups.length} 个课程群</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-neutral-400" />
              </div>
            </button>

            <div className="card">
              <div className="flex items-center justify-between p-2">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center">
                    <Settings className="w-5 h-5 text-neutral-500" />
                  </div>
                  <div>
                    <p className="font-medium text-neutral-800">设置</p>
                    <p className="text-sm text-neutral-500">账号和隐私设置</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-neutral-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'groups' && (
        <div className="space-y-4">
          {groups.map((group) => (
            <Link to={`/groups/${group.group_id}`} key={group.group_id} className="card block hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-primary-500" />
                  </div>
                  <div>
                    <h3 className="font-medium text-neutral-800">{group.name}</h3>
                    <p className="text-sm text-neutral-500">
                      {group.course_name}
                      {group.tutor_nickname ? ` · ${group.tutor_nickname}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      Number(group.price) > 0 ? 'bg-success-50 text-success-600' : 'bg-primary-50 text-primary-600'
                    }`}
                  >
                    {Number(group.price) > 0 ? '已购买' : '已加入'}
                  </span>
                  <ChevronRight className="w-5 h-5 text-neutral-400" />
                </div>
              </div>
            </Link>
          ))}

          {groups.length === 0 && (
            <div className="card text-center py-16">
              <BookOpen className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
              <p className="text-neutral-500">暂无加入的课程群</p>
              <Link to="/groups" className="text-primary-500 mt-4 inline-block">
                去浏览课程群
              </Link>
            </div>
          )}
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              to={`/groups/${order.group_id}`}
              key={order.order_id}
              className="card block hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="font-medium text-neutral-800 truncate">{order.group_name || '课程群'}</h3>
                  <p className="text-sm text-neutral-500 mt-1">
                    {order.course_name || '课程'}
                    {order.school_name ? ` · ${order.school_name}` : ''}
                  </p>
                  <p className="text-xs text-neutral-400 mt-2">
                    订单号 {order.order_id}
                    {order.paid_at
                      ? ` · 支付于 ${new Date(order.paid_at).toLocaleString()}`
                      : ` · 创建于 ${new Date(order.created_at).toLocaleString()}`}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-semibold text-neutral-800">¥{Number(order.amount).toFixed(2)}</p>
                  <span
                    className={`inline-block mt-2 text-xs px-2 py-1 rounded-full font-medium ${
                      order.status === 'paid'
                        ? 'bg-success-50 text-success-600'
                        : order.status === 'pending'
                          ? 'bg-warning-50 text-warning-600'
                          : 'bg-neutral-100 text-neutral-500'
                    }`}
                  >
                    {order.status === 'paid' ? '已支付' : order.status === 'pending' ? '待支付' : '已取消'}
                  </span>
                </div>
              </div>
            </Link>
          ))}

          {orders.length === 0 && (
            <div className="card text-center py-16">
              <CreditCard className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
              <p className="text-neutral-500">暂无支付记录</p>
              <Link to="/groups" className="text-primary-500 mt-4 inline-block">
                去选课
              </Link>
            </div>
          )}
        </div>
      )}

      {activeTab === 'tutor' && tutorProfile && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 card">
            <h2 className="font-semibold text-neutral-800 mb-4 flex items-center">
              <Award className="w-5 h-5 mr-2 text-primary-500" />
              导师资质
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl">
                <span className="text-neutral-600">真实姓名</span>
                <span className="font-medium">{tutorProfile.real_name}</span>
              </div>
              {tutorProfile.gpa && (
                <div className="p-4 bg-neutral-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-neutral-600">GPA</span>
                    <span className="font-medium text-success-500">{tutorProfile.gpa}</span>
                  </div>
                  <div className="h-3 bg-neutral-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-success-400 to-success-500 rounded-full"
                      style={{ width: `${(tutorProfile.gpa / 4) * 100}%` }}
                    />
                  </div>
                </div>
              )}
              {tutorProfile.course_experience && (
                <div className="p-4 bg-neutral-50 rounded-xl">
                  <span className="text-neutral-600 block mb-2">课程经验</span>
                  <p className="text-neutral-800">{tutorProfile.course_experience}</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="card">
              <h3 className="font-medium text-neutral-800 mb-4">认证状态</h3>
              <div className="flex items-center justify-between">
                <span className="text-neutral-600">审核状态</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${tutorProfile.apply_status === 'approved' ? 'bg-success-50 text-success-500' : tutorProfile.apply_status === 'pending' ? 'bg-warning-50 text-warning-500' : 'bg-danger-50 text-danger-500'}`}>
                  {tutorProfile.apply_status === 'approved' ? '已通过' : tutorProfile.apply_status === 'pending' ? '审核中' : '已拒绝'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfilePage;
