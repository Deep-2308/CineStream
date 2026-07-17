import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient.js';
import { bootstrapAuth } from './lib/apiClient.js';
import { useAuthStore } from './store/authStore.js';
import AppLayout from './components/layout/AppLayout.jsx';
import ProtectedRoute from './components/common/ProtectedRoute.jsx';
import ErrorBoundary from './components/common/ErrorBoundary.jsx';
import ScrollToTop from './components/common/ScrollToTop.jsx';
import Spinner from './components/ui/Spinner.jsx';

// Lazy-loaded pages
const HomePage = lazy(() => import('./pages/HomePage.jsx'));
const MovieDetailPage = lazy(() => import('./pages/MovieDetailPage.jsx'));
const SearchPage = lazy(() => import('./pages/SearchPage.jsx'));
const WatchlistPage = lazy(() => import('./pages/WatchlistPage.jsx'));
const ProfilePage = lazy(() => import('./pages/ProfilePage.jsx'));
const OriginalsPage = lazy(() => import('./pages/OriginalsPage.jsx'));
const OriginalPlayerPage = lazy(() => import('./pages/OriginalPlayerPage.jsx'));
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'));
const SignupPage = lazy(() => import('./pages/SignupPage.jsx'));

const PageLoader = () => (
  <div className="flex min-h-[60vh] items-center justify-center">
    <Spinner size="lg" />
  </div>
);

export default function App() {
  useEffect(() => {
    bootstrapAuth();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ScrollToTop />
        {/* Outer ErrorBoundary — last resort, catches everything */}
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route element={<AppLayout />}>
                {/* Inner ErrorBoundary — keeps Navbar alive on page crash */}
                <Route path="/" element={<ErrorBoundary><HomePage /></ErrorBoundary>} />
                <Route path="/movie/:id" element={<ErrorBoundary><MovieDetailPage /></ErrorBoundary>} />
                <Route path="/search" element={<ErrorBoundary><SearchPage /></ErrorBoundary>} />
                <Route path="/originals" element={<ErrorBoundary><OriginalsPage /></ErrorBoundary>} />
                <Route path="/originals/:id" element={<ErrorBoundary><OriginalPlayerPage /></ErrorBoundary>} />
                <Route path="/login" element={<ErrorBoundary><LoginPage /></ErrorBoundary>} />
                <Route path="/signup" element={<ErrorBoundary><SignupPage /></ErrorBoundary>} />
                <Route
                  path="/watchlist"
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary><WatchlistPage /></ErrorBoundary>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary><ProfilePage /></ErrorBoundary>
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
