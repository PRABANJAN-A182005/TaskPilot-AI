import { useSearchParams, Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export default function AuthError() {
    const [searchParams] = useSearchParams();
    const error = searchParams.get('message') || 'Authentication failed';

    return (
        <div className='min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8'>
            <div className='max-w-md w-full text-center'>
                <div className='mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 text-red-600 mb-6'>
                    <AlertCircle className='h-10 w-10' />
                </div>
                <h2 className='text-3xl font-extrabold text-slate-900 tracking-tight'>Authentication Error</h2>
                <p className='mt-4 text-slate-600'>{decodeURIComponent(error)}</p>
                <div className='mt-8'>
                    <Link to='/login'>
                        <Button
                            variant='outline'
                            className='w-full'
                        >
                            <ArrowLeft className='mr-2 h-4 w-4' /> Back to Login
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
