import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Mail, BookOpen, CheckCircle2, MailCheck, ArrowLeft } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { forgotPassword } from '../../api/auth.api';
import { ROLES } from '../../utils/constants';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

const schema = z.object({
    email: z.string().min(1, 'Email is required').email('Enter a valid email'),
});

export default function ForgotPassword() {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [sentEmail, setSentEmail] = useState('');
    const [resending, setResending] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({ resolver: zodResolver(schema), mode: 'onTouched' });

    useEffect(() => {
        if (isAuthenticated) {
            const r = user?.role;
            if (r === ROLES.ADMIN || r === ROLES.SUPER_ADMIN) navigate('/admin/dashboard', { replace: true });
            else navigate('/student/dashboard', { replace: true });
        }
    }, [isAuthenticated, user, navigate]);

    /* resend cooldown timer */
    useEffect(() => {
        if (cooldown <= 0) return;
        const t = setInterval(() => setCooldown((c) => c - 1), 1000);
        return () => clearInterval(t);
    }, [cooldown]);

    const onSubmit = async (values) => {
        setLoading(true);
        try {
            await forgotPassword({ email: values.email });
        } catch (err) {
            if (!err.response) {
                toast.error('Network error. Please check your connection.');
                setLoading(false);
                return;
            }
        }
        setSentEmail(values.email);
        setSubmitted(true);
        setLoading(false);
    };

    const handleResend = useCallback(async () => {
        setResending(true);
        try {
            await forgotPassword({ email: sentEmail });
            toast.success('Reset link resent!');
            setCooldown(30);
        } catch (err) {
            if (!err.response) toast.error('Network error. Please check your connection.');
            else setCooldown(30);
        } finally {
            setResending(false);
        }
    }, [sentEmail]);

    return (
        <div className="min-h-screen flex">
            {/* Left decorative panel */}
            <div className="hidden md:flex md:w-[40%] bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-hover)] flex-col items-center justify-center p-10 text-[var(--color-text-inverse)] relative overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, var(--color-text-inverse) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                <div className="relative z-10 text-center max-w-xs">
                    <div className="w-16 h-16 rounded-2xl bg-[color:var(--color-text-inverse)]/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-6">
                        <BookOpen size={32} className="text-[var(--color-text-inverse)]" />
                    </div>
                    <h2 className="text-3xl font-bold mb-2">QuizMaster Pro</h2>
                    <p className="text-[color:var(--color-text-inverse)]/80 mb-8">We'll help you get back in.</p>
                    <div className="space-y-3 text-left">
                        {['Reset link sent instantly', 'Secure one-time token', 'Back to learning in minutes'].map((t) => (
                            <div key={t} className="flex items-center gap-2.5 text-sm text-[color:var(--color-text-inverse)]/80">
                                <CheckCircle2 size={16} className="text-[var(--color-success)] flex-shrink-0" />
                                <span>{t}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right form panel */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-[var(--color-bg-card)]">
                <div className="w-full max-w-[420px]">
                    {/* Mobile logo */}
                    <div className="flex items-center gap-2 mb-8 md:hidden">
                        <div className="w-9 h-9 rounded-lg bg-[var(--color-primary)] flex items-center justify-center">
                            <BookOpen size={20} className="text-[var(--color-text-inverse)]" />
                        </div>
                        <span className="text-lg font-bold">QuizMaster <span className="text-[var(--color-primary)]">Pro</span></span>
                    </div>

                    {/* ─── STATE A: Form ─── */}
                    <div
                        className="transition-all duration-300"
                        style={{
                            opacity: submitted ? 0 : 1,
                            transform: submitted ? 'translateY(-10px)' : 'translateY(0)',
                            position: submitted ? 'absolute' : 'relative',
                            pointerEvents: submitted ? 'none' : 'auto',
                        }}
                    >
                        <div className="animate-[fadeSlide_0.4s_ease_forwards]">
                            <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-1">Forgot Password?</h1>
                            <p className="text-[var(--color-text-secondary)] text-sm mb-8">
                                Enter your registered email address and we'll send you a reset link.
                            </p>

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
                                <Button type="submit" fullWidth loading={loading}>
                                    Send Reset Link
                                </Button>
                            </form>

                            <p className="text-center text-sm text-[var(--color-text-secondary)] mt-8">
                                <Link to="/login" className="text-[var(--color-primary)] font-semibold hover:underline inline-flex items-center gap-1">
                                    <ArrowLeft size={14} /> Back to Sign In
                                </Link>
                            </p>
                        </div>
                    </div>

                    {/* ─── STATE B: Confirmation ─── */}
                    {submitted && (
                        <div className="animate-[fadeSlide_0.4s_ease_forwards]">
                            <div className="text-center">
                                <div className="w-20 h-20 rounded-full bg-[var(--color-success-soft)] flex items-center justify-center mx-auto mb-6">
                                    <MailCheck size={36} className="text-[var(--color-success)]" />
                                </div>
                                <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">Check Your Email</h1>
                                <p className="text-[var(--color-text-secondary)] text-sm mb-1">We sent a password reset link to:</p>
                                <p className="text-sm font-semibold text-[var(--color-text-primary)] bg-[var(--color-bg-soft)] rounded-lg px-4 py-2 inline-block mb-4">
                                    {sentEmail}
                                </p>
                                <p className="text-xs text-[var(--color-text-muted)] mb-8">
                                    The link will expire in 15 minutes. If you don't see it, check your spam folder.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <Button fullWidth onClick={() => window.open('mailto:', '_blank')}>
                                    Open Email App
                                </Button>
                                <Button
                                    variant="outline"
                                    fullWidth
                                    loading={resending}
                                    disabled={cooldown > 0}
                                    onClick={handleResend}
                                >
                                    {cooldown > 0 ? `Resend in ${cooldown}s...` : 'Resend Email'}
                                </Button>
                            </div>

                            <p className="text-center text-sm text-[var(--color-text-secondary)] mt-8">
                                <Link to="/login" className="text-[var(--color-primary)] font-semibold hover:underline inline-flex items-center gap-1">
                                    <ArrowLeft size={14} /> Back to Sign In
                                </Link>
                            </p>
                        </div>
                    )}
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
