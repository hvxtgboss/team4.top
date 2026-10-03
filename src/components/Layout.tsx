import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, BookOpen, Users, User, LogOut, Search, Menu, X, GraduationCap, Settings, BarChart3, FileText, MessageSquare, Wallet, Shield } from 'lucide-react';
import type { User as UserType } from '../types';
import { BRAND_NAME, BRAND_TAGLINE } from '../data/brand';

function Layout() {
  const [user, setUser] = useState<UserType | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname.startsWith(path);

  const getStudentNav = () => (
    <>
      <Link to="/groups" className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isActive('/groups') ? 'text-primary-500 bg-primary-50' : 'text-neutral-600 hover:text-primary-500 hover:bg-primary-50'}`}>
        <Users className="w-4 h-4 mr-2" />
        课程群
      </Link>
      <Link to="/tutors" className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isActive('/tutors') ? 'text-primary-500 bg-primary-50' : 'text-neutral-600 hover:text-primary-500 hover:bg-primary-50'}`}>
        <GraduationCap className="w-4 h-4 mr-2" />
        导师
      </Link>
    </>
  );

  const getTutorNav = () => (
    <>
      <Link to="/tutor/manage" className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isActive('/tutor/manage') ? 'text-primary-500 bg-primary-50' : 'text-neutral-600 hover:text-primary-500 hover:bg-primary-50'}`}>
        <BarChart3 className="w-4 h-4 mr-2" />
        工作台
      </Link>
      <Link to="/tutor/groups" className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isActive('/tutor/groups') ? 'text-primary-500 bg-primary-50' : 'text-neutral-600 hover:text-primary-500 hover:bg-primary-50'}`}>
        <Users className="w-4 h-4 mr-2" />
        课程群管理
      </Link>
      <Link to="/tutor/materials" className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isActive('/tutor/materials') ? 'text-primary-500 bg-primary-50' : 'text-neutral-600 hover:text-primary-500 hover:bg-primary-50'}`}>
        <FileText className="w-4 h-4 mr-2" />
        资料管理
      </Link>
      <Link to="/tutor/qa" className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isActive('/tutor/qa') ? 'text-primary-500 bg-primary-50' : 'text-neutral-600 hover:text-primary-500 hover:bg-primary-50'}`}>
        <MessageSquare className="w-4 h-4 mr-2" />
        答疑管理
      </Link>
      <Link to="/tutor/students" className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isActive('/tutor/students') ? 'text-primary-500 bg-primary-50' : 'text-neutral-600 hover:text-primary-500 hover:bg-primary-50'}`}>
        <User className="w-4 h-4 mr-2" />
        学生管理
      </Link>
      <Link to="/tutor/earnings" className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isActive('/tutor/earnings') ? 'text-primary-500 bg-primary-50' : 'text-neutral-600 hover:text-primary-500 hover:bg-primary-50'}`}>
        <Wallet className="w-4 h-4 mr-2" />
        收益统计
      </Link>
    </>
  );

  const getAdminNav = () => (
    <>
      <Link to="/admin" className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isActive('/admin') && location.pathname === '/admin' ? 'text-primary-500 bg-primary-50' : 'text-neutral-600 hover:text-primary-500 hover:bg-primary-50'}`}>
        <BarChart3 className="w-4 h-4 mr-2" />
        数据看板
      </Link>
      <Link to="/admin/users" className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isActive('/admin/users') ? 'text-primary-500 bg-primary-50' : 'text-neutral-600 hover:text-primary-500 hover:bg-primary-50'}`}>
        <User className="w-4 h-4 mr-2" />
        用户管理
      </Link>
      <Link to="/admin/tutor-audit" className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isActive('/admin/tutor-audit') ? 'text-primary-500 bg-primary-50' : 'text-neutral-600 hover:text-primary-500 hover:bg-primary-50'}`}>
        <GraduationCap className="w-4 h-4 mr-2" />
        导师审核
      </Link>
      <Link to="/admin/group-audit" className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isActive('/admin/group-audit') ? 'text-primary-500 bg-primary-50' : 'text-neutral-600 hover:text-primary-500 hover:bg-primary-50'}`}>
        <Users className="w-4 h-4 mr-2" />
        课程群审核
      </Link>
      <Link to="/admin/material-audit" className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isActive('/admin/material-audit') ? 'text-primary-500 bg-primary-50' : 'text-neutral-600 hover:text-primary-500 hover:bg-primary-50'}`}>
        <FileText className="w-4 h-4 mr-2" />
        资料审核
      </Link>
    </>
  );

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-neutral-800">{BRAND_NAME}</span>
              </Link>
              
              <nav className="hidden md:flex items-center space-x-1">
                <Link to="/" className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isActive('/') && !isActive('/groups') && !isActive('/tutors') && !isActive('/tutor') && !isActive('/admin') ? 'text-primary-500 bg-primary-50' : 'text-neutral-600 hover:text-primary-500 hover:bg-primary-50'}`}>
                  <Home className="w-4 h-4 inline-block mr-1" />
                  首页
                </Link>
                {(!user || user.role === 'student') && getStudentNav()}
                {user?.role === 'tutor' && (
                  <>
                    {getStudentNav()}
                    <Link to="/tutor/manage" className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isActive('/tutor/manage') ? 'text-primary-500 bg-primary-50' : 'text-neutral-600 hover:text-primary-500 hover:bg-primary-50'}`}>
                      导师工作台
                    </Link>
                  </>
                )}
                {user?.role === 'admin' && (
                  <Link to="/admin" className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isActive('/admin') ? 'text-primary-500 bg-primary-50' : 'text-neutral-600 hover:text-primary-500 hover:bg-primary-50'}`}>
                    管理后台
                  </Link>
                )}
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="搜索课程或导师..."
                    className="pl-10 pr-4 py-2 w-64 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                  />
                </div>
              </div>

              {user ? (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-neutral-600 hidden sm:block">{user.nickname}</span>
                  <Link
                    to="/profile"
                    title="个人中心"
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-opacity hover:opacity-80 ${user.role === 'admin' ? 'bg-danger-100 text-danger-500' : user.role === 'tutor' ? 'bg-success-100 text-success-500' : 'bg-primary-100 text-primary-500'}`}
                  >
                    {user.role === 'admin' ? <Shield className="w-5 h-5" /> : user.role === 'tutor' ? <GraduationCap className="w-5 h-5" /> : <User className="w-5 h-5" />}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-neutral-400 hover:text-danger-500 transition-colors"
                    title="退出登录"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600 transition-colors"
                >
                  登录
                </Link>
              )}

              <button
                className="md:hidden p-2 text-neutral-600"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <aside className={`md:hidden fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="搜索课程或导师..."
              className="pl-10 pr-4 py-2 w-full text-sm border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500"
            />
          </div>
          
          <nav className="space-y-1">
            <Link to="/" className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isActive('/') && !isActive('/groups') && !isActive('/tutors') && !isActive('/tutor') && !isActive('/admin') ? 'text-primary-500 bg-primary-50' : 'text-neutral-600 hover:text-primary-500 hover:bg-primary-50'}`}>
              <Home className="w-4 h-4 mr-2" />
              首页
            </Link>
            {user?.role === 'student' && getStudentNav()}
            {user?.role === 'tutor' && getTutorNav()}
            {user?.role === 'admin' && getAdminNav()}
            {user && (
              <Link to="/profile" className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isActive('/profile') ? 'text-primary-500 bg-primary-50' : 'text-neutral-600 hover:text-primary-500 hover:bg-primary-50'}`}>
                <User className="w-4 h-4 mr-2" />
                个人中心
              </Link>
            )}
          </nav>
        </div>
      </aside>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-neutral-100 mt-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold text-neutral-800">{BRAND_NAME}</span>
              </div>
              <p className="text-sm text-neutral-500">{BRAND_TAGLINE}</p>
            </div>
            <div>
              <h3 className="font-medium text-neutral-800 mb-4">功能模块</h3>
              <ul className="space-y-2 text-sm text-neutral-500">
                <li><Link to="/groups" className="hover:text-primary-500">课程群</Link></li>
                <li><Link to="/tutors" className="hover:text-primary-500">导师</Link></li>
                <li><Link to="/tutor/rules" className="hover:text-primary-500">成为导师</Link></li>
                <li><Link to="/" className="hover:text-primary-500">在线答疑</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-neutral-800 mb-4">关于我们</h3>
              <ul className="space-y-2 text-sm text-neutral-500">
                <li><Link to="/tutor/rules" className="hover:text-primary-500">导师规则</Link></li>
                <li><a href="#" className="hover:text-primary-500">联系我们</a></li>
                <li><a href="#" className="hover:text-primary-500">使用条款</a></li>
                <li><a href="#" className="hover:text-primary-500">隐私政策</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-neutral-800 mb-4">联系方式</h3>
              <ul className="space-y-2 text-sm text-neutral-500">
                <li>邮箱：hello@xuedao.app</li>
                <li>微信：XueDaoHelper</li>
                <li>QQ群：123456789</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-neutral-100 mt-8 pt-8 text-center text-sm text-neutral-400">
            <p>© {new Date().getFullYear()} {BRAND_NAME}. 保留所有权利.</p>
          </div>
        </div>
      </footer>

      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-30" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
}

export default Layout;
