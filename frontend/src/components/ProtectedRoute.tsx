import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface Props {
  children: React.ReactNode;
  allowedRoles?: string[];   // optional — restrict by role too
}

export function ProtectedRoute({ children, allowedRoles }: Props) {
  const { token, user } = useAuth();

  // Not logged in at all
  if (!token) return <Navigate to="/login" replace />;

  // Logged in but wrong role
  if (allowedRoles && user && !allowedRoles.includes(user.role))
    return <Navigate to="/login" replace />;

  return <>{children}</>;
}
