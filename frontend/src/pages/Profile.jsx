import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
    User as UserIcon,
    Mail,
    Shield,
    Flame,
    Zap,
    CheckCircle2,
    AlertCircle,
    Lock,
    Eye,
    EyeOff,
    Calendar,
    Edit3,
    Save,
    X,
} from 'lucide-react';
import { getMyProfile, updateMyProfile, changeMyPassword } from '../api/profile.api';
import useAuthStore from '../store/authStore';
import { ROLES } from '../utils/constants';
import { formatDate } from '../utils/formatters';
import Card from '../components/ui/Card';
import Avatar from '../components/ui/Avatar';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Textarea from '../components/common/Textarea';
import Badge from '../components/common/Badge';

/* ─── Schemas ─────────────────────────────────────── */
const profileSchema = z.object({
    fullName: z
        .string()
        .min(2, 'Name must be at least 2 characters')
        .max(150, 'Name is too long'),
    displayName: z.string().max(100, 'Display name is too long').optional().or(z.literal('')),
    bio: z.string().max(1000, 'Bio is too long').optional().or(z.literal('')),
    profilePictureUrl: z.string().max(2048).optional().or(z.literal('')),
});

const passwordSchema = z
    .object({
        currentPassword: z.string().min(1, 'Current password is required'),
        newPassword: z.string().min(8, 'New password must be at least 8 characters'),
        confirmPassword: z.string().min(1, 'Please confirm your new password'),
    })
    .refine((d) => d.newPassword === d.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    });

/* ─── Stat tile ───────────────────────────────────── */
function StatTile({ icon: Icon, label, value, tone = 'primary' }) {
    const toneMap = {
        primary: { bg: 'var(--color-block-blue)', accent: 'var(--color-primary)' },
        warning: { bg: 'var(--color-block-amber)', accent: 'var(--color-warning)' },
        success: { bg: 'var(--color-block-green)', accent: 'var(--color-success)' },
    };
    const t = toneMap[tone] ?? toneMap.primary;
    return (
        <div
            className="rounded-2xl border-2 border-[var(--color-border)] shadow-[3px_3px_0_var(--color-border)] p-4 flex items-center gap-3"
            style={{ background: t.bg }}
        >
            <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border-2 border-[var(--color-border)]"
                style={{ background: 'var(--color-bg-card)', color: t.accent }}
            >
                <Icon size={18} aria-hidden="true" />
            </div>
            <div className="min-w-0">
                <div className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
                    {label}
                </div>
                <div className="text-lg font-extrabold text-[var(--color-text-primary)]">
                    {value}
                </div>
            </div>
        </div>
    );
}

/* ─── Profile page ────────────────────────────────── */
export default function Profile() {
    const navigate = useNavigate(); // used by the admin-tools "Go to Settings" button
    const queryClient = useQueryClient();
    const { user: storeUser, setAuth, accessToken } = useAuthStore();

    const { data: response, isLoading } = useQuery({
        queryKey: ['my-profile'],
        queryFn: getMyProfile,
        staleTime: 30_000,
    });
    const profile = response?.data;
    const isAdmin = profile?.role === ROLES.ADMIN || profile?.role === ROLES.SUPER_ADMIN;

    /* ── Profile form ── */
    const [editing, setEditing] = useState(false);
    const [showPw, setShowPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(profileSchema),
        defaultValues: { fullName: '', displayName: '', bio: '', profilePictureUrl: '' },
    });

    useEffect(() => {
        if (profile) {
            reset({
                fullName: profile.fullName ?? '',
                displayName: profile.displayName ?? '',
                bio: profile.bio ?? '',
                profilePictureUrl: profile.profilePictureUrl ?? '',
            });
        }
    }, [profile, reset]);

    const updateMut = useMutation({
        mutationFn: (payload) => updateMyProfile(payload),
        onSuccess: (data) => {
            toast.success('Profile updated');
            setEditing(false);
            queryClient.invalidateQueries({ queryKey: ['my-profile'] });
            // Keep authStore in sync so the avatar/name update in the nav bar immediately
            const updated = data?.data;
            if (updated) {
                setAuth(
                    { ...storeUser, fullName: updated.fullName, email: updated.email, role: updated.role },
                    accessToken,
                    localStorage.getItem('refreshToken')
                );
            }
        },
        onError: (err) =>
            toast.error(err.response?.data?.message || 'Failed to update profile'),
    });

    const onSaveProfile = (values) => {
        updateMut.mutate({
            fullName: values.fullName,
            displayName: values.displayName || '',
            bio: values.bio || '',
            profilePictureUrl: values.profilePictureUrl || '',
        });
    };

    /* ── Password form ── */
    const {
        register: registerPw,
        handleSubmit: handleSubmitPw,
        reset: resetPw,
        formState: { errors: pwErrors },
    } = useForm({ resolver: zodResolver(passwordSchema) });

    const pwMut = useMutation({
        mutationFn: (payload) => changeMyPassword(payload),
        onSuccess: () => {
            toast.success('Password updated');
            resetPw();
        },
        onError: (err) =>
            toast.error(err.response?.data?.message || 'Failed to change password'),
    });

    const onChangePw = (values) => {
        pwMut.mutate({
            currentPassword: values.currentPassword,
            newPassword: values.newPassword,
        });
    };

    /* ── Render ── */
    if (isLoading || !profile) {
        return (
            <div className="space-y-6">
                <div className="skeleton h-32 rounded-[20px]" />
                <div className="skeleton h-64 rounded-[20px]" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* ── Header card ── */}
            <Card padding="lg" shadow="md" className="bg-[var(--color-bg-card)]">
                <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                    <Avatar
                        src={profile.profilePictureUrl || undefined}
                        name={profile.fullName}
                        size="xl"
                        decorative={false}
                    />
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text-primary)] truncate">
                                {profile.fullName}
                            </h1>
                            <Badge variant={isAdmin ? 'primary' : 'info'} dot>
                                {profile.role.replace('_', ' ')}
                            </Badge>
                            {profile.isEmailVerified && (
                                <Badge variant="success" dot>
                                    Verified
                                </Badge>
                            )}
                        </div>
                        {profile.displayName && (
                            <p className="text-sm text-[var(--color-text-secondary)] mb-1">
                                @{profile.displayName}
                            </p>
                        )}
                        <p className="text-sm text-[var(--color-text-secondary)] inline-flex items-center gap-1.5">
                            <Mail size={14} aria-hidden="true" />
                            {profile.email}
                        </p>
                        {profile.createdAt && (
                            <p className="text-xs text-[var(--color-text-muted)] mt-2 inline-flex items-center gap-1.5">
                                <Calendar size={12} aria-hidden="true" />
                                Joined {formatDate(profile.createdAt)}
                            </p>
                        )}
                    </div>
                </div>

                {profile.bio && (
                    <div className="mt-5 pt-5 border-t border-[var(--color-border-soft)]">
                        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap">
                            {profile.bio}
                        </p>
                    </div>
                )}
            </Card>

            {/* ── Student stats — only if STUDENT ── */}
            {!isAdmin && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <StatTile icon={Flame} label="XP" value={profile.xpPoints ?? 0} tone="warning" />
                    <StatTile
                        icon={Zap}
                        label="Streak"
                        value={`${profile.streakDays ?? 0} day${(profile.streakDays ?? 0) === 1 ? '' : 's'}`}
                        tone="primary"
                    />
                    <StatTile
                        icon={CheckCircle2}
                        label="Status"
                        value={profile.isEmailVerified ? 'Verified' : 'Unverified'}
                        tone="success"
                    />
                </div>
            )}

            {/* ── Edit profile form ── */}
            <Card padding="lg" shadow="sm">
                <div className="flex items-center justify-between mb-5 pb-3 border-b border-[var(--color-border-soft)]">
                    <h2 className="text-base font-extrabold text-[var(--color-text-primary)] inline-flex items-center gap-2">
                        <UserIcon size={18} aria-hidden="true" />
                        Profile details
                    </h2>
                    {!editing ? (
                        <Button
                            variant="outline"
                            size="sm"
                            icon={<Edit3 size={14} />}
                            onClick={() => setEditing(true)}
                        >
                            Edit
                        </Button>
                    ) : (
                        <Button
                            variant="ghost"
                            size="sm"
                            icon={<X size={14} />}
                            onClick={() => {
                                setEditing(false);
                                reset({
                                    fullName: profile.fullName ?? '',
                                    displayName: profile.displayName ?? '',
                                    bio: profile.bio ?? '',
                                    profilePictureUrl: profile.profilePictureUrl ?? '',
                                });
                            }}
                        >
                            Cancel
                        </Button>
                    )}
                </div>

                <form onSubmit={handleSubmit(onSaveProfile)} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                        <Input
                            label="Full name"
                            name="fullName"
                            register={register('fullName')}
                            error={errors.fullName?.message}
                            disabled={!editing}
                            required
                        />
                        <Input
                            label="Display name"
                            name="displayName"
                            register={register('displayName')}
                            error={errors.displayName?.message}
                            disabled={!editing}
                            hint="Optional — short handle shown next to your name"
                        />
                    </div>
                    <Input
                        label="Profile picture URL"
                        name="profilePictureUrl"
                        type="url"
                        register={register('profilePictureUrl')}
                        error={errors.profilePictureUrl?.message}
                        disabled={!editing}
                        hint="Paste a link to a square avatar image"
                    />
                    <Textarea
                        label="Bio"
                        name="bio"
                        rows={4}
                        register={register('bio')}
                        error={errors.bio?.message}
                        disabled={!editing}
                        hint="A short introduction shown on your profile"
                    />
                    {editing && (
                        <div className="flex flex-wrap gap-3 pt-2">
                            <Button
                                type="submit"
                                icon={<Save size={14} />}
                                loading={updateMut.isPending}
                            >
                                Save changes
                            </Button>
                        </div>
                    )}
                </form>
            </Card>

            {/* ── Change password ── */}
            <Card padding="lg" shadow="sm">
                <h2 className="text-base font-extrabold text-[var(--color-text-primary)] inline-flex items-center gap-2 mb-5 pb-3 border-b border-[var(--color-border-soft)]">
                    <Lock size={18} aria-hidden="true" />
                    Change password
                </h2>

                <form onSubmit={handleSubmitPw(onChangePw)} className="space-y-4 max-w-md">
                    <Input
                        label="Current password"
                        name="currentPassword"
                        type={showPw ? 'text' : 'password'}
                        register={registerPw('currentPassword')}
                        error={pwErrors.currentPassword?.message}
                        suffixIcon={
                            <button
                                type="button"
                                onClick={() => setShowPw((p) => !p)}
                                aria-label={showPw ? 'Hide password' : 'Show password'}
                                aria-pressed={showPw}
                                className="cursor-pointer text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] p-0.5 -mr-0.5"
                            >
                                {showPw ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                            </button>
                        }
                    />
                    <Input
                        label="New password"
                        name="newPassword"
                        type={showNewPw ? 'text' : 'password'}
                        register={registerPw('newPassword')}
                        error={pwErrors.newPassword?.message}
                        hint="At least 8 characters"
                        suffixIcon={
                            <button
                                type="button"
                                onClick={() => setShowNewPw((p) => !p)}
                                aria-label={showNewPw ? 'Hide password' : 'Show password'}
                                aria-pressed={showNewPw}
                                className="cursor-pointer text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] p-0.5 -mr-0.5"
                            >
                                {showNewPw ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                            </button>
                        }
                    />
                    <Input
                        label="Confirm new password"
                        name="confirmPassword"
                        type={showNewPw ? 'text' : 'password'}
                        register={registerPw('confirmPassword')}
                        error={pwErrors.confirmPassword?.message}
                    />
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                        <Button
                            type="submit"
                            icon={<Lock size={14} />}
                            loading={pwMut.isPending}
                        >
                            Update password
                        </Button>
                        <span className="text-xs text-[var(--color-text-muted)] inline-flex items-center gap-1.5">
                            <Shield size={12} aria-hidden="true" />
                            Sessions remain valid; you won't be logged out.
                        </span>
                    </div>
                </form>
            </Card>

            {/* ── Admin info ── */}
            {isAdmin && (
                <Card padding="lg" shadow="sm" className="bg-[var(--color-block-cream)]">
                    <h2 className="text-base font-extrabold text-[var(--color-text-primary)] inline-flex items-center gap-2 mb-3">
                        <AlertCircle size={18} aria-hidden="true" />
                        Admin tools
                    </h2>
                    <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                        Manage platform settings, categories, and tags from the Settings page.
                    </p>
                    <Button variant="outline" size="sm" onClick={() => navigate('/admin/settings')}>
                        Go to Settings
                    </Button>
                </Card>
            )}
        </div>
    );
}
