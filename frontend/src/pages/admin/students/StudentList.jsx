import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MoreVertical, Search, UserCheck, UserX, Users } from 'lucide-react';

import { getAllStudents, suspendStudent } from '../../../api/student.api';
import { formatDate, formatPercentage } from '../../../utils/formatters';

import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Select from '../../../components/common/Select';
import Textarea from '../../../components/common/Textarea';
import Modal from '../../../components/common/Modal';
import EmptyState from '../../../components/common/EmptyState';
import Pagination from '../../../components/common/Pagination';

import Card from '../../../components/ui/Card';
import Table from '../../../components/ui/Table';
import Dropdown from '../../../components/ui/Dropdown';
import Avatar from '../../../components/ui/Avatar';
import Badge from '../../../components/common/Badge';

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

export default function StudentList() {
    const navigate = useNavigate();

    const [page, setPage] = useState(0);
    const [keyword, setKeyword] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [suspendModal, setSuspendModal] = useState({
        open: false,
        userUuid: null,
        fullName: '',
        isActive: true,
    });

    const [searchInput, setSearchInput] = useState('');
    const [reason, setReason] = useState('');

    useEffect(() => {
        const t = setTimeout(() => {
            setPage(0);
            setKeyword(searchInput);
        }, 400);
        return () => clearTimeout(t);
    }, [searchInput]);

    useEffect(() => {
        if (!suspendModal.open) {
            setReason('');
        }
    }, [suspendModal.open]);

    const { data: response, isLoading, refetch } = useQuery({
        queryKey: ['admin-students', page, keyword],
        queryFn: () => getAllStudents({ page, size: 20, keyword }),
        staleTime: 30_000,
        keepPreviousData: true,
    });

    const students = response?.data?.content ?? [];
    const totalPages = response?.data?.totalPages ?? 0;
    const totalElements = response?.data?.totalElements ?? 0;

    const filteredStudents = useMemo(() => {
        if (!statusFilter) return students;
        return students.filter((s) =>
            statusFilter === 'active' ? s?.isActive === true : s?.isActive === false
        );
    }, [students, statusFilter]);

    const activeCount = useMemo(
        () => students.filter((s) => s?.isActive === true).length,
        [students]
    );
    const suspendedCount = useMemo(
        () => students.filter((s) => s?.isActive === false).length,
        [students]
    );

    const statusMutation = useMutation({
        mutationFn: ({ userUuid, payload }) => suspendStudent(userUuid, payload),
        onSuccess: (result) => {
            toast.success(
                result?.data?.isActive
                    ? `${result?.data?.fullName} reinstated successfully`
                    : `${result?.data?.fullName} suspended successfully`
            );
            refetch();
            setSuspendModal({ open: false, userUuid: null, fullName: '', isActive: true });
        },
        onError: (error) => {
            toast.error(error?.response?.data?.message || 'Failed to update student status');
        },
    });

    const columns = useMemo(
        () => [
            {
                key: 'student',
                label: 'Student',
                render: (student) => {
                    if (student?.__skeleton) {
                        return (
                            <div className="flex items-center gap-3">
                                <div className="skeleton h-8 w-8 rounded-full" />
                                <div className="min-w-0 flex-1">
                                    <div className="skeleton h-4 w-40 rounded" />
                                    <div className="mt-1.5 skeleton h-3 w-52 rounded" />
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div
                            onClick={() => navigate(`/admin/students/${student?.uuid}`)}
                            className="flex items-center gap-3 min-w-0 cursor-pointer"
                        >
                            <Avatar name={student?.fullName} size="sm" />
                            <div className="min-w-0">
                                <div className="font-semibold text-gray-900 truncate">
                                    {student?.fullName}
                                </div>
                                <div className="text-xs text-gray-500 truncate">{student?.email}</div>
                            </div>
                        </div>
                    );
                },
            },
            {
                key: 'status',
                label: 'Status',
                width: '140px',
                render: (student) => {
                    if (student?.__skeleton) return <div className="skeleton h-6 w-24 rounded-full mx-auto" />;
                    return student?.isActive ? (
                        <Badge variant="success">Active</Badge>
                    ) : (
                        <Badge variant="danger">Suspended</Badge>
                    );
                },
            },
            {
                key: 'progress',
                label: 'Progress',
                width: '170px',
                render: (student) => {
                    if (student?.__skeleton) return <div className="skeleton h-10 w-32 rounded" />;
                    return (
                        <div className="space-y-1">
                            <div className="text-sm font-semibold text-gray-900">
                                🔥 {student?.xpPoints ?? 0} XP
                            </div>
                            <div className="text-xs text-gray-500">⚡ {student?.streakDays ?? 0} day streak</div>
                        </div>
                    );
                },
            },
            {
                key: 'attempts',
                label: 'Attempts',
                align: 'center',
                width: '120px',
                render: (student) => {
                    if (student?.__skeleton) return <div className="skeleton h-8 w-16 rounded mx-auto" />;
                    return (
                        <div className="text-center">
                            <div className="font-semibold text-gray-900">{student?.totalAttempts ?? 0}</div>
                            <div className="text-xs text-gray-500">attempts</div>
                        </div>
                    );
                },
            },
            {
                key: 'avgScore',
                label: 'Avg Score',
                width: '160px',
                render: (student) => {
                    if (student?.__skeleton) return <div className="skeleton h-10 w-32 rounded" />;
                    return (
                        <div className="min-w-[140px]">
                            <div className="text-sm font-semibold text-gray-900">
                                {formatPercentage(student?.averageScore ?? 0)}
                            </div>
                            <MiniBar value={student?.averageScore ?? 0} />
                        </div>
                    );
                },
            },
            {
                key: 'passRate',
                label: 'Pass Rate',
                width: '160px',
                render: (student) => {
                    if (student?.__skeleton) return <div className="skeleton h-10 w-32 rounded" />;
                    return (
                        <div className="min-w-[140px]">
                            <div className="text-sm font-semibold text-gray-900">
                                {formatPercentage(student?.passRate ?? 0)}
                            </div>
                            <MiniBar value={student?.passRate ?? 0} />
                        </div>
                    );
                },
            },
            {
                key: 'joined',
                label: 'Joined',
                width: '200px',
                render: (student) => {
                    if (student?.__skeleton) return <div className="skeleton h-10 w-44 rounded" />;
                    const lastLogin = student?.lastLoginAt ? formatDate(student?.lastLoginAt) : 'Never logged in';
                    return (
                        <div>
                            <div className="text-sm font-medium text-gray-900">{formatDate(student?.createdAt)}</div>
                            <div className="text-xs text-gray-500 mt-0.5">Last login: {lastLogin}</div>
                        </div>
                    );
                },
            },
            {
                key: 'actions',
                label: 'Actions',
                align: 'right',
                width: '84px',
                render: (student) => {
                    if (student?.__skeleton) return <div className="skeleton h-8 w-10 rounded ml-auto" />;
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
                                        label: 'View Profile',
                                        onClick: () => navigate(`/admin/students/${student?.uuid}`),
                                    },
                                    { divider: true },
                                    student?.isActive
                                        ? {
                                              label: 'Suspend',
                                              danger: true,
                                              icon: <UserX size={16} />,
                                              onClick: () =>
                                                  setSuspendModal({
                                                      open: true,
                                                      userUuid: student?.uuid,
                                                      fullName: student?.fullName ?? '',
                                                      isActive: true,
                                                  }),
                                          }
                                        : {
                                              label: 'Reinstate',
                                              icon: <UserCheck size={16} />,
                                              onClick: () =>
                                                  setSuspendModal({
                                                      open: true,
                                                      userUuid: student?.uuid,
                                                      fullName: student?.fullName ?? '',
                                                      isActive: false,
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

    const showClear = Boolean((keyword || searchInput) || statusFilter);

    const tableData = useMemo(() => {
        if (isLoading) {
            return Array.from({ length: 10 }).map((_, i) => ({ uuid: `sk-${i}`, __skeleton: true }));
        }
        return filteredStudents;
    }, [isLoading, filteredStudents]);

    const modalTitle = suspendModal?.isActive ? 'Suspend Student' : 'Reinstate Student';
    const modalIcon = suspendModal?.isActive ? (
        <UserX size={44} className="text-red-500" />
    ) : (
        <UserCheck size={44} className="text-emerald-600" />
    );

    return (
        <div className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Students</h1>
                    <p className="text-sm text-gray-500 mt-1">{totalElements} students registered</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm shadow-sm">
                        <span className="text-emerald-600">✅</span>
                        <span className="font-semibold text-gray-900">Active:</span>
                        <span className="text-gray-600 font-medium">{activeCount}</span>
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm shadow-sm">
                        <span className="text-red-500">🚫</span>
                        <span className="font-semibold text-gray-900">Suspended:</span>
                        <span className="text-gray-600 font-medium">{suspendedCount}</span>
                    </span>
                </div>
            </div>

            <Card padding="md" className="bg-white">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end w-full">
                        <div className="w-full sm:max-w-md">
                            <Input
                                name="student-search"
                                placeholder="Search by name or email..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                prefixIcon={<Search size={16} />}
                            />
                        </div>

                        <div className="w-full sm:max-w-xs">
                            <Select
                                name="student-status"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                options={[
                                    { value: '', label: 'All Students' },
                                    { value: 'active', label: '✅ Active' },
                                    { value: 'suspended', label: '🚫 Suspended' },
                                ]}
                            />
                        </div>

                        {showClear && (
                            <div className="sm:ml-auto">
                                <Button
                                    variant="ghost"
                                    size="md"
                                    onClick={() => {
                                        setSearchInput('');
                                        setKeyword('');
                                        setStatusFilter('');
                                        setPage(0);
                                    }}
                                >
                                    Clear
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </Card>

            <Card padding="md" className="bg-white">
                {!isLoading && filteredStudents.length === 0 ? (
                    <EmptyState
                        icon={<Users size={48} />}
                        title="No students found"
                        description="No students match your search criteria"
                    />
                ) : (
                    <div className="w-full overflow-x-auto">
                        <Table columns={columns} data={tableData} loading={false} />
                    </div>
                )}

                <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    totalElements={totalElements}
                    onPageChange={(p) => setPage(p)}
                />
            </Card>

            <Modal
                isOpen={suspendModal.open}
                onClose={() => setSuspendModal({ open: false, userUuid: null, fullName: '', isActive: true })}
                title={modalTitle}
                size="sm"
                footer={
                    <>
                        <Button
                            variant="outline"
                            onClick={() => setSuspendModal({ open: false, userUuid: null, fullName: '', isActive: true })}
                        >
                            Cancel
                        </Button>
                        {suspendModal?.isActive ? (
                            <Button
                                variant="danger"
                                loading={statusMutation.isPending}
                                onClick={() =>
                                    statusMutation.mutate({
                                        userUuid: suspendModal?.userUuid,
                                        payload: { isActive: false, reason: reason || undefined },
                                    })
                                }
                            >
                                Suspend
                            </Button>
                        ) : (
                            <Button
                                variant="primary"
                                loading={statusMutation.isPending}
                                onClick={() =>
                                    statusMutation.mutate({
                                        userUuid: suspendModal?.userUuid,
                                        payload: { isActive: true, reason: null },
                                    })
                                }
                            >
                                Reinstate
                            </Button>
                        )}
                    </>
                }
            >
                <div className="flex flex-col items-center text-center gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                        {modalIcon}
                    </div>

                    {suspendModal?.isActive ? (
                        <div className="space-y-2">
                            <p className="text-sm text-gray-700">
                                Are you sure you want to suspend:
                            </p>
                            <p className="text-base font-bold text-gray-900">{suspendModal?.fullName}</p>
                            <p className="text-sm text-gray-500">
                                They will lose access immediately and all active sessions will be terminated.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <p className="text-base font-semibold text-gray-900">Reinstate this student?</p>
                            <p className="text-base font-bold text-gray-900">{suspendModal?.fullName}</p>
                            <p className="text-sm text-gray-500">
                                They will regain full access to the platform.
                            </p>
                        </div>
                    )}

                    {suspendModal?.isActive && (
                        <div className="w-full pt-2">
                            <Textarea
                                name="suspend-reason"
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
