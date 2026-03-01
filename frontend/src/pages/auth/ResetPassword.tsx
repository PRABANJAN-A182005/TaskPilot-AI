import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Sparkles, CheckCircle, ArrowRight } from 'lucide-react';

export default function ResetPassword() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (!token) {
            setError('Invalid or missing token');
            return;
        }

        setIsLoading(true);
        setError('');
        setMessage('');

        try {
            const response = await authService.resetPassword(password, token);
            setMessage(response.message);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) {
        return (
            <div className='min-h-screen flex flex-col justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8'>
                <div className='sm:mx-auto sm:w-full sm:max-w-md'>
                    <div className='bg-white py-8 px-4 shadow-xl shadow-slate-200 sm:rounded-2xl sm:px-10 border border-slate-100 text-center space-y-4'>
                        <h2 className='text-xl font-bold text-red-600'>Invalid Token</h2>
                        <p className='text-slate-600'>This password reset link is invalid or has expired.</p>
                        <Link to='/forgot-password'>
                            <Button
                                variant='outline'
                                className='w-full'
                            >
                                Request new link
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className='min-h-screen flex flex-col justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8'>
            <div className='sm:mx-auto sm:w-full sm:max-w-md'>
                <div className='flex justify-center'>
                    <div className='flex h-16 w-16 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/20'>
                        <Sparkles className='h-10 w-10' />
                    </div>
                </div>
                <h2 className='mt-6 text-center text-3xl font-extrabold text-slate-900 tracking-tight'>
                    Reset Password
                </h2>
                <p className='mt-2 text-center text-sm text-slate-600'>Enter your new password below.</p>
            </div>

            <div className='mt-8 sm:mx-auto sm:w-full sm:max-w-md'>
                <div className='bg-white py-8 px-4 shadow-xl shadow-slate-200 sm:rounded-2xl sm:px-10 border border-slate-100'>
                    {message ? (
                        <div className='text-center space-y-4'>
                            <div className='mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100'>
                                <CheckCircle className='h-6 w-6 text-green-600' />
                            </div>
                            <p className='text-sm text-slate-600 font-medium'>{message}</p>
                            <Button
                                onClick={() => navigate('/login')}
                                className='w-full'
                            >
                                Sign in with new password
                            </Button>
                        </div>
                    ) : (
                        <form
                            className='space-y-6'
                            onSubmit={handleSubmit}
                        >
                            {error && (
                                <div className='p-3 rounded-lg bg-red-50 text-red-600 text-xs font-medium border border-red-100'>
                                    {error}
                                </div>
                            )}
                            <Input
                                label='New Password'
                                type='password'
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder='••••••••'
                                minLength={8}
                            />
                            <Input
                                label='Confirm New Password'
                                type='password'
                                required
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                placeholder='••••••••'
                                minLength={8}
                            />

                            <Button
                                type='submit'
                                className='w-full'
                                isLoading={isLoading}
                                size='lg'
                            >
                                Reset Password <ArrowRight className='ml-2 h-4 w-4' />
                            </Button>

                            <div className='text-center'>
                                <Link
                                    to='/login'
                                    className='text-sm font-medium text-slate-600 hover:text-primary'
                                >
                                    Back to login
                                </Link>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
