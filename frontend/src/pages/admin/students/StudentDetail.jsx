import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    ArrowLeft,
    CheckCircle,
    ClipboardList,
    MoreVertical,
    RotateCcw,
    TrendingUp,
    UserCheck,
    UserX,
    Users,
    Zap,
} from 'lucide-react';

import { getStudentDetail, resetAttempts, suspendStudent } from '../../../api/student.api';
import {
    formatDate,
    formatDateTime,
    formatDuration,
    formatPercentage,
    formatScore,
    getStatusColor,
    truncateText,
} from '../../../utils/formatters';

import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import Card from '../../../components/ui/Card';
import Tabs from '../../../components/ui/Tabs';
import Table from '../../../components/ui/Table';
import Dropdown from '../../../components/ui/Dropdown';
import Avatar from '../../../components/ui/Avatar';
import EmptyState from '../../../components/common/EmptyState';
import Modal from '../../../components/common/Modal';
import Textarea from '../../../components/common/Textarea';

function statusToBarColor(value) {
    const v = Number(value ?? 0);
    if (v >= 70) return 'bg-emerald-500';
    if (v >= 50) return 'bg-amber-500';
    return 'bg-red-500';
}

function MiniBar({ value }) {
    const v = Math.max(0, Math.min(100, Number(value ?? 0)));
    return (
        <div className="mt-1.5 h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
            <div
                className={`h-full rounded-full ${statusToBarColor(v)} transition-[width] duration-300`}
                style={{ width: `${v}%` }}
            />
        </div>
    );
}

function Skeleton({ className = '' }) {
    return <div className={`skeleton ${className}`} />;
}

function hashToIndex(str, mod) {
    let hash = 0;
    for (let i = 0; i < (str || '').length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return Math.abs(hash) % mod;
}

function GroupInitial({ name }) {
    const colors = [
        'bg-indigo-500',
        'bg-rose-500',
        'bg-amber-500',
        'bg-teal-500',
        'bg-violet-500',
        'bg-cyan-500',
        'bg-emerald-500',
        'bg-pink-500',
    ];
    const idx = hashToIndex(name, colors.length);
    const initial = (name || '?').trim()?.[0]?.toUpperCase?.() ?? '?';
    return (
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm ${colors[idx]}`}>
            {initial}
        </div>
    );
}

export default function StudentDetail() {
    const navigate = useNavigate();
    const { userUuid } = useParams();

    const [resetModal, setResetModal] = useState({ open: false, quizUuid: null, quizTitle: '' });
    const [suspendModal, setSuspendModal] = useState({ open: false });
    const [activeTab, setActiveTab] = useState('attempts');

    const [reason, setReason] = useState('');

    useEffect(() => {
        if (!suspendModal.open) setReason('');
    }, [suspendModal.open]);

    const { data: response, isLoading, isError, refetch } = useQuery({
        queryKey: ['student-detail', userUuid],
        queryFn: () => getStudentDetail(userUuid),
        staleTime: 30_000,
    });

    const student = response?.data;

    const resetMutation = useMutation({
        mutationFn: ({ quizUuid }) => resetAttempts(userUuid, { quizUuid }),
        onSuccess: (result) => {
            toast.success(`${result?.data?.resetCount ?? 0} attempt(s) reset for ${result?.data?.quizTitle ?? ''}`);
            refetch();
            setResetModal({ open: false, quizUuid: null, quizTitle: '' });
        },
        onError: (error) => {
            toast.error(error?.response?.data?.message || 'Failed to reset attempts');
        },
    });

    const statusMutation = useMutation({
        mutationFn: ({ isActive, reason: r }) => suspendStudent(userUuid, { isActive, reason: r }),
        onSuccess: () => {
            toast.success(student?.isActive ? 'Student suspended' : 'Student reinstated');
            refetch();
            setSuspendModal({ open: false });
        },
        onError: () => {
            toast.error('Failed to update student status');
        },
    });

    const tabs = useMemo(
        () => [
            { key: 'attempts', label: 'Recent Attempts', count: student?.recentAttempts?.length ?? 0 },
            { key: 'groups', label: 'Group Memberships', count: student?.groupMemberships?.length ?? 0 },
        ],
        [student?.recentAttempts?.length, student?.groupMemberships?.length]
    );

    const attemptColumns = useMemo(
        () => [
            {
                key: 'quiz',
                label: 'Quiz',
                render: (attempt) => {
                    if (attempt?.__skeleton) return <div className="skeleton h-4 w-52 rounded" />;
                    return (
                        <div
                            onClick={() => navigate(`/admin/quizzes/${attempt?.quizUuid}/questions`)}
                            className="cursor-pointer min-w-[220px]"
                            title={attempt?.quizTitle}
                        >
                            <div className="font-semibold text-gray-900">
                                {truncateText(attempt?.quizTitle ?? '', 40)}
                            </div>
                        </div>
                    );
                },
            },
            {
                key: 'attemptNumber',
                label: 'Attempt #',
                width: '110px',
                render: (attempt) => {
                    if (attempt?.__skeleton) return <div className="skeleton h-4 w-16 rounded mx-auto" />;
                    return <span className="font-medium text-gray-800">#{attempt?.attemptNumber ?? 0}</span>;
                },
            },
            {
                key: 'score',
                label: 'Score',
                width: '130px',
                render: (attempt) => {
                    if (attempt?.__skeleton) return <div className="skeleton h-4 w-20 rounded mx-auto" />;
                    return (
                        <span className="font-semibold text-gray-900">
                            {formatScore(attempt?.marksObtained ?? 0, attempt?.totalMarksPossible ?? 0)}
                        </span>
                    );
                },
            },
            {
                key: 'percentage',
                label: 'Percentage',
                width: '150px',
                render: (attempt) => {
                    if (attempt?.__skeleton) return <div className="skeleton h-10 w-28 rounded" />;
                    return (
                        <div className="min-w-[130px]">
                            <div className="font-semibold text-gray-900">
                                {formatPercentage(attempt?.percentage ?? 0)}
                            </div>
                            <MiniBar value={attempt?.percentage ?? 0} />
                        </div>
                    );
                },
            },
            {
                key: 'result',
                label: 'Result',
                width: '110px',
                render: (attempt) => {
                    if (attempt?.__skeleton) return <div className="skeleton h-6 w-20 rounded-full mx-auto" />;
                    return attempt?.isPassed ? (
                        <Badge variant="success">Passed</Badge>
                    ) : (
                        <Badge variant="danger">Failed</Badge>
                    );
                },
            },
            {
                key: 'status',
                label: 'Status',
                width: '140px',
                render: (attempt) => {
                    if (attempt?.__skeleton) return <div className="skeleton h-6 w-24 rounded-full mx-auto" />;
                    return <Badge variant={getStatusColor(attempt?.status)}>{attempt?.status ?? ''}</Badge>;
                },
            },
            {
                key: 'timeTakenSeconds',
                label: 'Time Taken',
                width: '130px',
                render: (attempt) => {
                    if (attempt?.__skeleton) return <div className="skeleton h-4 w-16 rounded mx-auto" />;
                    return <span className="text-sm text-gray-700">{formatDuration(attempt?.timeTakenSeconds ?? 0)}</span>;
                },
            },
            {
                key: 'submittedAt',
                label: 'Submitted',
                width: '220px',
                render: (attempt) => {
                    if (attempt?.__skeleton) return <div className="skeleton h-4 w-44 rounded" />;
                    if (!attempt?.submittedAt) {
                        return (
                            <div className="text-sm text-gray-700">
                                {formatDateTime(attempt?.startedAt)}{' '}
                                <span className="text-xs text-gray-500">(in progress)</span>
                            </div>
                        );
                    }
                    return <div className="text-sm text-gray-700">{formatDateTime(attempt?.submittedAt)}</div>;
                },
            },
            {
                key: 'actions',
                label: 'Actions',
                align: 'right',
                width: '84px',
                render: (attempt) => {
                    if (attempt?.__skeleton) return <div className="skeleton h-8 w-10 rounded ml-auto" />;
                    return (
                        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                            <Dropdown
                                trigger={
                                    <button
                                        className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-colors shadow-sm"
                                        aria-label="Actions"
                                        type="button"
                                    >
                                        <MoreVertical size={16} />
                                    </button>
                                }
                                items={[
                                    {
                                        label: 'Reset Attempts for this Quiz',
                                        icon: <RotateCcw size={16} />,
                                        onClick: () =>
                                            setResetModal({
                                                open: true,
                                                quizUuid: attempt?.quizUuid,
                                                quizTitle: attempt?.quizTitle ?? '',
                                            }),
                                    },
                                ]}
                            />
                        </div>
                    );
                },
            },
        ],
        [navigate]
    );

    const attempts = student?.recentAttempts ?? [];
    const attemptTableData = useMemo(() => {
        if (isLoading) {
            return Array.from({ length: 5 }).map((_, i) => ({ uuid: `sk-a-${i}`, __skeleton: true }));
        }
        return attempts;
    }, [isLoading, attempts]);

    const groups = student?.groupMemberships ?? [];

    if (isError) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center px-4">
                <Card padding="lg" className="max-w-lg w-full text-center">
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center">
                        <UserX size={40} className="text-red-500" />
                    </div>
                    <h2 className="mt-4 text-xl font-bold text-gray-900">Student not found</h2>
                    <p className="mt-2 text-sm text-gray-500">
                        This student may have been deleted or the link is invalid.
                    </p>
                    <div className="mt-6 flex justify-center">
                        <Button variant="primary" onClick={() => navigate('/admin/students')} icon={<ArrowLeft size={16} />}>
                            Back to Students
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                    <button
                        type="button"
                        onClick={() => navigate('/admin/students')}
                        className="mt-0.5 inline-flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                        aria-label="Back"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        {isLoading ? (
                            <>
                                <Skeleton className="h-7 w-40 rounded" />
                                <Skeleton className="mt-2 h-4 w-56 rounded" />
                            </>
                        ) : (
                            <>
                                <h1 className="text-2xl font-bold text-gray-900">Student Profile</h1>
                                <p className="text-sm text-gray-500 mt-1">{student?.email}</p>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {isLoading ? (
                        <>
                            <Skeleton className="h-7 w-24 rounded-full" />
                            <Skeleton className="h-10 w-40 rounded-lg" />
                        </>
                    ) : (
                        <>
                            {student?.isActive ? (
                                <Badge variant="success">Active</Badge>
                            ) : (
                                <Badge variant="danger">Suspended</Badge>
                            )}

                            {student?.isActive ? (
                                <Button
                                    variant="outline"
                                    className="border-red-200 text-red-600 hover:bg-red-50"
                                    onClick={() => setSuspendModal({ open: true })}
                                    icon={<UserX size={16} />}
                                >
                                    Suspend Student
                                </Button>
                            ) : (
                                <Button
                                    variant="primary"
                                    onClick={() => setSuspendModal({ open: true })}
                                    icon={<UserCheck size={16} />}
                                >
                                    Reinstate Student
                                </Button>
                            )}
                        </>
                    )}
                </div>
            </div>

            <Card padding="lg" className="bg-white">
                {isLoading ? (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <div className="lg:col-span-4">
                            <div className="flex flex-col items-center lg:items-start">
                                <Skeleton className="h-20 w-20 rounded-full" />
                                <Skeleton className="mt-4 h-6 w-56 rounded" />
                                <Skeleton className="mt-2 h-4 w-64 rounded" />
                                <Skeleton className="mt-3 h-4 w-40 rounded" />
                                <Skeleton className="mt-2 h-4 w-48 rounded" />
                            </div>
                        </div>
                        <div className="lg:col-span-8">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <Skeleton key={i} className="h-24 rounded-xl" />
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <div className="lg:col-span-4">
                            <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
                                <Avatar
                                    src={student?.profilePictureUrl}
                                    name={student?.fullName}
                                    size="xl"
                                />
                                <div className="mt-4">
                                    <div className="text-xl font-bold text-gray-900">{student?.fullName}</div>
                                    <div className="text-sm text-gray-500 mt-1">{student?.email}</div>
                                </div>
                                <div className="mt-4 space-y-1 text-sm text-gray-600">
                                    <div>
                                        Joined <span className="font-medium text-gray-800">{formatDate(student?.createdAt)}</span>
                                    </div>
                                    <div>
                                        Last login:{' '}
                                        <span className="font-medium text-gray-800">
                                            {student?.lastLoginAt ? formatDate(student?.lastLoginAt) : 'Never logged in'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-8">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="text-sm text-gray-500">Quiz attempts</div>
                                            <div className="mt-1 text-2xl font-extrabold text-gray-900">
                                                {student?.totalAttempts ?? 0}
                                            </div>
                                        </div>
                                        <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                                            <ClipboardList size={18} />
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <div className="text-sm text-gray-500">Average score</div>
                                            <div className="mt-1 text-2xl font-extrabold text-gray-900">
                                                {formatPercentage(student?.averageScore ?? 0)}
                                            </div>
                                            <MiniBar value={student?.averageScore ?? 0} />
                                        </div>
                                        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                                            <TrendingUp size={18} />
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <div className="text-sm text-gray-500">Pass rate</div>
                                            <div className="mt-1 text-2xl font-extrabold text-gray-900">
                                                {formatPercentage(student?.passRate ?? 0)}
                                            </div>
                                            <MiniBar value={student?.passRate ?? 0} />
                                        </div>
                                        <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                                            <CheckCircle size={18} />
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="text-sm text-gray-500">XP &amp; Streak</div>
                                            <div className="mt-1 text-2xl font-extrabold text-gray-900">
                                                {student?.xpPoints ?? 0} XP
                                            </div>
                                            <div className="mt-1 text-sm text-gray-600">
                                                ⚡ {student?.streakDays ?? 0} day streak
                                            </div>
                                        </div>
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                                            <Zap size={18} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Card>

            <Card padding="md" className="bg-white">
                {isLoading ? (
                    <Skeleton className="h-10 w-80 rounded-lg" />
                ) : (
                    <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pill" />
                )}

                <div className="mt-4">
                    {activeTab === 'attempts' ? (
                        isLoading ? (
                            <div className="w-full overflow-x-auto">
                                <Table columns={attemptColumns} data={attemptTableData} loading={false} />
                            </div>
                        ) : attempts.length === 0 ? (
                            <EmptyState
                                icon={<ClipboardList size={48} />}
                                title="No attempts yet"
                                description="This student hasn't taken any quizzes yet"
                            />
                        ) : (
                            <div className="w-full overflow-x-auto">
                                <Table columns={attemptColumns} data={attemptTableData} loading={false} />
                            </div>
                        )
                    ) : groups.length === 0 ? (
                        <EmptyState
                            icon={<Users size={48} />}
                            title="Not in any group"
                            description="This student hasn't been added to any group yet"
                        />
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {groups.map((g) => (
                                <Card
                                    key={g?.uuid}
                                    padding="md"
                                    hover
                                    onClick={() => navigate('/admin/groups')}
                                    className="group"
                                >
                                    <div className="flex items-start gap-3">
                                        <GroupInitial name={g?.name} />
                                        <div className="min-w-0 flex-1">
                                            <div className="font-bold text-gray-900 truncate">{g?.name}</div>
                                            <div className="mt-1 text-sm text-gray-500 line-clamp-2">
                                                {g?.description || 'No description provided'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                                        <div className="font-medium">👥 {g?.memberCount ?? 0} members</div>
                                        <div className="text-gray-500">📅 {formatDate(g?.createdAt)}</div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </Card>

            <Modal
                isOpen={resetModal.open}
                onClose={() => setResetModal({ open: false, quizUuid: null, quizTitle: '' })}
                title="Reset Quiz Attempts"
                size="sm"
                footer={
                    <>
                        <Button variant="outline" onClick={() => setResetModal({ open: false, quizUuid: null, quizTitle: '' })}>
                            Cancel
                        </Button>
                        <Button
                            variant="danger"
                            loading={resetMutation.isPending}
                            onClick={() => resetMutation.mutate({ quizUuid: resetModal?.quizUuid })}
                        >
                            Reset Attempts
                        </Button>
                    </>
                }
            >
                <div className="flex flex-col items-center text-center gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center">
                        <RotateCcw size={44} className="text-amber-600" />
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm text-gray-700">Reset all attempts for:</p>
                        <p className="text-base font-bold text-gray-900">{resetModal?.quizTitle}</p>
                        <p className="text-sm text-gray-500">Student: {student?.fullName}</p>
                    </div>
                    <div className="mt-1 w-full rounded-xl border border-red-100 bg-red-50 p-4 text-left">
                        <p className="text-sm font-semibold text-red-700">Warning</p>
                        <p className="mt-1 text-sm text-red-600">
                            All attempts for this quiz will be invalidated. The student will be able to retake the quiz
                            from the beginning. This cannot be undone.
                        </p>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={suspendModal.open}
                onClose={() => setSuspendModal({ open: false })}
                title={student?.isActive ? 'Suspend Student' : 'Reinstate Student'}
                size="sm"
                footer={
                    <>
                        <Button variant="outline" onClick={() => setSuspendModal({ open: false })}>
                            Cancel
                        </Button>
                        {student?.isActive ? (
                            <Button
                                variant="danger"
                                loading={statusMutation.isPending}
                                onClick={() => statusMutation.mutate({ isActive: false, reason: reason || undefined })}
                            >
                                Suspend
                            </Button>
                        ) : (
                            <Button
                                variant="primary"
                                loading={statusMutation.isPending}
                                onClick={() => statusMutation.mutate({ isActive: true, reason: null })}
                            >
                                Reinstate
                            </Button>
                        )}
                    </>
                }
            >
                <div className="flex flex-col items-center text-center gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                        {student?.isActive ? (
                            <UserX size={44} className="text-red-500" />
                        ) : (
                            <UserCheck size={44} className="text-emerald-600" />
                        )}
                    </div>

                    {student?.isActive ? (
                        <div className="space-y-2">
                            <p className="text-sm text-gray-700">Are you sure you want to suspend:</p>
                            <p className="text-base font-bold text-gray-900">{student?.fullName}</p>
                            <p className="text-sm text-gray-500">
                                They will lose access immediately and all active sessions will be terminated.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <p className="text-base font-semibold text-gray-900">Reinstate this student?</p>
                            <p className="text-base font-bold text-gray-900">{student?.fullName}</p>
                            <p className="text-sm text-gray-500">They will regain full access to the platform.</p>
                        </div>
                    )}

                    {student?.isActive && (
                        <div className="w-full pt-2">
                            <Textarea
                                name="suspend-reason-detail"
                                rows={2}
                                placeholder="Reason for suspension (optional)"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                            />
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
}
