import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
    ArrowLeft, Plus, X, Lock, Clock, Shuffle, Eye,
    Calendar, Tag, BookOpen, Zap, Save, Send, Check,
    Search, ChevronDown,
} from 'lucide-react';
import { createQuiz } from '../../../api/quiz.api';
import { updateQuizStatus } from '../../../api/quiz.api';
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

/* ─── Zod schema ─── */
const quizSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(255),
    description: z.string().optional().default(''),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD'], { required_error: 'Select a difficulty' }),
    quizType: z.enum(['PRACTICE', 'EXAM', 'SURVEY'], { required_error: 'Select a quiz type' }),
    passMarks: z.coerce.number().min(0).optional().or(z.literal('')),
    timeLimitSeconds: z.coerce.number().min(60, 'Must be at least 60 seconds').optional().or(z.literal('')),
    categoryUuid: z.string().optional().default(''),
    maxAttempts: z.coerce.number().min(1, 'Max attempts must be at least 1').max(100, 'Max attempts cannot exceed 100').optional().or(z.literal('')),
    cooldownHours: z.coerce.number().min(0).max(720, 'Cooldown cannot exceed 720 hours').optional().or(z.literal('')),
    questionsToServe: z.coerce.number().min(1, 'Questions to serve must be at least 1').optional().or(z.literal('')),
    shuffleQuestions: z.boolean().default(false),
    shuffleOptions: z.boolean().default(false),
    showCorrectAnswers: z.boolean().default(false),
    showLeaderboard: z.boolean().default(false),
    accessCode: z.string().max(20).optional().default(''),
    startsAt: z.string().optional().default(''),
    expiresAt: z.string().optional().default(''),
}).refine(
    (d) => {
        if (!d.startsAt) return true;
        return new Date(d.startsAt).getTime() >= Date.now();
    },
    { message: 'Start date must be in the present or future', path: ['startsAt'] }
).refine(
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

/* ─── difficulty colors ─── */
const difficultyVariant = { EASY: 'success', MEDIUM: 'warning', HARD: 'danger' };
const typeVariant = { PRACTICE: 'info', EXAM: 'default', SURVEY: 'warning' };

function normalizeCategoryName(name) {
    return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

export default function CreateQuiz() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    /* ─── form ─── */
    const {
        register, handleSubmit, watch, setValue,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(quizSchema),
        defaultValues: {
            title: '', description: '', difficulty: '', quizType: '',
            passMarks: '', timeLimitSeconds: '', categoryUuid: '',
            maxAttempts: '', cooldownHours: '', questionsToServe: '',
            shuffleQuestions: false, shuffleOptions: false, showCorrectAnswers: false, showLeaderboard: false,
            accessCode: '', startsAt: '', expiresAt: '',
        },
    });

    const watchAll = watch();

    /* ─── tags state ─── */
    const [selectedTagUuids, setSelectedTagUuids] = useState([]);
    const [tagSearch, setTagSearch] = useState('');
    const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
    const [tagSummaryExpanded, setTagSummaryExpanded] = useState(false);

    /* ─── inline category create (removed: now managed via Settings) ─── */

    /* ─── groups state ─── */
    const [selectedGroupUuids, setSelectedGroupUuids] = useState([]);
    const [groupSearch, setGroupSearch] = useState('');
    const [groupDropdownOpen, setGroupDropdownOpen] = useState(false);
    const [groupSummaryExpanded, setGroupSummaryExpanded] = useState(false);

    const groupDropdownRef = useRef(null);
    const tagDropdownRef = useRef(null);

    /* ─── data ─── */

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

    /* ─── mutations ─── */
    const createMut = useMutation({
        mutationFn: (payload) => createQuiz(payload),
        onSuccess: (result) => {
            toast.success('Quiz created successfully!');
            navigate('/admin/quizzes/' + result.data.uuid + '/edit');
        },
        onError: (err) => {
            const response = err?.response?.data;
            const validationErrors = response?.data;
            const firstFieldError =
                validationErrors && typeof validationErrors === 'object'
                    ? Object.values(validationErrors).find((msg) => typeof msg === 'string' && msg.trim())
                    : null;

            toast.error(firstFieldError || response?.message || 'Failed to create quiz');
        },
    });

    const publishMut = useMutation({
        mutationFn: ({ uuid }) => updateQuizStatus(uuid, 'PUBLISHED'),
    });

    const createCatMut = useMutation({
        mutationFn: (payload) => createCategory(payload),
        onSuccess: () => {
            toast.success('Category created');
            queryClient.invalidateQueries({ queryKey: ['categories'] });
        },
        onError: (err) => {
            if (err?.response?.status === 500) {
                toast.error('Category already exists. Please use a different name.');
                return;
            }
            toast.error(err.response?.data?.message || 'Failed to create category');
        },
    });

    /* ─── submit handlers ─── */
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
            questionsToServe: data.questionsToServe !== '' ? Number(data.questionsToServe) : undefined,
            shuffleQuestions: data.shuffleQuestions,
            shuffleOptions: data.shuffleOptions,
            showCorrectAnswers: data.showCorrectAnswers,
            showLeaderboard: data.showLeaderboard,
            accessCode: data.accessCode || undefined,
            groupUuids: selectedGroupUuids,
            startsAt: data.startsAt ? new Date(data.startsAt).toISOString() : null,
            expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString() : null,
        };
    }

    function onSaveDraft(data) {
        createMut.mutate(buildPayload(data));
    }

    async function onPublish(data) {
        try {
            const result = await createMut.mutateAsync(buildPayload(data));
            await publishMut.mutateAsync({ uuid: result.data.uuid });
            toast.success('Quiz published!');
        } catch { /* errors handled in mutation callbacks */ }
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
                        <h1 className="text-2xl font-bold text-gray-900">Create Quiz</h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            Fill in the details below to create a new quiz
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                    <Button
                        variant="outline"
                        icon={<Save size={16} />}
                        loading={createMut.isPending && !publishMut.isPending}
                        onClick={handleSubmit(onSaveDraft)}
                    >
                        Save as Draft
                    </Button>
                    <Button
                        icon={<Send size={16} />}
                        loading={publishMut.isPending}
                        onClick={handleSubmit(onPublish)}
                    >
                        Publish
                    </Button>
                </div>
            </div>

            {/* ─── Two-column layout ─── */}
            <div className="grid lg:grid-cols-[1fr_380px] gap-6 items-start">
                {/* ─── LEFT: Main form ─── */}
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
                                            ${tagDropdownOpen ? 'ring-1 ring-primary border-primary' : 'border-gray-300 hover:border-gray-400'}
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
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    toggleTag(id);
                                                                }}
                                                                className="ml-0.5 text-secondary/70 hover:text-secondary"
                                                            >
                                                                <X size={10} />
                                                            </button>
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
                                    placeholder="Leave empty for unlimited"
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

                            <div className="grid sm:grid-cols-2 gap-4">
                                <Input
                                    label="Questions to Serve"
                                    name="questionsToServe"
                                    type="number"
                                    placeholder="e.g. 20"
                                    hint="Number of questions served per attempt"
                                    register={register('questionsToServe')}
                                    error={errors.questionsToServe?.message}
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
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedGroupUuids((prev) =>
                                                                        prev.filter((x) => x !== id)
                                                                    );
                                                                }}
                                                                className="ml-0.5 text-primary/80 hover:text-primary"
                                                            >
                                                                <X size={10} />
                                                            </button>
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
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setSelectedGroupUuids((prev) =>
                                                                    prev.filter((x) => x !== id)
                                                                )
                                                            }
                                                            className="ml-0.5 text-primary/80 hover:text-primary"
                                                        >
                                                            <X size={10} />
                                                        </button>
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

                {/* ─── RIGHT: Sidebar Preview ─── */}
                <div className="lg:sticky lg:top-6 space-y-4">
                    <Card padding="md">
                        <h3 className="text-sm font-semibold text-gray-900 mb-4">Quiz Preview</h3>

                        <div className="space-y-3">
                            <div>
                                <p className="text-xs text-gray-400 mb-1">Title</p>
                                <p className="text-sm font-semibold text-gray-900">
                                    {watchAll.title || 'Untitled Quiz'}
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-1.5">
                                <Badge variant="info" size="sm" dot>DRAFT</Badge>
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
                                        {selectedCategory?.name || '—'}
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
                            </div>

                            {/* Selected Tags */}
                            {selectedTagUuids.length > 0 && (
                                <div className="border-t border-gray-100 pt-3">
                                    <p className="text-xs text-gray-400 mb-2">Tags</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {selectedTagUuids.map((id) => {
                                            const tag = tags.find((t) => t.uuid === id);
                                            return tag ? (
                                                <Badge key={id} variant="default" size="sm">
                                                    {tag.name}
                                                </Badge>
                                            ) : null;
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>

                    <div className="space-y-2">
                        <Button
                            fullWidth
                            variant="outline"
                            icon={<Save size={16} />}
                            loading={createMut.isPending && !publishMut.isPending}
                            onClick={handleSubmit(onSaveDraft)}
                        >
                            Save as Draft
                        </Button>
                        <Button
                            fullWidth
                            icon={<Send size={16} />}
                            loading={publishMut.isPending}
                            onClick={handleSubmit(onPublish)}
                        >
                            Publish Quiz
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
