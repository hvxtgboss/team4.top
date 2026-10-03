import { Navigate, useLocation } from 'react-router-dom';

interface Props {
  children: React.ReactNode;
  roles?: Array<'student' | 'tutor' | 'admin'>;
}

function ProtectedRoute({ children, roles }: Props) {
  const location = useLocation();
  const token = localStorage.getItem('token');
  const raw = localStorage.getItem('user');
  const user = raw ? JSON.parse(raw) : null;

  if (!token || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
