import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import Dashboard from './pages/dashboard/Dashboard';
import ProjectList from './pages/projects/ProjectList';
import ProjectDetails from './pages/projects/ProjectDetails';
import CreateProject from './pages/projects/CreateProject';
import AllTasks from './pages/AllTasks';
import Settings from './pages/Settings';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import AuthCallback from './pages/auth/AuthCallback';
import AuthError from './pages/auth/AuthError';
import PublicProjectView from './pages/projects/PublicProjectView';
import { authService } from './services/auth.service';
import { useEffect } from 'react';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const user = authService.getCurrentUser();
    if (!user) {
        return (
            <Navigate
                to='/login'
                replace
            />
        );
    }
    return <Layout>{children}</Layout>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
    const user = authService.getCurrentUser();
    if (user) {
        return (
            <Navigate
                to='/'
                replace
            />
        );
    }
    return <>{children}</>;
};

function App() {
    useEffect(() => {
        // Refresh user data on mount to get fresh signed URLs for avatar
        if (authService.getCurrentUser()) {
            authService
                .me()
                .then(() => {
                    window.dispatchEvent(new Event('user-updated'));
                })
                .catch(err => {
                    console.error('Failed to refresh user data', err);
                });
        }

        let isProcessing = false;

        const handleAuthMessage = async (event: MessageEvent) => {
            if (event.origin !== window.location.origin) return;

            if (event.data?.type === 'AUTH_SUCCESS' && !isProcessing) {
                isProcessing = true;
                // Tokens are already set in AuthCallback, but setting them again for safety
                localStorage.setItem('accessToken', event.data.accessToken);
                localStorage.setItem('refreshToken', event.data.refreshToken);

                // AuthCallback already fetched the user data, so it's in localStorage
                // We just need to reload to refresh the app state
                window.location.reload();
            } else if (event.data?.type === 'AUTH_ERROR') {
                console.error('Auth error:', event.data.message);
            }
        };

        window.addEventListener('message', handleAuthMessage);
        return () => window.removeEventListener('message', handleAuthMessage);
    }, []);

    return (
        <Router>
            <Routes>
                <Route
                    path='/login'
                    element={
                        <PublicRoute>
                            <Login />
                        </PublicRoute>
                    }
                />
                <Route
                    path='/register'
                    element={
                        <PublicRoute>
                            <Register />
                        </PublicRoute>
                    }
                />
                <Route
                    path='/forgot-password'
                    element={
                        <PublicRoute>
                            <ForgotPassword />
                        </PublicRoute>
                    }
                />
                <Route
                    path='/reset-password'
                    element={
                        <PublicRoute>
                            <ResetPassword />
                        </PublicRoute>
                    }
                />
                <Route
                    path='/auth/callback'
                    element={<AuthCallback />}
                />
                <Route
                    path='/auth/error'
                    element={<AuthError />}
                />
                <Route
                    path='/share/:token'
                    element={<PublicProjectView />}
                />

                <Route
                    path='/'
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path='/projects'
                    element={
                        <ProtectedRoute>
                            <ProjectList />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path='/projects/new'
                    element={
                        <ProtectedRoute>
                            <CreateProject />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path='/projects/:id'
                    element={
                        <ProtectedRoute>
                            <ProjectDetails />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path='/tasks'
                    element={
                        <ProtectedRoute>
                            <AllTasks />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path='/settings'
                    element={
                        <ProtectedRoute>
                            <Settings />
                        </ProtectedRoute>
                    }
                />

                {/* Fallback for other routes */}
                <Route
                    path='*'
                    element={
                        <Navigate
                            to='/'
                            replace
                        />
                    }
                />
            </Routes>
        </Router>
    );
}

export default App;
