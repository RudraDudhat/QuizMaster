import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { updateQuizSchema, quizFormDefaults } from '../../../schemas/quiz';
import {
    ArrowLeft, Plus, X, Lock, Clock, Shuffle, Eye,
    Calendar, Tag, BookOpen, Zap, Save, Send,
    Archive, AlertCircle, ListChecks, Check,
    Search, ChevronDown,
} from 'lucide-react';
import { getQuizByUuid, updateQuiz, updateQuizStatus } from '../../../api/quiz.api';
import { getAllCategories, createCategory } from '../../../api/category.api';
import { getAllTags, createTag } from '../../../api/tag.api';
import { getAllGroups } from '../../../api/group.api';
import { formatDuration, getStatusColor } from '../../../utils/formatters';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import Input from '../../../components/common/Input';
import Select from '../../../components/common/Select';
import Textarea from '../../../components/common/Textarea';
import Card from '../../../components/ui/Card';

/* Zod schema lives in src/schemas/quiz.js (shared with CreateQuiz) */

/* ─── Toggle switch ─── */
function Toggle({ checked, onChange, label, description }) {
    return (
        <label className="flex items-start gap-3 cursor-pointer group select-none">
            <div className="relative flex-shrink-0 mt-0.5">
                <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                />
                <div className="w-10 h-[22px] rounded-full bg-gray-200 peer-checked:bg-primary transition-colors duration-200" />
                <div className="absolute top-[3px] left-[3px] w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 peer-checked:translate-x-[18px]" />
            </div>
            <div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                    {label}
                </span>
                {description && (
                    <span className="block text-xs text-gray-400 mt-0.5">{description}</span>
                )}
            </div>
        </label>
    );
}

/* ─── Section Heading ─── */
// eslint-disable-next-line no-unused-vars -- `Icon` is the destructured rename used as <Icon /> in JSX
function SectionHeading({ icon: Icon, title, subtitle }) {
    return (
        <div className="flex items-center gap-3 mb-5 pb-3 border-b border-gray-100">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon size={18} className="text-primary" />
            </div>
            <div>
                <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
                {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
            </div>
        </div>
    );
}

/* ─── Skeleton ─── */
function FormSkeleton() {
    return (
        <div className="space-y-6">
            {[1, 2, 3].map((i) => (
                <Card key={i} padding="md">
                    <div className="space-y-4">
                        <div className="skeleton h-5 w-40 rounded" />
                        <div className="skeleton h-10 w-full rounded-lg" />
                        <div className="skeleton h-10 w-full rounded-lg" />
                        <div className="grid grid-cols-2 gap-4">
                            <div className="skeleton h-10 rounded-lg" />
                            <div className="skeleton h-10 rounded-lg" />
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
}

/* ─── helpers ─── */
const difficultyVariant = { EASY: 'success', MEDIUM: 'warning', HARD: 'danger' };
const typeVariant = { PRACTICE: 'info', EXAM: 'default', SURVEY: 'warning' };

function normalizeCategoryName(name) {
    return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

function toLocalDatetime(isoStr) {
    if (!isoStr) return '';
    try {
        const d = new Date(isoStr);
        const offset = d.getTimezoneOffset();
        const local = new Date(d.getTime() - offset * 60000);
        return local.toISOString().slice(0, 16);
    } catch {
        return '';
    }
}

export default function EditQuiz() {
    const navigate = useNavigate();
    const { quizUuid } = useParams();
    const queryClient = useQueryClient();

    /* ─── form ─── */
    const {
        register, handleSubmit, watch, setValue, reset,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(updateQuizSchema),
        defaultValues: quizFormDefaults,
    });

    const watchAll = watch();

    /* ─── tags state ─── */
    const [selectedTagUuids, setSelectedTagUuids] = useState([]);
    const [tagSearch, setTagSearch] = useState('');
    const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
    const [tagSummaryExpanded, setTagSummaryExpanded] = useState(false);

    /* ─── groups state ─── */
    const [selectedGroupUuids, setSelectedGroupUuids] = useState([]);
    const [groupSearch, setGroupSearch] = useState('');
    const [groupDropdownOpen, setGroupDropdownOpen] = useState(false);
    const [groupSummaryExpanded, setGroupSummaryExpanded] = useState(false);

    const groupDropdownRef = useRef(null);
    const tagDropdownRef = useRef(null);

    /* ─── inline category create ─── */
    const [showNewCategory, setShowNewCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

    /* ─── data: quiz ─── */
    const { data: quizResponse, isLoading: quizLoading, isError: quizError, refetch: refetchQuiz } = useQuery({
        queryKey: ['quiz', quizUuid],
        queryFn: () => getQuizByUuid(quizUuid),
        staleTime: 30_000,
    });
    const quiz = quizResponse?.data;

    /* ─── data: categories & tags ─── */
    const { data: catResponse } = useQuery({
        queryKey: ['categories'],
        queryFn: getAllCategories,
        staleTime: 60_000,
    });
    const categories = catResponse?.data ?? [];

    const { data: tagResponse } = useQuery({
        queryKey: ['tags'],
        queryFn: getAllTags,
        staleTime: 60_000,
    });
    const tags = tagResponse?.data ?? [];

    const { data: groupsResponse, isLoading: groupsLoading } = useQuery({
        queryKey: ['groups-all'],
        queryFn: () => getAllGroups({ page: 0, size: 100 }),
        staleTime: 60_000,
    });
    const groups = groupsResponse?.data?.content ?? [];

    const filteredGroups = groups.filter((g) =>
        g.name.toLowerCase().includes(groupSearch.toLowerCase())
    );

    const filteredTags = tags.filter((t) =>
        t.name.toLowerCase().includes(tagSearch.toLowerCase())
    );

    const showCreateTagOption =
        tagSearch.trim().length > 0 &&
        !tags.some(
            (t) => t.name.toLowerCase() === tagSearch.trim().toLowerCase()
        );

    /* ─── pre-fill form once quiz and tags load ─── */
    useEffect(() => {
        if (!quiz) return;
        reset({
            title: quiz.title || '',
            description: quiz.description || '',
            difficulty: quiz.difficulty || '',
            quizType: quiz.quizType || '',
            passMarks: quiz.passMarks ?? '',
            timeLimitSeconds: quiz.timeLimitSeconds ?? '',
            categoryUuid: quiz.categoryUuid ? String(quiz.categoryUuid) : '',
            maxAttempts: quiz.maxAttempts ?? '',
            cooldownHours: quiz.cooldownHours ?? '',
            questionsToServe: quiz.questionsToServe ?? '',
            shuffleQuestions: quiz.shuffleQuestions ?? false,
            shuffleOptions: quiz.shuffleOptions ?? false,
            showCorrectAnswers: quiz.showCorrectAnswers ?? false,
            showLeaderboard: quiz.showLeaderboard ?? false,
            accessCode: quiz.accessCode || '',
            startsAt: toLocalDatetime(quiz.startsAt),
            expiresAt: toLocalDatetime(quiz.expiresAt),
        });
        // Tags in response are names; map to tag UUIDs from fetched tag list
        setSelectedTagUuids(
            quiz.tags
                ? tags.filter((t) => quiz.tags.includes(t.name)).map((t) => t.uuid)
                : []
        );
        setSelectedGroupUuids(quiz.assignedGroups?.map((g) => g.uuid) ?? []);
    }, [quiz, tags, reset]);

    /* ─── mutations ─── */
    const updateMut = useMutation({
        mutationFn: (payload) => updateQuiz(quizUuid, payload),
        onSuccess: () => {
            toast.success('Quiz updated successfully!');
            refetchQuiz();
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to update quiz'),
    });

    const statusMut = useMutation({
        mutationFn: ({ status }) => updateQuizStatus(quizUuid, status),
        onSuccess: () => {
            toast.success('Quiz status updated');
            refetchQuiz();
        },
        onError: () => toast.error('Failed to update status'),
    });

    const createCatMut = useMutation({
        mutationFn: (payload) => createCategory(payload),
        onSuccess: (result) => {
            toast.success('Category created');
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            setValue('categoryUuid', String(result.data.uuid));
            setShowNewCategory(false);
            setNewCategoryName('');
        },
        onError: (err) => {
            if (err?.response?.status === 500) {
                toast.error('Category already exists. Please use a different name.');
                return;
            }
            toast.error(err.response?.data?.message || 'Failed to create category');
        },
    });

    const createTagMut = useMutation({
        mutationFn: (payload) => createTag(payload),
        onSuccess: () => {
            toast.success('Tag created');
            queryClient.invalidateQueries({ queryKey: ['tags'] });
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to create tag'),
    });

    /* ─── submit handler ─── */
    function buildPayload(data) {
        return {
            title: data.title,
            description: data.description || undefined,
            difficulty: data.difficulty,
            quizType: data.quizType,
            passMarks: data.passMarks !== '' ? Number(data.passMarks) : undefined,
            timeLimitSeconds: data.timeLimitSeconds !== '' ? Number(data.timeLimitSeconds) : undefined,
            categoryUuid: data.categoryUuid || undefined,
            tagUuids: selectedTagUuids.length ? selectedTagUuids : undefined,
            maxAttempts: data.maxAttempts !== '' ? Number(data.maxAttempts) : undefined,
            cooldownHours: data.cooldownHours !== '' ? Number(data.cooldownHours) : undefined,
            shuffleQuestions: data.shuffleQuestions,
            showCorrectAnswers: data.showCorrectAnswers,
            accessCode: data.accessCode || undefined,
            groupUuids: selectedGroupUuids,
            startsAt: data.startsAt ? new Date(data.startsAt).toISOString() : null,
            expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString() : null,
        };
    }

    function onSave(data) {
        updateMut.mutate(buildPayload(data));
    }

    /* ─── helpers ─── */
    const timeLimitVal = watchAll.timeLimitSeconds;
    const timeLimitPreview = timeLimitVal && Number(timeLimitVal) >= 60
        ? formatDuration(Number(timeLimitVal))
        : null;

    const selectedCategory = categories.find((c) => String(c.uuid) === watchAll.categoryUuid);

    function hasCategoryNameConflict(name) {
        const normalizedName = normalizeCategoryName(name);
        return categories.some((category) => normalizeCategoryName(category.name) === normalizedName);
    }

    function toggleTag(id) {
        setSelectedTagUuids((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    }

    function handleCreateTag(name) {
        const trimmed = name.trim();
        if (!trimmed) return;
        if (createTagMut.isPending) return;
        const exists = tags.some((t) => t.name.toLowerCase() === trimmed.toLowerCase());
        if (exists) {
            toast.error('Tag already exists. Please use a different name.');
            return;
        }
        createTagMut.mutate(
            { name: trimmed },
            {
                onSuccess: (result) => {
                    setSelectedTagUuids((prev) =>
                        prev.includes(result.data.uuid) ? prev : [...prev, result.data.uuid]
                    );
                    setTagSearch('');
                },
            }
        );
    }

    useEffect(() => {
        function handleClickOutside(e) {
            if (groupDropdownOpen && groupDropdownRef.current && !groupDropdownRef.current.contains(e.target)) {
                setGroupDropdownOpen(false);
                setGroupSearch('');
            }
            if (tagDropdownOpen && tagDropdownRef.current && !tagDropdownRef.current.contains(e.target)) {
                setTagDropdownOpen(false);
                setTagSearch('');
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [groupDropdownOpen, tagDropdownOpen]);

    /* ─── error state ─── */
    if (quizError) {
        return (
            <Card padding="lg" className="text-center py-20">
                <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Quiz not found</h2>
                <p className="text-sm text-gray-500 mb-6">
                    The quiz you're looking for doesn't exist or has been removed.
                </p>
                <Button onClick={() => navigate('/admin/quizzes')}>Back to Quizzes</Button>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* ─── Header ─── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/admin/quizzes')}
                        className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Edit Quiz</h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {quiz?.title || 'Loading...'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 ml-auto flex-wrap">
                    {quiz && (
                        <Badge variant={getStatusColor(quiz.status)} size="md" dot>
                            {quiz.status}
                        </Badge>
                    )}
                    {quiz?.status === 'DRAFT' && (
                        <Button
                            variant="outline"
                            size="sm"
                            icon={<Send size={14} />}
                            loading={statusMut.isPending}
                            onClick={() => statusMut.mutate({ status: 'PUBLISHED' })}
                        >
                            Publish
                        </Button>
                    )}
                    {quiz?.status === 'PUBLISHED' && (
                        <Button
                            variant="outline"
                            size="sm"
                            icon={<Archive size={14} />}
                            loading={statusMut.isPending}
                            onClick={() => statusMut.mutate({ status: 'ARCHIVED' })}
                        >
                            Archive
                        </Button>
                    )}
                    {quiz?.status === 'ARCHIVED' && (
                        <Button
                            variant="outline"
                            size="sm"
                            icon={<Send size={14} />}
                            loading={statusMut.isPending}
                            onClick={() => statusMut.mutate({ status: 'PUBLISHED' })}
                        >
                            Re-publish
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        icon={<ListChecks size={14} />}
                        onClick={() => navigate(`/admin/quizzes/${quizUuid}/questions`)}
                    >
                        Manage Questions
                    </Button>
                    <Button
                        icon={<Save size={16} />}
                        loading={updateMut.isPending}
                        onClick={handleSubmit(onSave)}
                    >
                        Save Changes
                    </Button>
                </div>
            </div>

            {/* ─── Two-column layout ─── */}
            <div className="grid lg:grid-cols-[1fr_380px] gap-6 items-start">
                {/* ─── LEFT: Form ─── */}
                {quizLoading ? (
                    <FormSkeleton />
                ) : (
                    <div className="space-y-6">
                        {/* Section A: Basic Info */}
                        <Card padding="md">
                            <SectionHeading icon={BookOpen} title="Basic Information" subtitle="Title, description, and classification" />

                            <div className="space-y-4">
                                <Input
                                    label="Title"
                                    name="title"
                                    placeholder="e.g. JavaScript Fundamentals Quiz"
                                    register={register('title')}
                                    error={errors.title?.message}
                                    required
                                />

                                <Textarea
                                    label="Description"
                                    name="description"
                                    placeholder="Describe what this quiz covers..."
                                    rows={4}
                                    register={register('description')}
                                    error={errors.description?.message}
                                />

                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <Select
                                            label="Difficulty"
                                            name="difficulty"
                                            placeholder="Select difficulty"
                                            options={[
                                                { value: 'EASY', label: 'Easy' },
                                                { value: 'MEDIUM', label: 'Medium' },
                                                { value: 'HARD', label: 'Hard' },
                                            ]}
                                            register={register('difficulty')}
                                            error={errors.difficulty?.message}
                                            required
                                        />
                                        {watchAll.difficulty && (
                                            <div className="mt-2">
                                                <Badge variant={difficultyVariant[watchAll.difficulty]} size="sm">
                                                    {watchAll.difficulty}
                                                </Badge>
                                            </div>
                                        )}
                                    </div>

                                    <Select
                                        label="Quiz Type"
                                        name="quizType"
                                        placeholder="Select quiz type"
                                        options={[
                                            { value: 'PRACTICE', label: 'Practice (ungraded)' },
                                            { value: 'EXAM', label: 'Exam (graded, marks & pass/fail)' },
                                            { value: 'SURVEY', label: 'Survey (no correct answers)' },
                                        ]}
                                        register={register('quizType')}
                                        error={errors.quizType?.message}
                                        required
                                    />
                                </div>

                                {/* Category */}
                                <div>
                                    <Select
                                        label="Category"
                                        name="categoryUuid"
                                        placeholder="Select a category"
                                        options={categories.map((c) => ({ value: String(c.uuid), label: c.name }))}
                                        register={register('categoryUuid')}
                                        error={errors.categoryUuid?.message}
                                    />
                                    {!showNewCategory ? (
                                        <button
                                            type="button"
                                            onClick={() => setShowNewCategory(true)}
                                            className="mt-2 text-xs font-medium text-primary hover:text-primary-hover transition-colors flex items-center gap-1"
                                        >
                                            <Plus size={12} /> Create new category
                                        </button>
                                    ) : (
                                        <div className="mt-2 flex items-end gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                            <div className="flex-1">
                                                <Input
                                                    name="newCategory"
                                                    placeholder="Category name"
                                                    value={newCategoryName}
                                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                                />
                                            </div>
                                            <Button
                                                size="sm"
                                                loading={createCatMut.isPending}
                                                onClick={() => {
                                                    if (newCategoryName.trim()) {
                                                        const trimmed = newCategoryName.trim();
                                                        if (hasCategoryNameConflict(trimmed)) {
                                                            toast.error('Category already exists. Please use a different name.');
                                                            return;
                                                        }
                                                        createCatMut.mutate({ name: trimmed });
                                                    }
                                                }}
                                            >
                                                Add
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => { setShowNewCategory(false); setNewCategoryName(''); }}
                                            >
                                                <X size={14} />
                                            </Button>
                                        </div>
                                    )}
                                    <p className="mt-2 text-xs text-gray-400">
                                        Manage categories in{' '}
                                        <button
                                            type="button"
                                            onClick={() => navigate('/admin/settings')}
                                            className="underline underline-offset-2 text-primary hover:text-primary-hover font-medium"
                                        >
                                            Settings → Categories
                                        </button>
                                    </p>
                                </div>

                                {/* Tags */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Tags
                                    </label>
                                    <div ref={tagDropdownRef} className="relative">
                                        {/* Trigger */}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setTagDropdownOpen((open) => !open);
                                                setGroupDropdownOpen(false);
                                            }}
                                            className={`w-full min-h-[40px] border rounded-lg px-3 py-2 flex items-center justify-between gap-2 bg-white text-left
                                                ${tagDropdownOpen ? 'ring-1 ring-secondary border-secondary' : 'border-gray-300 hover:border-gray-400'}
                                            `}
                                        >
                                            <div className="flex flex-wrap gap-1.5 flex-1">
                                                {selectedTagUuids.length === 0 ? (
                                                    <span className="text-xs text-gray-400">
                                                        Search and select tags...
                                                    </span>
                                                ) : (
                                                    selectedTagUuids.map((id) => {
                                                        const tag = tags.find((t) => t.uuid === id);
                                                        if (!tag) return null;
                                                        return (
                                                            <span
                                                                key={id}
                                                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-secondary/10 text-secondary border border-secondary/30"
                                                            >
                                                                {tag.name}
                                                                <span
                                                                    role="button"
                                                                    tabIndex={0}
                                                                    aria-label={`Remove tag ${tag.name}`}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        toggleTag(id);
                                                                    }}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                                            e.preventDefault();
                                                                            e.stopPropagation();
                                                                            toggleTag(id);
                                                                        }
                                                                    }}
                                                                    className="ml-0.5 text-secondary/70 hover:text-secondary cursor-pointer"
                                                                >
                                                                    <X size={10} />
                                                                </span>
                                                            </span>
                                                        );
                                                    })
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                {selectedTagUuids.length > 0 && (
                                                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-secondary/10 text-secondary font-medium">
                                                        {selectedTagUuids.length} selected
                                                    </span>
                                                )}
                                                <ChevronDown
                                                    size={16}
                                                    className={`text-gray-400 transition-transform ${tagDropdownOpen ? 'rotate-180' : ''}`}
                                                />
                                            </div>
                                        </button>

                                        {/* Dropdown panel */}
                                        {tagDropdownOpen && (
                                            <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-[280px] flex flex-col">
                                                {/* Search */}
                                                <div className="p-2 border-b border-gray-100">
                                                    <Input
                                                        autoFocus
                                                        name="tagSearch"
                                                        placeholder="Search tags..."
                                                        prefixIcon={<Search size={14} />}
                                                        value={tagSearch}
                                                        onChange={(e) => setTagSearch(e.target.value)}
                                                    />
                                                </div>

                                                {/* List */}
                                                <div className="flex-1 overflow-y-auto">
                                                    {tags.length === 0 && !tagSearch ? (
                                                        <div className="py-6 text-center text-xs text-gray-400">
                                                            No tags available.
                                                        </div>
                                                    ) : filteredTags.length === 0 ? (
                                                        <div className="py-4 text-center text-xs text-gray-400">
                                                            No tags found for '{tagSearch}'
                                                        </div>
                                                    ) : (
                                                        filteredTags.map((tag) => {
                                                            const selected = selectedTagUuids.includes(tag.uuid);
                                                            return (
                                                                <button
                                                                    key={tag.uuid}
                                                                    type="button"
                                                                    onClick={() => toggleTag(tag.uuid)}
                                                                    className="w-full px-3 py-2 flex items-center justify-between gap-2 text-xs hover:bg-gray-50"
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <input
                                                                            type="checkbox"
                                                                            readOnly
                                                                            checked={!!selected}
                                                                            className="h-3.5 w-3.5 rounded border-gray-300 text-secondary focus:ring-0"
                                                                        />
                                                                        <span className="text-gray-800">{tag.name}</span>
                                                                    </div>
                                                                    {selected && (
                                                                        <Check size={14} className="text-secondary" />
                                                                    )}
                                                                </button>
                                                            );
                                                        })
                                                    )}

                                                    {/* Create new tag option */}
                                                    {showCreateTagOption && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleCreateTag(tagSearch)}
                                                            disabled={createTagMut.isPending}
                                                            className="m-2 mt-0 px-3 py-2 flex items-center gap-2 text-xs rounded-md border border-dashed border-secondary/40 text-secondary hover:bg-secondary/5 disabled:opacity-60 disabled:cursor-not-allowed"
                                                        >
                                                            <Tag size={14} />
                                                            <span>
                                                                {createTagMut.isPending ? 'Creating tag...' : (
                                                                    <>
                                                                        Create "<span className="font-semibold">{tagSearch.trim()}</span>" as new tag
                                                                    </>
                                                                )}
                                                            </span>
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Footer */}
                                                <div className="px-3 py-2 border-t border-gray-100 flex items-center justify-between bg-gray-50">
                                                    <span className="text-[11px] text-gray-500">
                                                        {selectedTagUuids.length} tag(s) selected
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        {selectedTagUuids.length > 0 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setSelectedTagUuids([])}
                                                                className="text-[11px] text-gray-500 hover:text-gray-700"
                                                            >
                                                                Clear all
                                                            </button>
                                                        )}
                                                        <Button
                                                            size="sm"
                                                            onClick={() => setTagDropdownOpen(false)}
                                                        >
                                                            Done
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Selected tags summary */}
                                    <div className="mt-2">
                                        {selectedTagUuids.length === 0 ? (
                                            <p className="text-xs text-gray-400">No tags selected</p>
                                        ) : (
                                            <div className="flex flex-wrap gap-1.5">
                                                {(tagSummaryExpanded
                                                    ? selectedTagUuids
                                                    : selectedTagUuids.slice(0, 4)
                                                ).map((id) => {
                                                    const tag = tags.find((t) => t.uuid === id);
                                                    if (!tag) return null;
                                                    return (
                                                        <span
                                                            key={id}
                                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-secondary/10 text-secondary border border-secondary/30"
                                                        >
                                                            {tag.name}
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleTag(id)}
                                                                className="ml-0.5 text-secondary/70 hover:text-secondary"
                                                            >
                                                                <X size={10} />
                                                            </button>
                                                        </span>
                                                    );
                                                })}
                                                {selectedTagUuids.length > 4 && !tagSummaryExpanded && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setTagSummaryExpanded(true)}
                                                        className="text-[11px] px-2 py-0.5 rounded-full bg-secondary/5 text-secondary border border-secondary/20"
                                                    >
                                                        +{selectedTagUuids.length - 4} more
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <p className="mt-2 text-xs text-gray-400">
                                    Manage tags in{' '}
                                    <button
                                        type="button"
                                        onClick={() => navigate('/admin/settings')}
                                        className="underline underline-offset-2 text-primary hover:text-primary-hover font-medium"
                                    >
                                        Settings → Tags
                                    </button>
                                </p>
                            </div>
                        </Card>

                        {/* Section B: Settings */}
                        <Card padding="md">
                            <SectionHeading icon={Zap} title="Settings" subtitle="Scoring, time limits, and behavior" />

                            <div className="space-y-4">
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <Input
                                        label="Pass Marks"
                                        name="passMarks"
                                        type="number"
                                        placeholder="e.g. 50"
                                        hint="Minimum marks required to pass"
                                        register={register('passMarks')}
                                        error={errors.passMarks?.message}
                                    />
                                    <div>
                                        <Input
                                            label="Time Limit (seconds)"
                                            name="timeLimitSeconds"
                                            type="number"
                                            placeholder="e.g. 1800"
                                            hint="Leave empty for no time limit"
                                            prefixIcon={<Clock size={14} />}
                                            register={register('timeLimitSeconds')}
                                            error={errors.timeLimitSeconds?.message}
                                        />
                                        {timeLimitPreview && (
                                            <p className="mt-1 text-xs text-primary font-medium">
                                                = {timeLimitPreview}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid sm:grid-cols-2 gap-4">
                                    <Input
                                        label="Max Attempts"
                                        name="maxAttempts"
                                        type="number"
                                        placeholder="0 = unlimited"
                                        hint="How many times a student can attempt this quiz"
                                        register={register('maxAttempts')}
                                        error={errors.maxAttempts?.message}
                                    />
                                    <Input
                                        label="Cooldown Hours"
                                        name="cooldownHours"
                                        type="number"
                                        placeholder="e.g. 24"
                                        hint="Hours student must wait before retrying"
                                        register={register('cooldownHours')}
                                        error={errors.cooldownHours?.message}
                                    />
                                </div>

                                <Input
                                    label="Questions to Serve"
                                    name="questionsToServe"
                                    type="number"
                                    placeholder="e.g. 20"
                                    hint="Number of questions served per attempt (leave empty to serve all)"
                                    register={register('questionsToServe')}
                                    error={errors.questionsToServe?.message}
                                />

                                <div className="pt-2 space-y-4">
                                    <Toggle
                                        checked={watchAll.shuffleQuestions}
                                        onChange={(v) => setValue('shuffleQuestions', v)}
                                        label="Shuffle Questions"
                                        description="Randomize question order for each attempt"
                                    />
                                    <Toggle
                                        checked={watchAll.shuffleOptions}
                                        onChange={(v) => setValue('shuffleOptions', v)}
                                        label="Shuffle Options"
                                        description="Randomize answer options for each question"
                                    />
                                    <Toggle
                                        checked={watchAll.showCorrectAnswers}
                                        onChange={(v) => setValue('showCorrectAnswers', v)}
                                        label="Show Correct Answers"
                                        description="Allow students to review correct answers after submission"
                                    />
                                    <Toggle
                                        checked={watchAll.showLeaderboard}
                                        onChange={(v) => setValue('showLeaderboard', v)}
                                        label="Show Leaderboard"
                                        description="Display leaderboard after quiz completion"
                                    />
                                </div>
                            </div>
                        </Card>

                        {/* Section C: Access & Schedule */}
                        <Card padding="md">
                            <SectionHeading icon={Calendar} title="Access & Schedule" subtitle="Control who can access and when" />

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Restrict to Groups
                                    </label>
                                    <p className="text-xs text-gray-400 mb-2">
                                        Only students in selected groups can access this quiz. Leave empty for open access.
                                    </p>
                                    <div ref={groupDropdownRef} className="relative">
                                        {/* Trigger */}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setGroupDropdownOpen((open) => !open);
                                                setTagDropdownOpen(false);
                                            }}
                                            className={`w-full min-h-[40px] border rounded-lg px-3 py-2 flex items-center justify-between gap-2 bg-white text-left
                                                ${groupDropdownOpen ? 'ring-1 ring-primary border-primary' : 'border-gray-300 hover:border-gray-400'}
                                            `}
                                        >
                                            <div className="flex flex-wrap gap-1.5 flex-1">
                                                {selectedGroupUuids.length === 0 ? (
                                                    <span className="text-xs text-gray-400">
                                                        Search and select groups...
                                                    </span>
                                                ) : (
                                                    selectedGroupUuids.map((id) => {
                                                        const group = groups.find((g) => g.uuid === id);
                                                        if (!group) return null;
                                                        return (
                                                            <span
                                                                key={id}
                                                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary/10 text-primary border border-primary/30"
                                                            >
                                                                {group.name}
                                                                <span
                                                                    role="button"
                                                                    tabIndex={0}
                                                                    aria-label={`Remove group ${group.name}`}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setSelectedGroupUuids((prev) =>
                                                                            prev.filter((x) => x !== id)
                                                                        );
                                                                    }}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                                            e.preventDefault();
                                                                            e.stopPropagation();
                                                                            setSelectedGroupUuids((prev) =>
                                                                                prev.filter((x) => x !== id)
                                                                            );
                                                                        }
                                                                    }}
                                                                    className="ml-0.5 text-primary/80 hover:text-primary cursor-pointer"
                                                                >
                                                                    <X size={10} />
                                                                </span>
                                                            </span>
                                                        );
                                                    })
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                {selectedGroupUuids.length > 0 && (
                                                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                                                        {selectedGroupUuids.length} selected
                                                    </span>
                                                )}
                                                <ChevronDown
                                                    size={16}
                                                    className={`text-gray-400 transition-transform ${groupDropdownOpen ? 'rotate-180' : ''}`}
                                                />
                                            </div>
                                        </button>

                                        {/* Dropdown panel */}
                                        {groupDropdownOpen && (
                                            <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-[280px] flex flex-col">
                                                {/* Search */}
                                                <div className="p-2 border-b border-gray-100">
                                                    <Input
                                                        autoFocus
                                                        name="groupSearch"
                                                        placeholder="Search groups..."
                                                        prefixIcon={<Search size={14} />}
                                                        value={groupSearch}
                                                        onChange={(e) => setGroupSearch(e.target.value)}
                                                    />
                                                </div>

                                                {/* List */}
                                                <div className="flex-1 overflow-y-auto">
                                                    {groupsLoading ? (
                                                        <div className="p-3 space-y-2">
                                                            {Array.from({ length: 4 }).map((_, i) => (
                                                                <div
                                                                    key={i}
                                                                    className="h-9 rounded-md bg-gray-100 animate-pulse"
                                                                />
                                                            ))}
                                                        </div>
                                                    ) : groups.length === 0 ? (
                                                        <div className="py-6 text-center text-xs text-gray-400">
                                                            No groups created yet.{' '}
                                                            <button
                                                                type="button"
                                                                onClick={() => navigate('/admin/groups')}
                                                                className="text-primary hover:text-primary-hover underline underline-offset-2"
                                                            >
                                                                Create a group →
                                                            </button>
                                                        </div>
                                                    ) : filteredGroups.length === 0 ? (
                                                        <div className="py-4 text-center text-xs text-gray-400">
                                                            No groups found
                                                        </div>
                                                    ) : (
                                                        filteredGroups.map((group) => {
                                                            const selected = selectedGroupUuids.includes(group.uuid);
                                                            return (
                                                                <button
                                                                    key={group.uuid}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setSelectedGroupUuids((prev) =>
                                                                            prev.includes(group.uuid)
                                                                                ? prev.filter((id) => id !== group.uuid)
                                                                                : [...prev, group.uuid]
                                                                        );
                                                                    }}
                                                                    className="w-full px-3 py-2 flex items-center justify-between gap-2 text-xs hover:bg-gray-50"
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <input
                                                                            type="checkbox"
                                                                            readOnly
                                                                            checked={!!selected}
                                                                            className="h-3.5 w-3.5 rounded border-gray-300 text-primary focus:ring-0"
                                                                        />
                                                                        <div className="flex flex-col items-start">
                                                                            <span className="text-gray-800 font-medium">
                                                                                {group.name}
                                                                            </span>
                                                                            <span className="text-[11px] text-gray-400">
                                                                                {group.memberCount ?? 0} members
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    {selected && (
                                                                        <Check size={14} className="text-primary" />
                                                                    )}
                                                                </button>
                                                            );
                                                        })
                                                    )}
                                                </div>

                                                {/* Footer */}
                                                <div className="px-3 py-2 border-t border-gray-100 flex items-center justify-between bg-gray-50">
                                                    <span className="text-[11px] text-gray-500">
                                                        {selectedGroupUuids.length} group(s) selected
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        {selectedGroupUuids.length > 0 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setSelectedGroupUuids([])}
                                                                className="text-[11px] text-gray-500 hover:text-gray-700"
                                                            >
                                                                Clear all
                                                            </button>
                                                        )}
                                                        <Button
                                                            size="sm"
                                                            onClick={() => setGroupDropdownOpen(false)}
                                                        >
                                                            Done
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Selected groups summary */}
                                    <div className="mt-2">
                                        {selectedGroupUuids.length === 0 ? (
                                            <p className="text-xs text-emerald-600 bg-emerald-50 inline-flex items-center px-2 py-0.5 rounded-full">
                                                🌐 Open access — available to all students
                                            </p>
                                        ) : (
                                            <div className="flex flex-wrap gap-1.5 items-center">
                                                {(groupSummaryExpanded
                                                    ? selectedGroupUuids
                                                    : selectedGroupUuids.slice(0, 3)
                                                ).map((id) => {
                                                    const group = groups.find((g) => g.uuid === id);
                                                    if (!group) return null;
                                                    return (
                                                        <span
                                                            key={id}
                                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary/10 text-primary border border-primary/30"
                                                        >
                                                            {group.name}
                                                            <span
                                                                role="button"
                                                                tabIndex={0}
                                                                aria-label={`Remove group ${group.name}`}
                                                                onClick={() =>
                                                                    setSelectedGroupUuids((prev) =>
                                                                        prev.filter((x) => x !== id)
                                                                    )
                                                                }
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                                        e.preventDefault();
                                                                        setSelectedGroupUuids((prev) =>
                                                                            prev.filter((x) => x !== id)
                                                                        );
                                                                    }
                                                                }}
                                                                className="ml-0.5 text-primary/80 hover:text-primary cursor-pointer"
                                                            >
                                                                <X size={10} />
                                                            </span>
                                                        </span>
                                                    );
                                                })}
                                                {selectedGroupUuids.length > 3 && !groupSummaryExpanded && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setGroupSummaryExpanded(true)}
                                                        className="text-[11px] text-primary hover:text-primary-hover underline underline-offset-2"
                                                    >
                                                        View all
                                                    </button>
                                                )}
                                                {selectedGroupUuids.length >= 4 && (
                                                    <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                                                        🔒 Restricted to {selectedGroupUuids.length} groups
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <Input
                                    label="Access Code"
                                    name="accessCode"
                                    placeholder="e.g. QUIZ2026"
                                    hint="Leave empty for open access"
                                    prefixIcon={<Lock size={14} />}
                                    register={register('accessCode')}
                                    error={errors.accessCode?.message}
                                />

                                <div className="grid sm:grid-cols-2 gap-4">
                                    <Input
                                        label="Available From"
                                        name="startsAt"
                                        type="datetime-local"
                                        hint="Leave empty to make available immediately"
                                        register={register('startsAt')}
                                        error={errors.startsAt?.message}
                                    />
                                    <Input
                                        label="Available Until"
                                        name="expiresAt"
                                        type="datetime-local"
                                        hint="Leave empty for no expiry"
                                        register={register('expiresAt')}
                                        error={errors.expiresAt?.message}
                                    />
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {/* ─── RIGHT: Sidebar Preview ─── */}
                <div className="lg:sticky lg:top-6 space-y-4">
                    <Card padding="md">
                        <h3 className="text-sm font-semibold text-gray-900 mb-4">Quiz Preview</h3>

                        {quizLoading ? (
                            <div className="space-y-3">
                                <div className="skeleton h-5 w-3/4 rounded" />
                                <div className="skeleton h-5 w-1/2 rounded" />
                                <div className="skeleton h-20 w-full rounded-lg" />
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div>
                                    <p className="text-xs text-gray-400 mb-1">Title</p>
                                    <p className="text-sm font-semibold text-gray-900">
                                        {watchAll.title || 'Untitled Quiz'}
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-1.5">
                                    {quiz?.status && (
                                        <Badge variant={getStatusColor(quiz.status)} size="sm" dot>
                                            {quiz.status}
                                        </Badge>
                                    )}
                                    {watchAll.difficulty && (
                                        <Badge variant={difficultyVariant[watchAll.difficulty]} size="sm">
                                            {watchAll.difficulty}
                                        </Badge>
                                    )}
                                    {watchAll.quizType && (
                                        <Badge variant={typeVariant[watchAll.quizType]} size="sm">
                                            {watchAll.quizType}
                                        </Badge>
                                    )}
                                </div>

                                <div className="border-t border-gray-100 pt-3 space-y-2.5">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-400">Category</span>
                                        <span className="text-gray-700 font-medium">
                                            {selectedCategory?.name || quiz?.categoryName || '—'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-400">Time Limit</span>
                                        <span className="text-gray-700 font-medium">
                                            {timeLimitPreview || 'No limit'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-400">Max Attempts</span>
                                        <span className="text-gray-700 font-medium">
                                            {watchAll.maxAttempts && Number(watchAll.maxAttempts) > 0
                                                ? watchAll.maxAttempts
                                                : 'Unlimited'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-400">Pass Marks</span>
                                        <span className="text-gray-700 font-medium">
                                            {watchAll.passMarks || '—'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-400">Questions</span>
                                        <span className="text-gray-700 font-medium">
                                            {quiz?.questionCount ?? 0}
                                        </span>
                                    </div>
                                </div>

                                {/* Selected Tags */}
                                {selectedTagUuids.length > 0 && (
                                    <div className="border-t border-gray-100 pt-3">
                                        <p className="text-xs text-gray-400 mb-2">Tags</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {selectedTagUuids.map((id) => {
                                                const tag = tags.find((t) => t.uuid === id);
                                                const name = tag?.name || id;
                                                return (
                                                    <Badge key={id} variant="default" size="sm">
                                                        {name}
                                                    </Badge>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </Card>

                    <div className="space-y-2">
                        <Button
                            fullWidth
                            icon={<Save size={16} />}
                            loading={updateMut.isPending}
                            onClick={handleSubmit(onSave)}
                        >
                            Save Changes
                        </Button>
                        <Button
                            fullWidth
                            variant="outline"
                            icon={<ListChecks size={16} />}
                            onClick={() => navigate(`/admin/quizzes/${quizUuid}/questions`)}
                        >
                            Manage Questions
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
