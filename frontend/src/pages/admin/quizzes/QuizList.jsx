import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
    Search, Plus, BookOpen, MoreVertical, Edit3, Copy,
    Trash2, Eye, Archive, Send, ListChecks, AlertTriangle,
} from 'lucide-react';
import { getAllQuizzes, deleteQuiz, duplicateQuiz, updateQuizStatus } from '../../../api/quiz.api';
import {
    formatDate, formatDuration, formatScore,
    getStatusColor, truncateText,
} from '../../../utils/formatters';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import Input from '../../../components/common/Input';
import Select from '../../../components/common/Select';
import Modal from '../../../components/common/Modal';
import Pagination from '../../../components/common/Pagination';
import EmptyState from '../../../components/common/EmptyState';
import Card from '../../../components/ui/Card';
import Table from '../../../components/ui/Table';
import Dropdown from '../../../components/ui/Dropdown';

/* ─── difficulty colors ─── */
const difficultyVariant = { EASY: 'success', MEDIUM: 'warning', HARD: 'danger' };
const typeVariant = { PRACTICE: 'info', GRADED: 'default', SURVEY: 'warning' };

export default function QuizList() {
    const navigate = useNavigate();

    /* ─── state ─── */
    const [page, setPage] = useState(0);
    const [statusFilter, setStatusFilter] = useState('');
    const [search, setSearch] = useState('');
    const [deleteModal, setDeleteModal] = useState({ open: false, uuid: null, title: '' });

    /* ─── data ─── */
    const { data: response, isLoading, refetch } = useQuery({
        queryKey: ['admin-quizzes', page, statusFilter],
        queryFn: () => getAllQuizzes({ page, size: 20, status: statusFilter || undefined }),
        staleTime: 30_000,
        keepPreviousData: true,
    });

    const quizzes = response?.data?.content ?? [];
    const totalPages = response?.data?.totalPages ?? 0;
    const totalElements = response?.data?.totalElements ?? 0;

    /* ─── client-side search filter ─── */
    const filtered = search
        ? quizzes.filter((q) => q.title.toLowerCase().includes(search.toLowerCase()))
        : quizzes;

    /* ─── mutations ─── */
    const deleteMut = useMutation({
        mutationFn: (uuid) => deleteQuiz(uuid),
        onSuccess: () => {
            toast.success('Quiz deleted successfully');
            setDeleteModal({ open: false, uuid: null, title: '' });
            refetch();
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete quiz'),
    });

    const duplicateMut = useMutation({
        mutationFn: (uuid) => duplicateQuiz(uuid),
        onSuccess: (result) => {
            toast.success('Quiz duplicated successfully');
            navigate('/admin/quizzes/' + result.data.uuid + '/edit');
        },
        onError: () => toast.error('Failed to duplicate quiz'),
    });

    const statusMut = useMutation({
        mutationFn: ({ uuid, status }) => updateQuizStatus(uuid, status),
        onSuccess: () => {
            toast.success('Quiz status updated');
            refetch();
        },
        onError: () => toast.error('Failed to update status'),
    });

    /* ─── dropdown items builder ─── */
    function actionsFor(quiz) {
        const items = [
            { label: 'Edit', icon: <Edit3 size={14} />, onClick: () => navigate(`/admin/quizzes/${quiz.uuid}/edit`) },
            { label: 'Questions', icon: <ListChecks size={14} />, onClick: () => navigate(`/admin/quizzes/${quiz.uuid}/questions`) },
            { label: 'Duplicate', icon: <Copy size={14} />, onClick: () => duplicateMut.mutate(quiz.uuid) },
            { divider: true },
        ];

        if (quiz.status === 'DRAFT') {
            items.push({ label: 'Publish', icon: <Send size={14} />, onClick: () => statusMut.mutate({ uuid: quiz.uuid, status: 'PUBLISHED' }) });
        }
        if (quiz.status === 'PUBLISHED') {
            items.push({ label: 'Archive', icon: <Archive size={14} />, onClick: () => statusMut.mutate({ uuid: quiz.uuid, status: 'ARCHIVED' }) });
        }
        if (quiz.status === 'ARCHIVED') {
            items.push({ label: 'Publish', icon: <Send size={14} />, onClick: () => statusMut.mutate({ uuid: quiz.uuid, status: 'PUBLISHED' }) });
        }

        items.push({ divider: true });
        items.push({
            label: 'Delete', icon: <Trash2 size={14} />, danger: true,
            onClick: () => setDeleteModal({ open: true, uuid: quiz.uuid, title: quiz.title }),
        });

        return items;
    }

    /* ─── table columns ─── */
    const columns = [
        {
            key: 'title', label: 'Title',
            render: (q) => (
                <button
                    onClick={() => navigate(`/admin/quizzes/${q.uuid}/edit`)}
                    className="text-left group"
                >
                    <span className="font-semibold text-gray-900 group-hover:text-primary transition-colors">
                        {truncateText(q.title, 40)}
                    </span>
                    {q.categoryName && (
                        <span className="block text-xs text-gray-400 mt-0.5">{q.categoryName}</span>
                    )}
                    <div className="mt-1 flex flex-wrap gap-1.5">
                        {q.assignedGroups?.length > 0 ? (
                            <>
                                {q.assignedGroups.slice(0, 2).map((g) => (
                                    <span
                                        key={g.uuid}
                                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-100"
                                    >
                                        🔒 {g.name}
                                    </span>
                                ))}
                                {q.assignedGroups.length > 2 && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-100">
                                        +{q.assignedGroups.length - 2} more
                                    </span>
                                )}
                            </>
                        ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                                🌐 Open access
                            </span>
                        )}
                    </div>
                </button>
            ),
        },
        {
            key: 'type', label: 'Type & Difficulty', align: 'center',
            render: (q) => (
                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                    <Badge variant={typeVariant[q.quizType] || 'default'} size="sm">{q.quizType}</Badge>
                    <Badge variant={difficultyVariant[q.difficulty] || 'default'} size="sm">{q.difficulty}</Badge>
                </div>
            ),
        },
        {
            key: 'questionCount', label: 'Questions', align: 'center',
            render: (q) => <span className="text-gray-700">{q.questionCount} questions</span>,
        },
        {
            key: 'marks', label: 'Marks', align: 'center',
            render: (q) => (
                <div className="text-center">
                    <span className="text-gray-700 font-medium">{formatScore('-', q.totalMarks)}</span>
                    <span className="block text-[11px] text-gray-400 mt-0.5">{q.passMarks} to pass</span>
                </div>
            ),
        },
        {
            key: 'timeLimit', label: 'Time Limit', align: 'center',
            render: (q) => (
                <span className="text-gray-600 text-xs">
                    {q.timeLimitSeconds ? formatDuration(q.timeLimitSeconds) : 'No limit'}
                </span>
            ),
        },
        {
            key: 'status', label: 'Status', align: 'center',
            render: (q) => <Badge variant={getStatusColor(q.status)} dot>{q.status}</Badge>,
        },
        {
            key: 'createdAt', label: 'Created', align: 'center',
            render: (q) => <span className="text-xs text-gray-500 whitespace-nowrap">{formatDate(q.createdAt)}</span>,
        },
        {
            key: 'actions', label: '', width: '48px', align: 'center',
            render: (q) => (
                <Dropdown
                    trigger={
                        <button className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                            <MoreVertical size={16} />
                        </button>
                    }
                    items={actionsFor(q)}
                />
            ),
        },
    ];

    /* ─── status filter options ─── */
    const statusOptions = [
        { value: '', label: 'All Statuses' },
        { value: 'DRAFT', label: 'Draft' },
        { value: 'PUBLISHED', label: 'Published' },
        { value: 'ARCHIVED', label: 'Archived' },
        { value: 'SCHEDULED', label: 'Scheduled' },
    ];

    return (
        <div className="space-y-6">
            {/* ─── Header ─── */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quizzes</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {totalElements} {totalElements === 1 ? 'quiz' : 'quizzes'} total
                    </p>
                </div>
                <Button
                    icon={<Plus size={16} />}
                    onClick={() => navigate('/admin/quizzes/create')}
                >
                    Create Quiz
                </Button>
            </div>

            {/* ─── Filters ─── */}
            <Card padding="sm">
                <div className="flex flex-col sm:flex-row gap-3 p-2">
                    <div className="flex-1">
                        <Input
                            name="search"
                            placeholder="Search quizzes..."
                            prefixIcon={<Search size={16} />}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="w-full sm:w-48">
                        <Select
                            name="statusFilter"
                            options={statusOptions}
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setPage(0);
                            }}
                        />
                    </div>
                </div>
            </Card>

            {/* ─── Table ─── */}
            {!isLoading && filtered.length === 0 && quizzes.length === 0 ? (
                <Card padding="lg">
                    <EmptyState
                        icon={<BookOpen size={48} />}
                        title="No quizzes found"
                        description="Create your first quiz to get started"
                        action={{ label: 'Create Quiz', onClick: () => navigate('/admin/quizzes/create') }}
                    />
                </Card>
            ) : (
                <Table
                    columns={columns}
                    data={filtered}
                    loading={isLoading}
                    emptyMessage="No quizzes match your search"
                    emptyIcon={<BookOpen size={40} className="text-gray-300" />}
                />
            )}

            {/* ─── Pagination ─── */}
            <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalElements={totalElements}
                onPageChange={(p) => setPage(p)}
            />

            {/* ─── Delete Modal ─── */}
            <Modal
                isOpen={deleteModal.open}
                onClose={() => setDeleteModal({ open: false, uuid: null, title: '' })}
                title="Delete Quiz"
                size="sm"
                footer={
                    <>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteModal({ open: false, uuid: null, title: '' })}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="danger"
                            loading={deleteMut.isPending}
                            onClick={() => deleteMut.mutate(deleteModal.uuid)}
                        >
                            Delete
                        </Button>
                    </>
                }
            >
                <div className="text-center">
                    <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
                        <AlertTriangle size={24} className="text-red-500" />
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                        Are you sure you want to delete:
                    </p>
                    <p className="font-semibold text-gray-900 mb-3">
                        {deleteModal.title}
                    </p>
                    <p className="text-xs text-gray-400">
                        This action cannot be undone. All questions linked to this quiz will be unlinked.
                    </p>
                </div>
            </Modal>
        </div>
    );
}
