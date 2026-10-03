import { Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';

// 公共页面
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';

// 学生端页面
import GroupListPage from '@/pages/GroupListPage';
import GroupDetailPage from '@/pages/GroupDetailPage';
import TutorListPage from '@/pages/TutorListPage';
import TutorDetailPage from '@/pages/TutorDetailPage';
import ProfilePage from '@/pages/ProfilePage';
import TutorApplyPage from '@/pages/TutorApplyPage';
import TutorRulesPage from '@/pages/TutorRulesPage';

// 导师端页面
import TutorManagePage from '@/pages/tutor/TutorManagePage';
import TutorGroupManagePage from '@/pages/tutor/TutorGroupManagePage';
import TutorCreateGroupPage from '@/pages/tutor/TutorCreateGroupPage';
import TutorMaterialManagePage from '@/pages/tutor/TutorMaterialManagePage';
import TutorQaManagePage from '@/pages/tutor/TutorQaManagePage';
import TutorStudentManagePage from '@/pages/tutor/TutorStudentManagePage';
import TutorEarningsPage from '@/pages/tutor/TutorEarningsPage';

// 管理员端页面
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage';
import AdminUserManagePage from '@/pages/admin/AdminUserManagePage';
import AdminTutorAuditPage from '@/pages/admin/AdminTutorAuditPage';
import AdminMaterialAuditPage from '@/pages/admin/AdminMaterialAuditPage';
import AdminGroupAuditPage from '@/pages/admin/AdminGroupAuditPage';

function App() {
  return (
    <Routes>
      {/* 公共路由 */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* 主布局路由 */}
      <Route element={<Layout />}>
        {/* 首页 */}
        <Route path="/" element={<HomePage />} />

        {/* 学生端路由 */}
        <Route path="/groups" element={<GroupListPage />} />
        <Route path="/groups/:id" element={<GroupDetailPage />} />
        <Route path="/tutors" element={<TutorListPage />} />
        <Route path="/tutors/:id" element={<TutorDetailPage />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tutor/apply"
          element={
            <ProtectedRoute>
              <TutorApplyPage />
            </ProtectedRoute>
          }
        />
        <Route path="/tutor/rules" element={<TutorRulesPage />} />

        {/* 导师端路由 */}
        <Route
          path="/tutor/manage"
          element={
            <ProtectedRoute roles={['tutor']}>
              <TutorManagePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tutor/groups"
          element={
            <ProtectedRoute roles={['tutor']}>
              <TutorGroupManagePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tutor/groups/create"
          element={
            <ProtectedRoute roles={['tutor']}>
              <TutorCreateGroupPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tutor/materials"
          element={
            <ProtectedRoute roles={['tutor']}>
              <TutorMaterialManagePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tutor/qa"
          element={
            <ProtectedRoute roles={['tutor']}>
              <TutorQaManagePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tutor/students"
          element={
            <ProtectedRoute roles={['tutor']}>
              <TutorStudentManagePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tutor/earnings"
          element={
            <ProtectedRoute roles={['tutor']}>
              <TutorEarningsPage />
            </ProtectedRoute>
          }
        />

        {/* 管理员端路由 */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminUserManagePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/tutor-audit"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminTutorAuditPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/material-audit"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminMaterialAuditPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/group-audit"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminGroupAuditPage />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}

export default App;
