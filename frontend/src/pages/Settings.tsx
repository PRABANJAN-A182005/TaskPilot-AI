import { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { User as UserIcon, Bell, Shield, Palette, Loader2, Camera } from 'lucide-react';
import { authService } from '../services/auth.service';
import { User } from '../types';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
    const [user, setUser] = useState<User | null>(null);
    const [name, setName] = useState('');
    const [bio, setBio] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
            setUser(currentUser);
            setName(currentUser.name || '');
            setBio(currentUser.bio || '');
        }
    }, []);

    const handleSave = async () => {
        setIsLoading(true);
        setMessage(null);
        try {
            const updatedUser = await authService.updateProfile({ name, bio });
            setUser(updatedUser);
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            window.dispatchEvent(new Event('user-updated'));
        } catch {
            setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setMessage(null);
        try {
            const { url, key } = await authService.uploadAvatar(file);
            const updatedUser = await authService.updateProfile({ avatar: url, avatarKey: key });
            setUser(updatedUser);
            setMessage({ type: 'success', text: 'Avatar updated successfully!' });
            window.dispatchEvent(new Event('user-updated'));
        } catch {
            setMessage({ type: 'error', text: 'Failed to upload avatar. Please try again.' });
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (
            !window.confirm('Are you sure you want to permanently delete your account? This action cannot be undone.')
        ) {
            return;
        }

        setIsDeleting(true);
        try {
            await authService.deleteAccount();
            navigate('/login');
        } catch {
            alert('Failed to delete account. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    if (!user) return null;

    return (
        <div className='space-y-6 max-w-4xl mx-auto pb-12'>
            <div>
                <h1 className='text-2xl font-bold text-slate-900 sm:text-3xl'>Settings</h1>
                <p className='mt-1 text-slate-500'>Manage your account and platform preferences.</p>
            </div>

            {message && (
                <div
                    className={`p-4 rounded-lg text-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}
                >
                    {message.text}
                </div>
            )}

            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                <div className='lg:col-span-1 space-y-2'>
                    <Button
                        variant='ghost'
                        className='w-full justify-start gap-3 bg-blue-50 text-blue-600'
                    >
                        <UserIcon className='h-4 w-4' /> Account
                    </Button>
                    <Button
                        variant='ghost'
                        className='w-full justify-start gap-3 text-slate-600'
                    >
                        <Bell className='h-4 w-4' /> Notifications
                    </Button>
                    <Button
                        variant='ghost'
                        className='w-full justify-start gap-3 text-slate-600'
                    >
                        <Shield className='h-4 w-4' /> Privacy & Security
                    </Button>
                    <Button
                        variant='ghost'
                        className='w-full justify-start gap-3 text-slate-600'
                    >
                        <Palette className='h-4 w-4' /> Appearance
                    </Button>
                </div>

                <div className='lg:col-span-2 space-y-6'>
                    <Card>
                        <CardHeader>
                            <h3 className='font-bold text-slate-900'>Profile Information</h3>
                        </CardHeader>
                        <CardContent className='space-y-4'>
                            <div className='flex items-center gap-4 mb-6'>
                                <div className='relative group'>
                                    <div className='h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-2xl font-bold border-4 border-white shadow-md overflow-hidden uppercase'>
                                        {user.avatar ? (
                                            <img
                                                src={user.avatar}
                                                alt={name}
                                                className='h-full w-full object-cover'
                                            />
                                        ) : (
                                            name.substring(0, 2) || user.email.substring(0, 2)
                                        )}
                                    </div>
                                    {isUploading && (
                                        <div className='absolute inset-0 bg-white/60 flex items-center justify-center rounded-full'>
                                            <Loader2 className='h-6 w-6 animate-spin text-blue-600' />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <input
                                        type='file'
                                        ref={fileInputRef}
                                        className='hidden'
                                        accept='image/*'
                                        onChange={handleAvatarChange}
                                    />
                                    <Button
                                        variant='outline'
                                        size='sm'
                                        className='gap-2'
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isUploading}
                                    >
                                        <Camera className='h-4 w-4' />
                                        {isUploading ? 'Uploading...' : 'Change Avatar'}
                                    </Button>
                                    <p className='mt-1.5 text-[11px] text-slate-500'>
                                        JPG, GIF or PNG. Max size of 2MB.
                                    </p>
                                </div>
                            </div>
                            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                                <Input
                                    label='Full Name'
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                />
                                <Input
                                    label='Email'
                                    value={user.email}
                                    disabled
                                    className='bg-slate-50 cursor-not-allowed'
                                />
                            </div>
                            <div className='space-y-1.5'>
                                <label className='text-sm font-medium text-slate-700'>Bio</label>
                                <textarea
                                    className='flex w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 min-h-[100px]'
                                    value={bio}
                                    onChange={e => setBio(e.target.value)}
                                    placeholder='Tell us about yourself...'
                                />
                            </div>
                            <div className='flex justify-end pt-4'>
                                <Button
                                    onClick={handleSave}
                                    disabled={isLoading || isUploading}
                                >
                                    {isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                                    Save Changes
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className='border-rose-100'>
                        <CardHeader className='bg-rose-50/50'>
                            <h3 className='font-bold text-rose-700'>Danger Zone</h3>
                        </CardHeader>
                        <CardContent className='p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                            <div>
                                <p className='font-bold text-slate-900'>Delete Account</p>
                                <p className='text-sm text-slate-500'>
                                    Permanently delete your account and all associated data.
                                </p>
                            </div>
                            <Button
                                variant='danger'
                                onClick={handleDeleteAccount}
                                disabled={isDeleting}
                            >
                                {isDeleting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                                Delete Account
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
