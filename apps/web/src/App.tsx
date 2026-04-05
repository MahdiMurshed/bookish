import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Header } from '@/components/Header';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import BookDetail from '@/pages/BookDetail';
import Browse from '@/pages/Browse';
import MyLibrary from '@/pages/MyLibrary';
import Requests from '@/pages/Requests';
import { ResetPassword } from '@/pages/ResetPassword';
import { SignIn } from '@/pages/SignIn';
import { SignUp } from '@/pages/SignUp';

import '@repo/ui/styles/globals.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/browse" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <AuthProvider>
              <Header />
              <main className="container mx-auto px-4 py-8">
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<Navigate to="/browse" replace />} />
                  <Route
                    path="/signin"
                    element={
                      <PublicRoute>
                        <SignIn />
                      </PublicRoute>
                    }
                  />
                  <Route
                    path="/signup"
                    element={
                      <PublicRoute>
                        <SignUp />
                      </PublicRoute>
                    }
                  />
                  <Route path="/reset-password" element={<ResetPassword />} />

                  {/* Protected routes */}
                  <Route
                    path="/browse"
                    element={
                      <ProtectedRoute>
                        <Browse />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/books/:id"
                    element={
                      <ProtectedRoute>
                        <BookDetail />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/my-library"
                    element={
                      <ProtectedRoute>
                        <MyLibrary />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/requests"
                    element={
                      <ProtectedRoute>
                        <Requests />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <div className="text-center text-muted-foreground">
                          Profile coming in Phase 4
                        </div>
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </main>
            </AuthProvider>
          </BrowserRouter>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
