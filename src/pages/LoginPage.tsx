import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Phone, Lock, Eye, EyeOff } from 'lucide-react';
import { login } from '../api/auth';
import { BRAND_NAME, BRAND_TAGLINE } from '../data/brand';

function LoginPage() {
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleLogin() {
    setError('');
    
    if (!phone) {
      setError('请输入手机号');
      return;
    }
    
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      setError('请输入正确的手机号');
      return;
    }

    setLoading(true);
    try {
      const result = await login(phone);
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || '登录失败，请重试');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-success-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-8 text-white text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold">{BRAND_NAME}</h1>
            <p className="text-primary-100 mt-2">{BRAND_TAGLINE}</p>
          </div>
          
          <div className="p-8">
            <h2 className="text-xl font-bold text-neutral-800 text-center mb-6">登录</h2>
            
            {error && (
              <div className="mb-4 p-3 bg-danger-50 text-danger-600 rounded-xl text-sm">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="tel"
                  placeholder="请输入手机号"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  className="w-full pl-12 pr-4 py-4 border border-neutral-200 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                />
              </div>
              
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="验证码"
                  className="w-full pl-12 pr-14 py-4 border border-neutral-200 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-primary-50 text-primary-500 text-sm rounded-lg hover:bg-primary-100 transition-colors"
                >
                  获取验证码
                </button>
              </div>
              
              <button
                onClick={handleLogin}
                disabled={loading || !phone}
                className="w-full py-4 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '登录中...' : '登录'}
              </button>
            </div>
            
            <div className="mt-8 text-center">
              <p className="text-sm text-neutral-500">
                首次登录即自动注册
              </p>
              <Link to="/register" className="text-sm text-primary-500 hover:text-primary-600 mt-2 block">
                注册账号
              </Link>
            </div>
            
            <div className="mt-6 flex justify-center">
              <div className="flex space-x-4">
                <button className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white hover:bg-green-600 transition-colors">
                  <span className="text-lg">微</span>
                </button>
                <button className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white hover:bg-blue-600 transition-colors">
                  <span className="text-lg">支</span>
                </button>
              </div>
              <p className="ml-4 self-center text-sm text-neutral-400">其他登录方式</p>
            </div>
          </div>
        </div>
        
        <div className="mt-6 text-center text-sm text-neutral-400">
          <p>登录即表示同意</p>
          <p>
            <a href="#" className="hover:text-primary-500">用户协议</a>
            <span className="mx-2">和</span>
            <a href="#" className="hover:text-primary-500">隐私政策</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
