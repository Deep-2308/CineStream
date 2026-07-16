import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore.js';
import Spinner from '../ui/Spinner.jsx';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, hydrated } = useAuthStore();
  const location = useLocation();

  // Wait for bootstrap to finish before deciding
  if (!hydrated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
