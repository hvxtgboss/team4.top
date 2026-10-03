import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Phone, User, GraduationCap, Building2, Briefcase, Calendar } from 'lucide-react';
import { register } from '../api/auth';
import { getSchools, getMajors } from '../api/schools';
import type { School, Major } from '../types';
import { BRAND_NAME, BRAND_TAGLINE } from '../data/brand';

const GRADES = ['2021级', '2022级', '2023级', '2024级', '2025级', '2026级'];

function RegisterPage() {
  const [phone, setPhone] = useState('');
  const [nickname, setNickname] = useState('');
  const [school_id, setSchoolId] = useState('');
  const [school_college, setSchoolCollege] = useState('');
  const [major, setMajor] = useState('');
  const [grade, setGrade] = useState('');
  const [student_id, setStudentId] = useState('');
  const [schools, setSchools] = useState<School[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchSchools();
    fetchMajors();
  }, []);

  async function fetchSchools() {
    try {
      const result = await getSchools();
      setSchools(result);
    } catch (error) {
      console.error('获取学校列表失败:', error);
    }
  }

  async function fetchMajors() {
    try {
      const result = await getMajors();
      setMajors(result);
    } catch (error) {
      console.error('获取专业列表失败:', error);
    }
  }

  async function handleRegister() {
    setError('');
    
    if (!phone) {
      setError('请输入手机号');
      return;
    }
    
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      setError('请输入正确的手机号');
      return;
    }
    
    if (!nickname) {
      setError('请输入昵称');
      return;
    }
    
    if (!school_id) {
      setError('请选择学校');
      return;
    }

    setLoading(true);
    try {
      const result = await register({
        phone,
        nickname,
        role: 'student',
        school_id,
        school_college: school_college || undefined,
        major: major || undefined,
        grade: grade || undefined,
        student_id: student_id || undefined,
      });
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || '注册失败，请重试');
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
          
          <div className="p-6">
            <h2 className="text-xl font-bold text-neutral-800 text-center mb-6">注册账号</h2>
            
            {error && (
              <div className="mb-4 p-3 bg-danger-50 text-danger-600 rounded-xl text-sm">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <p className="text-sm text-neutral-500 text-center bg-neutral-50 rounded-xl py-3 px-4">
                注册身份为<strong className="text-neutral-700">普通学生</strong>。
                想当导师请注册后阅读
                <Link to="/tutor/rules" className="text-primary-500 mx-1">导师规则</Link>
                再申请；管理员由平台配置。
              </p>
              
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="tel"
                  placeholder="手机号"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                  className="w-full pl-12 pr-4 py-4 border border-neutral-200 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                />
              </div>
              
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="text"
                  placeholder="姓名"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border border-neutral-200 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                />
              </div>
              
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <select
                  value={school_id}
                  onChange={(e) => setSchoolId(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border border-neutral-200 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 appearance-none bg-white"
                >
                  <option value="">选择学校</option>
                  {schools.map((school) => (
                    <option key={school.school_id} value={school.school_id}>
                      {school.name}
                      {school.type ? `（${school.type}）` : ''}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="relative">
                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="text"
                  placeholder="学院"
                  value={school_college}
                  onChange={(e) => setSchoolCollege(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border border-neutral-200 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                />
              </div>
              
              <div className="relative">
                <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <select
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border border-neutral-200 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 appearance-none bg-white"
                >
                  <option value="">选择专业</option>
                  {majors.map((m) => (
                    <option key={m.major_id} value={m.name}>
                      {m.name}
                      {m.category ? ` · ${m.category}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border border-neutral-200 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 appearance-none bg-white"
                >
                  <option value="">选择年级</option>
                  {GRADES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
              
              <input
                type="text"
                placeholder="学号（选填）"
                value={student_id}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full px-4 py-4 border border-neutral-200 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              />
              
              <button
                onClick={handleRegister}
                disabled={loading}
                className="w-full py-4 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '注册中...' : '注册'}
              </button>
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-neutral-500">
                已有账号？
                <Link to="/login" className="text-primary-500 hover:text-primary-600 ml-1">
                  立即登录
                </Link>
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-6 text-center text-sm text-neutral-400">
          <p>注册即表示同意</p>
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

export default RegisterPage;
