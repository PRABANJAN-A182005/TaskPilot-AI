import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../../services/auth.service';

export default function AuthCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const hasCompleted = useRef(false);

    useEffect(() => {
        if (hasCompleted.current) return;

        const accessToken = searchParams.get('accessToken');
        const refreshToken = searchParams.get('refreshToken');

        const completeAuth = async () => {
            if (hasCompleted.current) return;

            if (accessToken && refreshToken) {
                hasCompleted.current = true;
                localStorage.setItem('accessToken', accessToken);
                localStorage.setItem('refreshToken', refreshToken);

                try {
                    // Fetch user profile before completing auth to ensure data is in localStorage
                    await authService.me();

                    if (window.opener) {
                        // If opened as a popup, notify the opener
                        window.opener.postMessage(
                            { type: 'AUTH_SUCCESS', accessToken, refreshToken },
                            window.location.origin
                        );
                        // Give some time for the message to be processed before closing
                        setTimeout(() => {
                            window.close();
                        }, 500);
                    } else {
                        // If redirected directly, just navigate to home
                        navigate('/', { replace: true });
                    }
                } catch (error) {
                    console.error('Failed to complete authentication:', error);
                    if (window.opener) {
                        window.opener.postMessage(
                            { type: 'AUTH_ERROR', message: 'Failed to fetch user profile' },
                            window.location.origin
                        );
                        setTimeout(() => window.close(), 500);
                    } else {
                        navigate(`/login?error=${encodeURIComponent('Failed to fetch user profile')}`);
                    }
                }
            } else {
                const error = searchParams.get('error') || 'Authentication failed';
                if (window.opener) {
                    hasCompleted.current = true;
                    window.opener.postMessage({ type: 'AUTH_ERROR', message: error }, window.location.origin);
                    setTimeout(() => window.close(), 500);
                } else {
                    hasCompleted.current = true;
                    navigate(`/login?error=${encodeURIComponent(error)}`);
                }
            }
        };

        completeAuth();
    }, [searchParams, navigate]);

    return (
        <div className='min-h-screen flex items-center justify-center bg-slate-50'>
            <div className='text-center'>
                <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto'></div>
                <p className='mt-4 text-slate-600'>Completing authentication...</p>
            </div>
        </div>
    );
}
