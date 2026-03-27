import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff, BookOpen, CheckCircle2 } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { login as loginApi } from '../../api/auth.api';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { SparkleIcon } from '../../components/common/Decorations';

const schema = z.object({
    email: z.string().min(1, 'Email is required').email('Enter a valid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function Login() {
    const navigate = useNavigate();
    const { isAuthenticated, user, setAuth } = useAuthStore();
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({ resolver: zodResolver(schema), mode: 'onTouched' });

    useEffect(() => {
        if (isAuthenticated) {
            const r = user?.role;
            if (r === 'ADMIN' || r === 'SUPER_ADMIN') navigate('/admin/dashboard', { replace: true });
            else navigate('/student/dashboard', { replace: true });
        }
    }, [isAuthenticated, user, navigate]);

    const onSubmit = async (values) => {
        setLoading(true);
        try {
            const response = await loginApi({ email: values.email, password: values.password });
            // Backend wraps all responses in ApiResponse<T>, so response.data is the AuthResponse
            const authData = response.data;
            const user = { fullName: authData.fullName, email: authData.email, role: authData.role };
            setAuth(user, authData.accessToken, authData.refreshToken);
            toast.success(`Welcome back, ${authData.fullName}!`);
            const r = authData.role;
            if (r === 'ADMIN' || r === 'SUPER_ADMIN') navigate('/admin/dashboard', { replace: true });
            else navigate('/student/dashboard', { replace: true });
        } catch (err) {
            if (err.response?.status === 401) toast.error('Invalid email or password');
            else toast.error(err.response?.data?.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left decorative panel */}
            <div className="hidden md:flex md:w-[40%] bg-[var(--color-primary)] flex-col items-center justify-center p-10 text-[var(--color-text-inverse)] relative overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, var(--color-text-inverse) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                <SparkleIcon className="absolute top-8 left-8" color="var(--color-accent-yellow)" />
                <SparkleIcon className="absolute bottom-10 right-10" color="var(--color-accent-yellow)" />
                <div className="relative z-10 text-center max-w-xs">
                    <div className="w-16 h-16 rounded-2xl border-2 border-[var(--color-text-inverse)] bg-[color:var(--color-text-inverse)]/20 flex items-center justify-center mx-auto mb-6">
                        <BookOpen size={32} className="text-[var(--color-text-inverse)]" />
                    </div>
                    <h2 className="text-3xl font-extrabold mb-2">Welcome Back!</h2>
                    <p className="text-[color:var(--color-text-inverse)]/80 mb-8">Sign in to pick up where you left off.</p>
                    <div className="space-y-3 text-left">
                        {['Access your quizzes instantly', 'Track your students\' progress', 'View detailed analytics'].map((t) => (
                            <div key={t} className="flex items-center gap-2.5 text-sm text-[color:var(--color-text-inverse)]/90">
                                <CheckCircle2 size={16} className="text-[var(--color-accent-yellow)] flex-shrink-0" />
                                <span>{t}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right form panel */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-[var(--color-bg-card)]">
                <div className="w-full max-w-[420px] animate-[fadeSlide_0.4s_ease_forwards]">
                    {/* Mobile logo */}
                    <div className="flex items-center gap-2 mb-8 md:hidden">
                        <div className="w-9 h-9 rounded-xl bg-[var(--color-primary)] border-2 border-[var(--color-border)] flex items-center justify-center shadow-[2px_2px_0_var(--color-border)]">
                            <BookOpen size={18} className="text-[var(--color-text-inverse)]" />
                        </div>
                        <span className="text-lg font-extrabold">QuizMaster</span>
                    </div>

                    <h1 className="text-3xl font-extrabold text-[var(--color-text-primary)] mb-1">Welcome Back</h1>
                    <p className="text-[var(--color-text-secondary)] text-sm mb-8">Sign in to your account to continue</p>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <Input
                            label="Email"
                            name="email"
                            type="email"
                            placeholder="you@example.com"
                            prefixIcon={<Mail size={18} />}
                            register={register('email')}
                            error={errors.email?.message}
                        />

                        <div>
                            <Input
                                label="Password"
                                name="password"
                                type={showPw ? 'text' : 'password'}
                                placeholder="Enter your password"
                                prefixIcon={<Lock size={18} />}
                                suffixIcon={
                                    <button type="button" tabIndex={-1} onClick={() => setShowPw((p) => !p)} className="cursor-pointer text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]">
                                        {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                }
                                register={register('password')}
                                error={errors.password?.message}
                            />
                            <div className="text-right mt-1.5">
                                <Link to="/forgot-password" className="text-xs text-[var(--color-primary)] hover:underline font-semibold">
                                    Forgot password?
                                </Link>
                            </div>
                        </div>

                        <Button type="submit" fullWidth loading={loading}>
                            Sign In
                        </Button>
                    </form>

                    <p className="text-center text-sm text-[var(--color-text-secondary)] mt-8">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-[var(--color-primary)] font-semibold hover:underline">
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>

            <style>{`
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
        </div>
    );
}
