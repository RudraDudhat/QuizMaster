import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff, User, BookOpen, CheckCircle2 } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { register as registerApi } from '../../api/auth.api';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

const schema = z
    .object({
        fullName: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long').transform((v) => v.trim()),
        email: z.string().min(1, 'Email is required').email('Enter a valid email'),
        password: z
            .string()
            .min(8, 'Password must be at least 8 characters')
            .regex(/[A-Z]/, 'Must contain at least 1 uppercase letter')
            .regex(/[0-9]/, 'Must contain at least 1 number'),
        confirmPassword: z.string().min(1, 'Please confirm your password'),
    })
    .refine((d) => d.password === d.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    });

/* password‑strength helpers */
const criteria = [
    { test: (p) => p.length >= 8, label: '8+ characters' },
    { test: (p) => /[A-Z]/.test(p), label: 'Uppercase letter' },
    { test: (p) => /[0-9]/.test(p), label: 'Number' },
    { test: (p) => /[!@#$%^&*]/.test(p), label: 'Special character' },
];
const strengthMeta = [
    { label: 'Weak', color: 'bg-red-500', text: 'text-red-500' },
    { label: 'Weak', color: 'bg-red-500', text: 'text-red-500' },
    { label: 'Fair', color: 'bg-amber-500', text: 'text-amber-500' },
    { label: 'Good', color: 'bg-blue-500', text: 'text-blue-500' },
    { label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-500' },
];

function PasswordStrength({ password = '' }) {
    const met = criteria.filter((c) => c.test(password)).length;
    if (!password) return null;
    const meta = strengthMeta[met];
    return (
        <div className="mt-2.5 space-y-1.5">
            <div className="flex gap-1">
                {[0, 1, 2, 3].map((i) => (
                    <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors duration-200 ${i < met ? meta.color : 'bg-gray-200'}`} />
                ))}
            </div>
            <p className={`text-xs font-medium ${meta.text}`}>Password strength: {meta.label}</p>
        </div>
    );
}

export default function Register() {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuthStore();
    const [showPw, setShowPw] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm({ resolver: zodResolver(schema), mode: 'onTouched' });

    const watchedPw = watch('password', '');

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
            await registerApi({ fullName: values.fullName, email: values.email, password: values.password });
            toast.success('Account created! Please sign in.');
            navigate('/login');
        } catch (err) {
            const status = err.response?.status;
            if (status === 409) toast.error('An account with this email already exists');
            else if (status === 400) toast.error(err.response?.data?.message || 'Registration failed');
            else toast.error('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left decorative panel */}
            <div className="hidden md:flex md:w-[40%] bg-gradient-to-br from-primary to-indigo-700 flex-col items-center justify-center p-10 text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                <div className="relative z-10 text-center max-w-xs">
                    <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-6">
                        <BookOpen size={32} className="text-white" />
                    </div>
                    <h2 className="text-3xl font-bold mb-2">QuizMaster Pro</h2>
                    <p className="text-indigo-200 mb-8">Join thousands of educators and students.</p>
                    <div className="space-y-3 text-left">
                        {['Free to get started', '10 powerful question types', 'Real-time analytics and reports'].map((t) => (
                            <div key={t} className="flex items-center gap-2.5 text-sm text-indigo-100">
                                <CheckCircle2 size={16} className="text-emerald-300 flex-shrink-0" />
                                <span>{t}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right form panel */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-white overflow-y-auto">
                <div className="w-full max-w-[420px] animate-[fadeSlide_0.4s_ease_forwards]">
                    {/* Mobile logo */}
                    <div className="flex items-center gap-2 mb-8 md:hidden">
                        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                            <BookOpen size={20} className="text-white" />
                        </div>
                        <span className="text-lg font-bold">QuizMaster <span className="text-primary">Pro</span></span>
                    </div>

                    <h1 className="text-2xl font-bold text-gray-900 mb-1">Create Your Account</h1>
                    <p className="text-gray-500 text-sm mb-8">Join QuizMaster Pro for free today</p>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <Input
                            label="Full Name"
                            name="fullName"
                            placeholder="John Smith"
                            prefixIcon={<User size={18} />}
                            register={register('fullName')}
                            error={errors.fullName?.message}
                        />

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
                                placeholder="Create a password (min 8 characters)"
                                prefixIcon={<Lock size={18} />}
                                suffixIcon={
                                    <button type="button" tabIndex={-1} onClick={() => setShowPw((p) => !p)} className="cursor-pointer text-gray-400 hover:text-gray-600">
                                        {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                }
                                register={register('password')}
                                error={errors.password?.message}
                            />
                            <PasswordStrength password={watchedPw} />
                        </div>

                        <Input
                            label="Confirm Password"
                            name="confirmPassword"
                            type={showConfirm ? 'text' : 'password'}
                            placeholder="Repeat your password"
                            prefixIcon={<Lock size={18} />}
                            suffixIcon={
                                <button type="button" tabIndex={-1} onClick={() => setShowConfirm((p) => !p)} className="cursor-pointer text-gray-400 hover:text-gray-600">
                                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            }
                            register={register('confirmPassword')}
                            error={errors.confirmPassword?.message}
                        />

                        <Button type="submit" fullWidth loading={loading}>
                            Create Account
                        </Button>
                    </form>

                    <p className="text-center text-sm text-gray-500 mt-8">
                        Already have an account?{' '}
                        <Link to="/login" className="text-primary font-semibold hover:underline">
                            Sign in
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
