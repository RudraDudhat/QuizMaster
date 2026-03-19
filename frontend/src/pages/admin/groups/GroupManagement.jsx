import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
    Search, Plus, Users, MoreVertical, Edit3, Trash2,
    UserPlus, UserMinus, X, Check, AlertTriangle,
} from 'lucide-react';

import {
    getAllGroups,
    createGroup,
    updateGroup,
    deleteGroup,
    getGroupMembers,
    addMembers,
    removeMember,
} from '../../../api/group.api';
import { getAllStudents } from '../../../api/student.api';
import { formatDate } from '../../../utils/formatters';

import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Textarea from '../../../components/common/Textarea';
import Modal from '../../../components/common/Modal';
import Pagination from '../../../components/common/Pagination';
import EmptyState from '../../../components/common/EmptyState';

import Card from '../../../components/ui/Card';
import Dropdown from '../../../components/ui/Dropdown';
import Avatar from '../../../components/ui/Avatar';

const groupSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(150, 'Name must be at most 150 characters'),
    description: z
        .string()
        .max(500, 'Description must be at most 500 characters')
        .optional()
        .or(z.literal('')),
});

function hashToIndex(str, mod) {
    let hash = 0;
    for (let i = 0; i < (str || '').length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return Math.abs(hash) % mod;
}

function GroupInitial({ name, size = 'md' }) {
    const colors = [
        'bg-indigo-500', 'bg-rose-500', 'bg-amber-500', 'bg-teal-500',
        'bg-violet-500', 'bg-cyan-500', 'bg-emerald-500', 'bg-pink-500',
    ];
    const idx = hashToIndex(name, colors.length);
    const initial = (name || '?').trim()?.[0]?.toUpperCase?.() ?? '?';
    const sizeCls = {
        sm: 'w-9 h-9 text-sm',
        md: 'w-11 h-11 text-base',
        lg: 'w-14 h-14 text-lg',
    }[size] || 'w-11 h-11 text-base';

    return (
        <div className={`${sizeCls} rounded-full flex items-center justify-center text-white font-bold shadow-sm ${colors[idx]}`}>
            {initial}
        </div>
    );
}

function Skeleton({ className = '' }) {
    return <div className={`skeleton ${className}`} />;
}

export default function GroupManagement() {
    const [page, setPage] = useState(0);
    const [search, setSearch] = useState('');
    const [selectedGroup, setSelectedGroup] = useState(null);

    const [groupModal, setGroupModal] = useState({ mode: null, group: null });
    const [deleteModal, setDeleteModal] = useState({ open: false, groupUuid: null, groupName: '' });
    const [addMemberModal, setAddMemberModal] = useState(false);

    const [memberSearch, setMemberSearch] = useState('');
    const [studentSearch, setStudentSearch] = useState('');
    const [debouncedStudentSearch, setDebouncedStudentSearch] = useState('');
    const [selectedStudents, setSelectedStudents] = useState([]);

    const [confirmRemoveUserUuid, setConfirmRemoveUserUuid] = useState(null);

    useEffect(() => {
        const t = setTimeout(() => setDebouncedStudentSearch(studentSearch), 300);
        return () => clearTimeout(t);
    }, [studentSearch]);

    const { data: response, isLoading, refetch } = useQuery({
        queryKey: ['admin-groups', page],
        queryFn: () => getAllGroups({ page, size: 12 }),
        staleTime: 30_000,
        keepPreviousData: true,
    });
    const groups = response?.data?.content ?? [];
    const totalPages = response?.data?.totalPages ?? 0;
    const totalElements = response?.data?.totalElements ?? 0;

    const filteredGroups = useMemo(() => {
        if (!search) return groups;
        const q = search.toLowerCase();
        return groups.filter((g) => g?.name?.toLowerCase?.().includes(q));
    }, [groups, search]);

    const {
        data: membersResponse,
        isLoading: membersLoading,
        refetch: refetchMembers,
    } = useQuery({
        queryKey: ['group-members', selectedGroup?.uuid],
        queryFn: () => getGroupMembers(selectedGroup.uuid),
        enabled: !!selectedGroup,
        staleTime: 30_000,
    });
    const members = membersResponse?.data ?? [];

    const filteredMembers = useMemo(() => {
        if (!memberSearch) return members;
        const q = memberSearch.toLowerCase();
        return members.filter((m) => (
            m?.fullName?.toLowerCase?.().includes(q) ||
            m?.email?.toLowerCase?.().includes(q)
        ));
    }, [members, memberSearch]);

    const { data: studentsResponse, isLoading: studentsLoading } = useQuery({
        queryKey: ['admin-students-search', debouncedStudentSearch],
        queryFn: () => getAllStudents({ page: 0, size: 20, keyword: debouncedStudentSearch }),
        enabled: addMemberModal,
        staleTime: 30_000,
    });
    const allStudents = studentsResponse?.data?.content ?? [];

    const availableStudents = useMemo(() => {
        return allStudents.filter((s) => !members.some((m) => m?.userUuid === s?.uuid));
    }, [allStudents, members]);

    const createMut = useMutation({
        mutationFn: (payload) => createGroup(payload),
        onSuccess: () => {
            toast.success('Group created successfully!');
            refetch();
            setGroupModal({ mode: null, group: null });
        },
        onError: (error) => toast.error(error.response?.data?.message || 'Failed to create group'),
    });

    const updateMut = useMutation({
        mutationFn: ({ groupUuid, payload }) => updateGroup(groupUuid, payload),
        onSuccess: (_result, vars) => {
            toast.success('Group updated!');
            refetch();
            setGroupModal({ mode: null, group: null });
            if (selectedGroup?.uuid === vars.groupUuid) {
                setSelectedGroup((prev) => prev ? ({ ...prev, ...vars.payload }) : prev);
            }
        },
        onError: (error) => toast.error(error.response?.data?.message || 'Failed to update group'),
    });

    const deleteMut = useMutation({
        mutationFn: (groupUuid) => deleteGroup(groupUuid),
        onSuccess: (_result, groupUuid) => {
            toast.success('Group deleted');
            refetch();
            setDeleteModal({ open: false, groupUuid: null, groupName: '' });
            if (selectedGroup?.uuid === groupUuid) setSelectedGroup(null);
        },
        onError: () => toast.error('Failed to delete group'),
    });

    const addMembersMut = useMutation({
        mutationFn: () => addMembers(selectedGroup.uuid, { userUuids: selectedStudents.map((s) => s.uuid) }),
        onSuccess: (result) => {
            const { addedCount, skippedCount, notFoundUuids, invalidRoleUuids } = result?.data ?? {};
            toast.success(`${addedCount ?? 0} member(s) added!`);
            if ((skippedCount ?? 0) > 0) toast(`${skippedCount} already in group, skipped`, { icon: 'ℹ️' });
            if ((invalidRoleUuids?.length ?? 0) > 0) toast.error(`${invalidRoleUuids.length} user(s) are not students, skipped`);
            if ((notFoundUuids?.length ?? 0) > 0) toast.error(`${notFoundUuids.length} user(s) not found, skipped`);
            refetchMembers();
            refetch();
            setAddMemberModal(false);
            setSelectedStudents([]);
            setStudentSearch('');
        },
        onError: () => toast.error('Failed to add members'),
    });

    const removeMemberMut = useMutation({
        mutationFn: (userUuid) => removeMember(selectedGroup.uuid, userUuid),
        onSuccess: () => {
            toast.success('Member removed');
            setConfirmRemoveUserUuid(null);
            refetchMembers();
            refetch();
        },
        onError: () => toast.error('Failed to remove member'),
    });

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(groupSchema),
        defaultValues: { name: '', description: '' },
    });

    useEffect(() => {
        if (groupModal.mode !== 'edit') {
            reset({ name: '', description: '' });
            return;
        }
        reset({
            name: groupModal.group?.name ?? '',
            description: groupModal.group?.description ?? '',
        });
    }, [groupModal.mode, groupModal.group, reset]);

    function openGroup(group) {
        setSelectedGroup(group);
        setConfirmRemoveUserUuid(null);
        setMemberSearch('');
    }

    function actionsForGroup(group) {
        return [
            {
                label: 'Edit',
                icon: <Edit3 size={14} />,
                onClick: () => setGroupModal({ mode: 'edit', group }),
            },
            { divider: true },
            {
                label: 'Delete',
                icon: <Trash2 size={14} />,
                danger: true,
                onClick: () => setDeleteModal({ open: true, groupUuid: group.uuid, groupName: group.name }),
            },
        ];
    }

    const isMobileDrawer = !!selectedGroup;

    const membersPanel = (
        <Card padding="sm" className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 p-2 sm:p-3">
                <div className="flex items-center gap-3 min-w-0">
                    <GroupInitial name={selectedGroup?.name} size="md" />
                    <div className="min-w-0">
                        <h2 className="text-lg font-bold text-gray-900 truncate">{selectedGroup?.name}</h2>
                        <p className="text-xs text-gray-500 mt-0.5">{members?.length ?? 0} members</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                        size="sm"
                        icon={<UserPlus size={16} />}
                        onClick={() => setAddMemberModal(true)}
                    >
                        Add Members
                    </Button>
                    <button
                        onClick={() => setSelectedGroup(null)}
                        className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                        aria-label="Close"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="px-2 sm:px-3 pb-3">
                <Input
                    name="memberSearch"
                    placeholder="Search members..."
                    prefixIcon={<Search size={16} />}
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                />
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-2 sm:px-3 pb-3">
                {membersLoading ? (
                    <div className="space-y-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center justify-between gap-3 py-3">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <Skeleton className="w-8 h-8 rounded-full" />
                                    <div className="min-w-0 flex-1 space-y-2">
                                        <Skeleton className="h-3 w-40 rounded-lg" />
                                        <Skeleton className="h-2.5 w-56 rounded-lg" />
                                    </div>
                                </div>
                                <Skeleton className="h-7 w-20 rounded-lg" />
                            </div>
                        ))}
                    </div>
                ) : members.length === 0 ? (
                    <div className="py-6">
                        <EmptyState
                            icon={<UserPlus size={48} />}
                            title="No members yet"
                            description="Add students to this group"
                            action={{ label: 'Add Members', onClick: () => setAddMemberModal(true) }}
                        />
                    </div>
                ) : filteredMembers.length === 0 && memberSearch ? (
                    <div className="py-6">
                        <EmptyState
                            icon={<Search size={48} />}
                            title="No members found"
                            description="Try a different search term"
                        />
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {filteredMembers.map((m) => {
                            const confirming = confirmRemoveUserUuid === m.userUuid;
                            return (
                                <div key={m.userUuid} className="py-3 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <Avatar name={m.fullName} size="sm" />
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 truncate">{m.fullName}</p>
                                            <p className="text-xs text-gray-500 truncate">{m.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <p className="text-[11px] text-gray-400 whitespace-nowrap hidden sm:block">
                                            Joined {formatDate(m.joinedAt)}
                                        </p>
                                        {confirming ? (
                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    onClick={() => removeMemberMut.mutate(m.userUuid)}
                                                    disabled={removeMemberMut.isPending}
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                                                    title="Confirm remove"
                                                    aria-label="Confirm remove"
                                                >
                                                    <Check size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setConfirmRemoveUserUuid(null)}
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                                                    title="Cancel"
                                                    aria-label="Cancel"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setConfirmRemoveUserUuid(m.userUuid)}
                                                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                title="Remove from group"
                                                aria-label="Remove from group"
                                            >
                                                <UserMinus size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </Card>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Groups</h1>
                    <p className="text-sm text-gray-500 mt-0.5">{totalElements} groups total</p>
                </div>
                <Button icon={<Plus size={16} />} onClick={() => setGroupModal({ mode: 'create', group: null })}>
                    Create Group
                </Button>
            </div>

            <div className="grid lg:grid-cols-[55%_45%] gap-6 items-stretch">
                {/* Left panel */}
                <Card padding="sm" className="h-full flex flex-col">
                    <div className="p-2 sm:p-3">
                        <Input
                            name="search"
                            placeholder="Search groups..."
                            prefixIcon={<Search size={16} />}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="flex-1 px-2 sm:px-3 pb-3">
                        {isLoading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="border border-gray-200 rounded-xl p-4 bg-white">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <Skeleton className="w-10 h-10 rounded-full" />
                                                <div className="min-w-0 space-y-2">
                                                    <Skeleton className="h-3 w-28 rounded-lg" />
                                                    <Skeleton className="h-2.5 w-40 rounded-lg" />
                                                </div>
                                            </div>
                                            <Skeleton className="w-8 h-8 rounded-lg" />
                                        </div>
                                        <div className="mt-3 space-y-2">
                                            <Skeleton className="h-2.5 w-full rounded-lg" />
                                            <Skeleton className="h-2.5 w-4/5 rounded-lg" />
                                        </div>
                                        <div className="mt-4 flex items-center justify-between">
                                            <Skeleton className="h-2.5 w-24 rounded-lg" />
                                            <Skeleton className="h-2.5 w-20 rounded-lg" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : filteredGroups.length === 0 && groups.length === 0 ? (
                            <div className="py-6">
                                <EmptyState
                                    icon={<Users size={48} />}
                                    title="No groups yet"
                                    description="Create your first group to organize students"
                                    action={{ label: 'Create Group', onClick: () => setGroupModal({ mode: 'create', group: null }) }}
                                />
                            </div>
                        ) : filteredGroups.length === 0 && search ? (
                            <div className="py-6">
                                <EmptyState
                                    icon={<Search size={48} />}
                                    title="No groups found"
                                    description="Try a different search term"
                                />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {filteredGroups.map((g) => {
                                    const selected = selectedGroup?.uuid === g.uuid;
                                    return (
                                        <div
                                            key={g.uuid}
                                            onClick={() => openGroup(g)}
                                            className={`
                                                group border rounded-xl p-4 bg-white cursor-pointer transition-all
                                                ${selected ? 'border-primary bg-primary/5 shadow-sm' : 'border-gray-200 hover:shadow-md hover:-translate-y-0.5'}
                                            `}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <GroupInitial name={g.name} size="sm" />
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-gray-900 truncate">{g.name}</p>
                                                    </div>
                                                </div>
                                                <div
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="flex-shrink-0"
                                                >
                                                    <Dropdown
                                                        trigger={
                                                            <button className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                                                                <MoreVertical size={16} />
                                                            </button>
                                                        }
                                                        items={actionsForGroup(g)}
                                                    />
                                                </div>
                                            </div>

                                            <div className="mt-3">
                                                {g.description ? (
                                                    <p className="text-sm text-gray-600 line-clamp-2">{g.description}</p>
                                                ) : (
                                                    <p className="text-sm text-gray-400 italic">No description</p>
                                                )}
                                            </div>

                                            <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                                                <span className="flex items-center gap-1.5">
                                                    <span aria-hidden>👥</span> {g.memberCount} members
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <span aria-hidden>📅</span> {formatDate(g.createdAt)}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="px-3 pb-3 pt-1">
                        <Pagination
                            currentPage={page}
                            totalPages={totalPages}
                            totalElements={totalElements}
                            onPageChange={(p) => setPage(p)}
                        />
                    </div>
                </Card>

                {/* Right panel (desktop/tablet) */}
                <div className="hidden md:block">
                    {selectedGroup ? membersPanel : (
                        <Card padding="lg" className="h-full">
                            <EmptyState
                                icon={<Users size={48} />}
                                title="Select a group"
                                description="Pick a group from the left to view and manage members"
                            />
                        </Card>
                    )}
                </div>
            </div>

            {/* Mobile drawer */}
            <div className="md:hidden">
                <div
                    className={`fixed inset-0 z-40 transition-opacity duration-300 ${isMobileDrawer ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                    style={{ background: 'rgba(0,0,0,0.45)' }}
                    onClick={() => setSelectedGroup(null)}
                />
                <div
                    className={`fixed inset-y-0 right-0 z-50 w-full max-w-[520px] bg-transparent transition-transform duration-300 ease-out ${isMobileDrawer ? 'translate-x-0' : 'translate-x-full'}`}
                >
                    <div className="h-full p-4">
                        {selectedGroup ? membersPanel : null}
                    </div>
                </div>
            </div>

            {/* Create/Edit Modal */}
            <Modal
                isOpen={groupModal.mode === 'create' || groupModal.mode === 'edit'}
                onClose={() => setGroupModal({ mode: null, group: null })}
                title={groupModal.mode === 'create' ? 'Create Group' : 'Edit Group'}
                size="sm"
                footer={(
                    <>
                        <Button variant="outline" onClick={() => setGroupModal({ mode: null, group: null })}>
                            Cancel
                        </Button>
                        <Button
                            loading={createMut.isPending || updateMut.isPending}
                            onClick={handleSubmit((values) => {
                                const payload = { name: values.name, description: values.description || '' };
                                if (groupModal.mode === 'create') {
                                    createMut.mutate(payload);
                                } else {
                                    updateMut.mutate({ groupUuid: groupModal.group?.uuid, payload });
                                }
                            })}
                        >
                            Save
                        </Button>
                    </>
                )}
            >
                <div className="space-y-4">
                    <Input
                        label="Group Name"
                        required
                        name="name"
                        placeholder="e.g. JavaScript Class 2026"
                        prefixIcon={<Users size={16} />}
                        register={register('name')}
                        error={errors?.name?.message}
                    />
                    <Textarea
                        label="Description"
                        name="description"
                        rows={3}
                        placeholder="Describe this group (optional)"
                        register={register('description')}
                        error={errors?.description?.message}
                    />
                </div>
            </Modal>

            {/* Add Members Modal */}
            <Modal
                isOpen={addMemberModal}
                onClose={() => {
                    setAddMemberModal(false);
                    setSelectedStudents([]);
                    setStudentSearch('');
                }}
                title={`Add Members to ${selectedGroup?.name ?? ''}`}
                size="md"
                footer={(
                    <>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setAddMemberModal(false);
                                setSelectedStudents([]);
                                setStudentSearch('');
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            disabled={selectedStudents.length === 0}
                            loading={addMembersMut.isPending}
                            onClick={() => addMembersMut.mutate()}
                        >
                            Add {selectedStudents.length} Member(s)
                        </Button>
                    </>
                )}
            >
                <div className="space-y-5">
                    <Input
                        name="studentSearch"
                        placeholder="Search students by name or email..."
                        prefixIcon={<Search size={16} />}
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                    />

                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                        <div className="max-h-[240px] overflow-y-auto divide-y divide-gray-100 bg-white">
                            {studentsLoading ? (
                                <div className="p-3 space-y-3">
                                    {Array.from({ length: 4 }).map((_, i) => (
                                        <div key={i} className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                <Skeleton className="w-8 h-8 rounded-full" />
                                                <div className="min-w-0 flex-1 space-y-2">
                                                    <Skeleton className="h-3 w-40 rounded-lg" />
                                                    <Skeleton className="h-2.5 w-56 rounded-lg" />
                                                </div>
                                            </div>
                                            <Skeleton className="h-8 w-20 rounded-lg" />
                                        </div>
                                    ))}
                                </div>
                            ) : availableStudents.length === 0 ? (
                                <div className="py-10 text-center text-sm text-gray-500">
                                    {debouncedStudentSearch ? 'No students found' : 'Type to search for students'}
                                </div>
                            ) : (
                                availableStudents.map((s) => {
                                    const isSelected = selectedStudents.some((x) => x.uuid === s.uuid);
                                    return (
                                        <div key={s.uuid} className="p-3 flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <Avatar name={s.fullName} size="sm" />
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 truncate">{s.fullName}</p>
                                                    <p className="text-xs text-gray-500 truncate">{s.email}</p>
                                                </div>
                                            </div>
                                            {isSelected ? (
                                                <button
                                                    onClick={() => setSelectedStudents((prev) => prev.filter((x) => x.uuid !== s.uuid))}
                                                    className="px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                                                >
                                                    ✓ Selected
                                                </button>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    onClick={() => setSelectedStudents((prev) => ([
                                                        ...prev,
                                                        { uuid: s.uuid, fullName: s.fullName, email: s.email },
                                                    ]))}
                                                >
                                                    Add
                                                </Button>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {selectedStudents.length > 0 && (
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                            <p className="text-sm font-semibold text-gray-900 mb-3">
                                Adding {selectedStudents.length} student(s):
                            </p>
                            <div className="flex gap-2 overflow-x-auto pb-1">
                                {selectedStudents.map((s) => (
                                    <div
                                        key={s.uuid}
                                        className="flex items-center gap-2 px-3 py-2 rounded-full bg-white border border-gray-200 shadow-sm whitespace-nowrap"
                                    >
                                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[11px] font-bold">
                                            {(s.fullName || '?')[0]?.toUpperCase?.() ?? '?'}
                                        </span>
                                        <span className="text-xs font-semibold text-gray-800">{s.fullName}</span>
                                        <button
                                            onClick={() => setSelectedStudents((prev) => prev.filter((x) => x.uuid !== s.uuid))}
                                            className="w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                                            aria-label="Remove"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </Modal>

            {/* Delete confirmation modal */}
            <Modal
                isOpen={deleteModal.open}
                onClose={() => setDeleteModal({ open: false, groupUuid: null, groupName: '' })}
                title="Delete Group"
                size="sm"
                footer={(
                    <>
                        <Button variant="outline" onClick={() => setDeleteModal({ open: false, groupUuid: null, groupName: '' })}>
                            Cancel
                        </Button>
                        <Button
                            variant="danger"
                            loading={deleteMut.isPending}
                            onClick={() => deleteMut.mutate(deleteModal.groupUuid)}
                        >
                            Delete
                        </Button>
                    </>
                )}
            >
                <div className="text-center">
                    <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
                        <AlertTriangle size={24} className="text-red-500" />
                    </div>
                    <p className="text-sm text-gray-600 mb-2">Are you sure you want to delete:</p>
                    <p className="font-semibold text-gray-900 mb-3">{deleteModal.groupName}</p>
                    <p className="text-xs text-gray-400">
                        All {selectedGroup?.uuid === deleteModal.groupUuid ? (members?.length ?? 0) : 'the'} members will be removed from this group. This cannot be undone.
                    </p>
                </div>
            </Modal>
        </div>
    );
}
