import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
    ArrowLeft, Plus, X, Lock, Clock, Shuffle, Eye,
    Calendar, Tag, BookOpen, Zap, Save, Send,
    Archive, AlertCircle, ListChecks,
} from 'lucide-react';
import { getQuizByUuid, updateQuiz, updateQuizStatus } from '../../../api/quiz.api';
import { getAllCategories, createCategory } from '../../../api/category.api';
import { getAllTags, createTag } from '../../../api/tag.api';
import { formatDuration, getStatusColor } from '../../../utils/formatters';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import Input from '../../../components/common/Input';
import Select from '../../../components/common/Select';
import Textarea from '../../../components/common/Textarea';
import Card from '../../../components/ui/Card';

/* ─── Zod schema (same as Create) ─── */
const quizSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(255),
    description: z.string().optional().default(''),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD'], { required_error: 'Select a difficulty' }),
    quizType: z.enum(['PRACTICE', 'EXAM', 'SURVEY'], { required_error: 'Select a quiz type' }),
    passMarks: z.coerce.number().min(0).optional().or(z.literal('')),
    timeLimitSeconds: z.coerce.number().min(60, 'Must be at least 60 seconds').optional().or(z.literal('')),
    categoryUuid: z.string().optional().default(''),
    maxAttempts: z.coerce.number().min(0).optional().or(z.literal('')),
    cooldownHours: z.coerce.number().min(0).optional().or(z.literal('')),
    shuffleQuestions: z.boolean().default(false),
    showCorrectAnswers: z.boolean().default(false),
    accessCode: z.string().max(20).optional().default(''),
    startsAt: z.string().optional().default(''),
    expiresAt: z.string().optional().default(''),
}).refine(
    (d) => {
        if (d.startsAt && d.expiresAt) return new Date(d.expiresAt) > new Date(d.startsAt);
        return true;
    },
    { message: 'Expiry must be after the start date', path: ['expiresAt'] }
);

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
        resolver: zodResolver(quizSchema),
        defaultValues: {
            title: '', description: '', difficulty: '', quizType: '',
            passMarks: '', timeLimitSeconds: '', categoryUuid: '',
            maxAttempts: '', cooldownHours: '',
            shuffleQuestions: false, showCorrectAnswers: false,
            accessCode: '', startsAt: '', expiresAt: '',
        },
    });

    const watchAll = watch();

    /* ─── tags state ─── */
    const [selectedTagIds, setSelectedTagIds] = useState([]);
    const [newTagName, setNewTagName] = useState('');

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

    /* ─── pre-fill form once quiz loads ─── */
    useEffect(() => {
        if (!quiz) return;
        reset({
            title: quiz.title || '',
            description: quiz.description || '',
            difficulty: quiz.difficulty || '',
            quizType: quiz.quizType || '',
            passMarks: quiz.passMarks ?? '',
            timeLimitSeconds: quiz.timeLimitSeconds ?? '',
            categoryUuid: quiz.categoryId ? String(quiz.categoryId) : '',
            maxAttempts: quiz.maxAttempts ?? '',
            cooldownHours: quiz.cooldownHours ?? '',
            shuffleQuestions: quiz.shuffleQuestions ?? false,
            showCorrectAnswers: quiz.showCorrectAnswers ?? false,
            accessCode: quiz.accessCode || '',
            startsAt: toLocalDatetime(quiz.startsAt),
            expiresAt: toLocalDatetime(quiz.expiresAt),
        });
        setSelectedTagIds(quiz.tags ? tags.filter((t) => quiz.tags.includes(t.name)).map((t) => t.id) : []);
    }, [quiz, reset]);

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
            setValue('categoryUuid', String(result.data.id));
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
        onSuccess: (result) => {
            toast.success('Tag created');
            queryClient.invalidateQueries({ queryKey: ['tags'] });
            setSelectedTagIds((prev) => [...prev, result.data.id]);
            setNewTagName('');
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
            categoryId: data.categoryUuid ? Number(data.categoryUuid) : undefined,
            tagIds: selectedTagIds.length ? selectedTagIds : undefined,
            maxAttempts: data.maxAttempts !== '' ? Number(data.maxAttempts) : undefined,
            cooldownHours: data.cooldownHours !== '' ? Number(data.cooldownHours) : undefined,
            shuffleQuestions: data.shuffleQuestions,
            showCorrectAnswers: data.showCorrectAnswers,
            accessCode: data.accessCode || undefined,
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

    const selectedCategory = categories.find((c) => String(c.id) === watchAll.categoryUuid);

    function hasCategoryNameConflict(name) {
        const normalizedName = normalizeCategoryName(name);
        return categories.some((category) => normalizeCategoryName(category.name) === normalizedName);
    }

    function toggleTag(id) {
        setSelectedTagIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    }

    function handleAddTag() {
        const name = newTagName.trim();
        if (!name) return;
        createTagMut.mutate({ name });
    }

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
                                        options={categories.map((c) => ({ value: String(c.id), label: c.name }))}
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
                                                        const slug = trimmed.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                                                        createCatMut.mutate({ name: trimmed, slug, description: '' });
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
                                </div>

                                {/* Tags */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Tags
                                    </label>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {tags.map((tag) => {
                                            const isSelected = selectedTagIds.includes(tag.id);
                                            return (
                                                <button
                                                    key={tag.id}
                                                    type="button"
                                                    onClick={() => toggleTag(tag.id)}
                                                    className={`
                                                        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                                                        border transition-all duration-150 cursor-pointer select-none
                                                        ${isSelected
                                                            ? 'bg-primary/10 text-primary border-primary/30 shadow-sm'
                                                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'}
                                                    `}
                                                >
                                                    {tag.name}
                                                    {isSelected && <X size={12} />}
                                                </button>
                                            );
                                        })}
                                        {tags.length === 0 && (
                                            <span className="text-xs text-gray-400">No tags available</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 max-w-xs">
                                            <Input
                                                name="newTag"
                                                placeholder="Add a new tag..."
                                                prefixIcon={<Tag size={14} />}
                                                value={newTagName}
                                                onChange={(e) => setNewTagName(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        handleAddTag();
                                                    }
                                                }}
                                            />
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            loading={createTagMut.isPending}
                                            onClick={handleAddTag}
                                        >
                                            Add
                                        </Button>
                                    </div>
                                </div>
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

                                <div className="pt-2 space-y-4">
                                    <Toggle
                                        checked={watchAll.shuffleQuestions}
                                        onChange={(v) => setValue('shuffleQuestions', v)}
                                        label="Shuffle Questions"
                                        description="Randomize question order for each attempt"
                                    />
                                    <Toggle
                                        checked={watchAll.showCorrectAnswers}
                                        onChange={(v) => setValue('showCorrectAnswers', v)}
                                        label="Show Correct Answers"
                                        description="Allow students to review correct answers after submission"
                                    />
                                </div>
                            </div>
                        </Card>

                        {/* Section C: Access & Schedule */}
                        <Card padding="md">
                            <SectionHeading icon={Calendar} title="Access & Schedule" subtitle="Control who can access and when" />

                            <div className="space-y-4">
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
                                {selectedTagIds.length > 0 && (
                                    <div className="border-t border-gray-100 pt-3">
                                        <p className="text-xs text-gray-400 mb-2">Tags</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {selectedTagIds.map((id) => {
                                                const tag = tags.find((t) => t.id === id);
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
