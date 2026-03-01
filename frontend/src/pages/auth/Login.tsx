import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            await authService.login(email, password);
            navigate('/');
        } catch {
            setError('Invalid email or password. Please try again.');
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
                    TaskPilot <span className='text-primary'>AI</span>
                </h2>
                <p className='mt-2 text-center text-sm text-slate-600'>
                    Sign in to manage your projects with AI intelligence.
                </p>
            </div>

            <div className='mt-8 sm:mx-auto sm:w-full sm:max-w-md'>
                <div className='bg-white py-8 px-4 shadow-xl shadow-slate-200 sm:rounded-2xl sm:px-10 border border-slate-100'>
                    <form
                        className='space-y-6'
                        onSubmit={handleLogin}
                    >
                        {error && (
                            <div className='p-3 rounded-lg bg-red-50 text-red-600 text-xs font-medium border border-red-100'>
                                {error}
                            </div>
                        )}
                        <Input
                            label='Email address'
                            type='email'
                            autoComplete='email'
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder='name@company.com'
                        />
                        <Input
                            label='Password'
                            type='password'
                            autoComplete='current-password'
                            required
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder='••••••••'
                        />

                        <div className='flex items-center justify-between'>
                            <div className='flex items-center'>
                                <input
                                    id='remember-me'
                                    name='remember-me'
                                    type='checkbox'
                                    className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded'
                                />
                                <label
                                    htmlFor='remember-me'
                                    className='ml-2 block text-xs text-slate-700'
                                >
                                    Remember me
                                </label>
                            </div>
                            <div className='text-xs'>
                                <Link
                                    to='/forgot-password'
                                    title='Click here to reset your password'
                                    className='font-medium text-blue-600 hover:text-blue-500'
                                >
                                    Forgot password?
                                </Link>
                            </div>
                        </div>

                        <Button
                            type='submit'
                            className='w-full'
                            isLoading={isLoading}
                            size='lg'
                        >
                            Sign in <ArrowRight className='ml-2 h-4 w-4' />
                        </Button>
                    </form>
                </div>

                <p className='mt-8 text-center text-sm text-slate-600'>
                    Don't have an account?{' '}
                    <Link
                        to='/register'
                        className='font-bold text-blue-600 hover:text-blue-500'
                    >
                        Start your 14-day free trial
                    </Link>
                </p>
            </div>
        </div>
    );
}
