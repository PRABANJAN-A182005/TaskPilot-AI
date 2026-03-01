import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

export default function Register() {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            await authService.register(name, email, password);
            navigate('/');
        } catch (err: any) {
            console.error('Registration failed', err);
            const errorMessage = err.response?.data?.message || err.message || 'Registration failed';
            setError(errorMessage);
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
                    Join TaskPilot AI and transform your workflow.
                </p>
            </div>

            <div className='mt-8 sm:mx-auto sm:w-full sm:max-w-md'>
                <div className='bg-white py-8 px-4 shadow-xl shadow-slate-200 sm:rounded-2xl sm:px-10 border border-slate-100'>
                    {error && (
                        <div className='mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 font-medium'>
                            {error}
                        </div>
                    )}
                    <form
                        className='space-y-6'
                        onSubmit={handleRegister}
                    >
                        <Input
                            label='Full Name'
                            type='text'
                            required
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder='John Doe'
                        />
                        <Input
                            label='Email address'
                            type='email'
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder='name@company.com'
                        />
                        <Input
                            label='Password'
                            type='password'
                            required
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder='••••••••'
                        />

                        <div className='flex items-start'>
                            <div className='flex items-center h-5'>
                                <input
                                    id='terms'
                                    type='checkbox'
                                    required
                                    className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded'
                                />
                            </div>
                            <div className='ml-3 text-xs'>
                                <label
                                    htmlFor='terms'
                                    className='text-slate-600'
                                >
                                    I agree to the{' '}
                                    <a
                                        href='#'
                                        className='font-bold text-blue-600'
                                    >
                                        Terms of Service
                                    </a>{' '}
                                    and{' '}
                                    <a
                                        href='#'
                                        className='font-bold text-blue-600'
                                    >
                                        Privacy Policy
                                    </a>
                                    .
                                </label>
                            </div>
                        </div>

                        <Button
                            type='submit'
                            className='w-full'
                            isLoading={isLoading}
                            size='lg'
                        >
                            Get Started <ArrowRight className='ml-2 h-4 w-4' />
                        </Button>
                    </form>

                    <div className='mt-6 flex items-center justify-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest'>
                        <ShieldCheck className='h-4 w-4 text-emerald-500' />
                        Enterprise-Grade Security Included
                    </div>
                </div>

                <div className='mt-8 space-y-4'>
                    <p className='text-center text-sm text-slate-600'>
                        Already have an account?{' '}
                        <Link
                            to='/login'
                            className='font-bold text-blue-600 hover:text-blue-500'
                        >
                            Sign in here
                        </Link>
                    </p>

                    <div className='bg-blue-50/50 rounded-xl p-4 border border-blue-100'>
                        <p className='text-xs text-blue-700 text-center leading-relaxed'>
                            <strong>Collaborating with a team?</strong> Create an account with your work email to
                            automatically see pending project invitations.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
