import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Sparkles, Mail, ArrowLeft } from 'lucide-react';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setMessage('');

        try {
            const response = await authService.forgotPassword(email);
            setMessage(response.message);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className='min-h-screen flex flex-col justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8'>
            <div className='sm:mx-auto sm:w-full sm:max-w-md'>
                <div className='flex justify-center'>
                    <div className='flex h-16 w-16 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/20'>
                        <Sparkles className='h-10 w-10' />
                    </div>
                </div>
                <h2 className='mt-6 text-center text-3xl font-extrabold text-slate-900 tracking-tight'>
                    Forgot Password
                </h2>
                <p className='mt-2 text-center text-sm text-slate-600'>
                    Enter your email and we'll send you a link to reset your password.
                </p>
            </div>

            <div className='mt-8 sm:mx-auto sm:w-full sm:max-w-md'>
                <div className='bg-white py-8 px-4 shadow-xl shadow-slate-200 sm:rounded-2xl sm:px-10 border border-slate-100'>
                    {message ? (
                        <div className='text-center space-y-4'>
                            <div className='mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100'>
                                <Mail className='h-6 w-6 text-green-600' />
                            </div>
                            <p className='text-sm text-slate-600'>{message}</p>
                            <Link
                                to='/login'
                                className='inline-flex items-center text-sm font-medium text-primary hover:text-primary/80'
                            >
                                <ArrowLeft className='mr-2 h-4 w-4' /> Back to login
                            </Link>
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
                                label='Email address'
                                type='email'
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder='name@company.com'
                            />

                            <Button
                                type='submit'
                                className='w-full'
                                isLoading={isLoading}
                                size='lg'
                            >
                                Send reset link
                            </Button>

                            <div className='text-center'>
                                <Link
                                    to='/login'
                                    className='inline-flex items-center text-sm font-medium text-slate-600 hover:text-primary'
                                >
                                    <ArrowLeft className='mr-2 h-4 w-4' /> Back to login
                                </Link>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
