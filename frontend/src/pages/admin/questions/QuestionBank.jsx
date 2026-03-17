import { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
    Search, Plus, MoreVertical, Edit3, Trash2, Eye, Upload,
    HelpCircle, AlertTriangle, X, GripVertical, Download,
    FileText, CheckCircle2, XCircle, Info,
} from 'lucide-react';
import {
    getAllQuestions, getQuestionByUuid, createQuestion,
    updateQuestion, deleteQuestion, bulkImportQuestions,
} from '../../../api/question.api';
import { getAllTags } from '../../../api/tag.api';
import { QUESTION_TYPES, DIFFICULTY_LEVELS } from '../../../utils/constants';
import { formatDate, truncateText } from '../../../utils/formatters';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import Input from '../../../components/common/Input';
import Select from '../../../components/common/Select';
import Textarea from '../../../components/common/Textarea';
import Modal from '../../../components/common/Modal';
import Pagination from '../../../components/common/Pagination';
import EmptyState from '../../../components/common/EmptyState';
import Card from '../../../components/ui/Card';
import Table from '../../../components/ui/Table';
import Dropdown from '../../../components/ui/Dropdown';

/* ─── Constants ─── */
const TYPE_BADGE_VARIANT = {
    MCQ_SINGLE: 'info', MCQ_MULTI: 'info', TRUE_FALSE: 'default',
    SHORT_ANSWER: 'warning', ESSAY: 'warning', FILL_IN_THE_BLANK: 'warning',
    ORDERING: 'success', MATCH_THE_FOLLOWING: 'success',
    CODE_SNIPPET: 'danger', IMAGE_BASED: 'default',
};
const DIFF_VARIANT = { EASY: 'success', MEDIUM: 'warning', HARD: 'danger' };

const OPEN_ENDED_TYPES = ['ESSAY', 'SHORT_ANSWER'];
const MCQ_TYPES = ['MCQ_SINGLE', 'MCQ_MULTI'];
const SINGLE_ANSWER_TYPES = ['SHORT_ANSWER', 'FILL_IN_THE_BLANK'];

/* ═══════════════════════════════════════ */
export default function QuestionBank() {
    /* ─── State ─── */
    const [page, setPage] = useState(0);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [diffFilter, setDiffFilter] = useState('');
    const [tagFilter, setTagFilter] = useState('');
    const [modalState, setModalState] = useState({ mode: null, question: null });
    const [deleteModal, setDeleteModal] = useState({ open: false, questionUuid: null });

    const closeModal = useCallback(() => setModalState({ mode: null, question: null }), []);

    /* ─── Data fetching ─── */
    const { data: response, isLoading, refetch } = useQuery({
        queryKey: ['admin-questions', page, search, typeFilter, diffFilter, tagFilter],
        queryFn: () => getAllQuestions({
            page, size: 20, search: search || undefined,
            type: typeFilter || undefined,
            difficulty: diffFilter || undefined,
            tagUuid: tagFilter || undefined,
        }),
        staleTime: 30_000,
        keepPreviousData: true,
    });
    const questions = response?.data?.content ?? [];
    const totalPages = response?.data?.totalPages ?? 0;
    const totalElements = response?.data?.totalElements ?? 0;

    const { data: tagsResp } = useQuery({
        queryKey: ['tags'],
        queryFn: getAllTags,
        staleTime: 60_000,
    });
    const tags = tagsResp?.data ?? [];

    /* ─── Mutations ─── */
    const createMut = useMutation({
        mutationFn: (payload) => createQuestion(payload),
        onSuccess: () => { toast.success('Question created successfully!'); refetch(); closeModal(); },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to create question'),
    });
    const updateMut = useMutation({
        mutationFn: ({ uuid, payload }) => updateQuestion(uuid, payload),
        onSuccess: () => { toast.success('Question updated successfully!'); refetch(); closeModal(); },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to update question'),
    });
    const deleteMut = useMutation({
        mutationFn: (uuid) => deleteQuestion(uuid),
        onSuccess: () => { toast.success('Question deleted'); setDeleteModal({ open: false, questionUuid: null }); refetch(); },
        onError: () => toast.error('Failed to delete question'),
    });
    const importMut = useMutation({
        mutationFn: (formData) => bulkImportQuestions(formData),
        onSuccess: (result) => {
            toast.success(`${result.data.imported} questions imported successfully!`);
            if (result.data.failed > 0) toast.error(`${result.data.failed} rows failed to import`);
            refetch(); closeModal();
        },
        onError: () => toast.error('Bulk import failed'),
    });

    /* ─── Filter helpers ─── */
    const hasActiveFilter = search || typeFilter || diffFilter || tagFilter;
    const clearFilters = () => { setSearch(''); setTypeFilter(''); setDiffFilter(''); setTagFilter(''); setPage(0); };

    const typeOptions = [{ value: '', label: 'All Types' }, ...QUESTION_TYPES];
    const diffOptions = [{ value: '', label: 'All Difficulties' }, ...DIFFICULTY_LEVELS];
    const tagOptions = [{ value: '', label: 'All Tags' }, ...tags.map(t => ({ value: t.uuid, label: t.name }))];

    /* ─── Table columns ─── */
    const columns = [
        {
            key: 'questionText', label: 'Question',
            render: (q) => (
                <button onClick={() => setModalState({ mode: 'view', question: q })} className="text-left group max-w-xs">
                    <span className="font-semibold text-gray-900 group-hover:text-primary transition-colors block">
                        {truncateText(q.questionText, 80)}
                    </span>
                    <Badge variant={TYPE_BADGE_VARIANT[q.questionType] || 'default'} size="sm">
                        {QUESTION_TYPES.find(t => t.value === q.questionType)?.label || q.questionType}
                    </Badge>
                </button>
            ),
        },
        {
            key: 'difficulty', label: 'Difficulty', align: 'center',
            render: (q) => <Badge variant={DIFF_VARIANT[q.difficulty] || 'default'} dot>{q.difficulty}</Badge>,
        },
        {
            key: 'marks', label: 'Marks', align: 'center',
            render: (q) => (
                <div className="text-center">
                    <span className="font-bold text-gray-900">{q.marks}</span>
                    {q.negativeMarks > 0 && (
                        <span className="block text-xs text-red-500 mt-0.5">-{q.negativeMarks}</span>
                    )}
                </div>
            ),
        },
        {
            key: 'tags', label: 'Tags', align: 'center',
            render: (q) => {
                if (!q.tags?.length) return <span className="text-gray-300">—</span>;
                return (
                    <div className="flex flex-wrap gap-1 justify-center">
                        {q.tags.slice(0, 2).map(t => (
                            <span key={t.uuid} className="text-[11px] px-2 py-0.5 rounded-full bg-primary-light text-primary font-medium">{t.name}</span>
                        ))}
                        {q.tags.length > 2 && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">+{q.tags.length - 2} more</span>
                        )}
                    </div>
                );
            },
        },
        {
            key: 'options', label: 'Options', align: 'center',
            render: (q) => (
                <span className="text-sm text-gray-600">
                    {OPEN_ENDED_TYPES.includes(q.questionType) ? 'Open ended' : `${q.options?.length || 0} options`}
                </span>
            ),
        },
        {
            key: 'createdAt', label: 'Created', align: 'center',
            render: (q) => <span className="text-xs text-gray-500 whitespace-nowrap">{formatDate(q.createdAt)}</span>,
        },
        {
            key: 'actions', label: '', width: '48px', align: 'center',
            render: (q) => (
                <Dropdown
                    trigger={<button className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"><MoreVertical size={16} /></button>}
                    items={[
                        { label: 'View', icon: <Eye size={14} />, onClick: () => setModalState({ mode: 'view', question: q }) },
                        { label: 'Edit', icon: <Edit3 size={14} />, onClick: () => setModalState({ mode: 'edit', question: q }) },
                        { divider: true },
                        { label: 'Delete', icon: <Trash2 size={14} />, danger: true, onClick: () => setDeleteModal({ open: true, questionUuid: q.questionUuid }) },
                    ]}
                />
            ),
        },
    ];

    /* ═══════════════════════════════════════ */
    /* RENDER */
    /* ═══════════════════════════════════════ */
    return (
        <div className="space-y-6">
            {/* ─── Header ─── */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Question Bank</h1>
                    <p className="text-sm text-gray-500 mt-0.5">{totalElements} questions total</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" icon={<Upload size={16} />}
                        onClick={() => setModalState({ mode: 'import', question: null })}>
                        Bulk Import CSV
                    </Button>
                    <Button icon={<Plus size={16} />}
                        onClick={() => setModalState({ mode: 'create', question: null })}>
                        Add Question
                    </Button>
                </div>
            </div>

            {/* ─── Filters ─── */}
            <Card padding="sm">
                <div className="flex flex-col sm:flex-row gap-3 p-2">
                    <div className="flex-1">
                        <Input name="search" placeholder="Search questions..."
                            prefixIcon={<Search size={16} />} value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(0); }} />
                    </div>
                    <div className="w-full sm:w-44">
                        <Select name="typeFilter" options={typeOptions} value={typeFilter}
                            onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }} />
                    </div>
                    <div className="w-full sm:w-44">
                        <Select name="diffFilter" options={diffOptions} value={diffFilter}
                            onChange={(e) => { setDiffFilter(e.target.value); setPage(0); }} />
                    </div>
                    <div className="w-full sm:w-44">
                        <Select name="tagFilter" options={tagOptions} value={tagFilter}
                            onChange={(e) => { setTagFilter(e.target.value); setPage(0); }} />
                    </div>
                    {hasActiveFilter && (
                        <Button variant="ghost" size="sm" onClick={clearFilters}
                            className="whitespace-nowrap self-center">
                            Clear Filters
                        </Button>
                    )}
                </div>
            </Card>

            {/* ─── Table ─── */}
            {!isLoading && questions.length === 0 ? (
                <Card padding="lg">
                    <EmptyState icon={<HelpCircle size={48} />}
                        title="No questions found"
                        description="Add your first question or adjust your filters"
                        action={{ label: 'Add Question', onClick: () => setModalState({ mode: 'create', question: null }) }} />
                </Card>
            ) : (
                <Table columns={columns} data={questions} loading={isLoading}
                    emptyMessage="No questions match your filters"
                    emptyIcon={<HelpCircle size={40} className="text-gray-300" />} />
            )}

            {/* ─── Pagination ─── */}
            <Pagination currentPage={page} totalPages={totalPages}
                totalElements={totalElements} onPageChange={(p) => setPage(p)} />

            {/* ─── Create / Edit Modal ─── */}
            <QuestionFormModal
                modalState={modalState} closeModal={closeModal}
                createMut={createMut} updateMut={updateMut} tags={tags} />

            {/* ─── View Modal ─── */}
            <ViewQuestionModal modalState={modalState} closeModal={closeModal}
                setModalState={setModalState} />

            {/* ─── Import Modal ─── */}
            <ImportModal modalState={modalState} closeModal={closeModal} importMut={importMut} />

            {/* ─── Delete Modal ─── */}
            <Modal isOpen={deleteModal.open}
                onClose={() => setDeleteModal({ open: false, questionUuid: null })}
                title="Delete Question" size="sm"
                footer={<>
                    <Button variant="outline" onClick={() => setDeleteModal({ open: false, questionUuid: null })}>Cancel</Button>
                    <Button variant="danger" loading={deleteMut.isPending}
                        onClick={() => deleteMut.mutate(deleteModal.questionUuid)}>Delete</Button>
                </>}>
                <div className="text-center">
                    <div className="mx-auto w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
                        <AlertTriangle size={28} className="text-red-500" />
                    </div>
                    <p className="text-sm text-gray-700 font-medium mb-2">Are you sure you want to delete this question?</p>
                    <p className="text-xs text-gray-400">This cannot be undone. The question will be removed from all quizzes it is linked to.</p>
                </div>
            </Modal>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════ */
/* SUB-COMPONENT: Question Form Modal (Create / Edit)        */
/* ═══════════════════════════════════════════════════════════ */
function QuestionFormModal({ modalState, closeModal, createMut, updateMut, tags }) {
    const isOpen = modalState.mode === 'create' || modalState.mode === 'edit';
    const isEdit = modalState.mode === 'edit';

    const { data: detailResp, isLoading: detailLoading } = useQuery({
        queryKey: ['question', modalState.question?.questionUuid],
        queryFn: () => getQuestionByUuid(modalState.question.questionUuid),
        enabled: isEdit && !!modalState.question?.questionUuid,
    });
    const detail = detailResp?.data;

    const {
        register, handleSubmit, control, watch, reset, setValue,
        formState: { errors },
    } = useForm({
        defaultValues: {
            questionText: '', questionType: 'MCQ_SINGLE', difficulty: 'EASY',
            marks: '', negativeMarks: '', explanation: '', hintText: '',
            mediaUrl: '', tagUuids: [], options: [
                { optionText: '', isCorrect: false, optionOrder: 1 },
                { optionText: '', isCorrect: false, optionOrder: 2 },
            ],
            trueFalseAnswer: 'True', shortAnswer: '', codeSnippet: '',
        },
    });
    const { fields: optFields, append: addOpt, remove: removeOpt, replace: replaceOpts } = useFieldArray({ control, name: 'options' });
    const questionType = watch('questionType');
    const selectedTags = watch('tagUuids');

    /* Pre-fill for edit */
    useEffect(() => {
        if (isEdit && detail) {
            const qType = detail.questionType;
            const base = {
                questionText: detail.questionText || '', questionType: qType,
                difficulty: detail.difficulty || 'EASY', marks: detail.marks || '',
                negativeMarks: detail.negativeMarks || '', explanation: detail.explanation || '',
                hintText: detail.hintText || '', mediaUrl: detail.mediaUrl || '',
                tagUuids: detail.tags?.map(t => t.uuid) || [],
            };
            if (qType === 'TRUE_FALSE') {
                const correct = detail.options?.find(o => o.isCorrect);
                base.trueFalseAnswer = correct?.optionText || 'True';
                base.options = []; base.shortAnswer = '';
            } else if (SINGLE_ANSWER_TYPES.includes(qType)) {
                base.shortAnswer = detail.options?.[0]?.optionText || '';
                base.options = [];
            } else if (qType === 'ESSAY') {
                base.options = []; base.shortAnswer = '';
            } else if (qType === 'CODE_SNIPPET') {
                base.codeSnippet = detail.mediaUrl || '';
                base.options = detail.options?.map((o, i) => ({
                    optionText: o.optionText, isCorrect: o.isCorrect, optionOrder: i + 1,
                })) || [];
            } else if (qType === 'MATCH_THE_FOLLOWING') {
                const terms = detail.options?.filter(o => !o.isCorrect)?.sort((a, b) => a.optionOrder - b.optionOrder) || [];
                const defs = detail.options?.filter(o => o.isCorrect)?.sort((a, b) => a.optionOrder - b.optionOrder) || [];
                base.matchPairs = terms.map((t, i) => ({ term: t.optionText, definition: defs[i]?.optionText || '' }));
                base.options = [];
            } else if (qType === 'ORDERING') {
                base.options = detail.options?.sort((a, b) => a.optionOrder - b.optionOrder)?.map((o, i) => ({
                    optionText: o.optionText, isCorrect: true, optionOrder: i + 1,
                })) || [];
            } else {
                base.options = detail.options?.sort((a, b) => a.optionOrder - b.optionOrder)?.map((o, i) => ({
                    optionText: o.optionText, isCorrect: o.isCorrect, optionOrder: i + 1,
                })) || [];
            }
            reset(base);
        }
        if (modalState.mode === 'create') {
            reset({
                questionText: '', questionType: 'MCQ_SINGLE', difficulty: 'EASY',
                marks: '', negativeMarks: '', explanation: '', hintText: '',
                mediaUrl: '', tagUuids: [], trueFalseAnswer: 'True', shortAnswer: '', codeSnippet: '',
                options: [
                    { optionText: '', isCorrect: false, optionOrder: 1 },
                    { optionText: '', isCorrect: false, optionOrder: 2 },
                ],
            });
        }
    }, [isEdit, detail, modalState.mode, reset]);

    /* Handle type change — reset options */
    const prevType = useRef(questionType);
    useEffect(() => {
        if (prevType.current !== questionType && !isEdit) {
            if (MCQ_TYPES.includes(questionType) || questionType === 'IMAGE_BASED' || questionType === 'CODE_SNIPPET') {
                replaceOpts([
                    { optionText: '', isCorrect: false, optionOrder: 1 },
                    { optionText: '', isCorrect: false, optionOrder: 2 },
                ]);
            } else if (questionType === 'ORDERING') {
                replaceOpts([
                    { optionText: '', isCorrect: true, optionOrder: 1 },
                    { optionText: '', isCorrect: true, optionOrder: 2 },
                ]);
            }
            setValue('shortAnswer', '');
            setValue('trueFalseAnswer', 'True');
            setValue('codeSnippet', '');
        }
        prevType.current = questionType;
    }, [questionType, isEdit, replaceOpts, setValue]);

    /* Build payload and submit */
    const onSubmit = (data) => {
        const payload = {
            questionText: data.questionText, questionType: data.questionType,
            difficulty: data.difficulty, defaultMarks: Number(data.marks),
            negativeMarks: Number(data.negativeMarks) || 0,
            explanation: data.explanation || undefined,
            hintText: data.hintText || undefined,
            mediaUrl: data.mediaUrl || undefined,
            tagUuids: data.tagUuids || [],
        };

        const qType = data.questionType;
        if (qType === 'TRUE_FALSE') {

            payload.options = [
                { optionText: 'True', isCorrect: data.trueFalseAnswer === 'True', optionOrder: 1 },
                { optionText: 'False', isCorrect: data.trueFalseAnswer === 'False', optionOrder: 2 },
            ];
        } else if (SINGLE_ANSWER_TYPES.includes(qType)) {
            payload.options = [{ optionText: data.shortAnswer, isCorrect: true, optionOrder: 1 }];
        } else if (qType === 'ESSAY') {
            payload.options = [];
        } else if (qType === 'CODE_SNIPPET') {
            payload.mediaUrl = data.codeSnippet || data.mediaUrl;
            payload.options = data.options.map((o, i) => ({
                optionText: o.optionText, isCorrect: o.isCorrect, optionOrder: i + 1,
            }));
        } else if (qType === 'MATCH_THE_FOLLOWING') {
            const pairs = data.matchPairs || [];
            payload.options = [
                ...pairs.map((p, i) => ({ optionText: p.term, isCorrect: false, optionOrder: i })),
                ...pairs.map((p, i) => ({ optionText: p.definition, isCorrect: true, optionOrder: i })),
            ];
        } else if (qType === 'ORDERING') {
            payload.options = data.options.map((o, i) => ({
                optionText: o.optionText, isCorrect: true, optionOrder: i + 1,
            }));
        } else {
            payload.options = data.options.map((o, i) => ({
                optionText: o.optionText, isCorrect: o.isCorrect, optionOrder: i + 1,
            }));
        }

        if (isEdit) {
            updateMut.mutate({ uuid: modalState.question.questionUuid, payload });
        } else {
            createMut.mutate(payload);
        }
    };

    const isSaving = createMut.isPending || updateMut.isPending;

    const handleRadioCorrect = (idx) => {
        optFields.forEach((_, i) => setValue(`options.${i}.isCorrect`, i === idx));
    };

    return (
        <Modal isOpen={isOpen} onClose={closeModal}
            title={isEdit ? 'Edit Question' : 'Add New Question'} size="lg"
            footer={<>
                <Button variant="outline" onClick={closeModal}>Cancel</Button>
                <Button loading={isSaving} onClick={handleSubmit(onSubmit)}>Save Question</Button>
            </>}>
            {isEdit && detailLoading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="h-8 w-8 rounded-full border-[3px] border-gray-200 border-t-primary animate-spin" />
                </div>
            ) : (
                <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                    {/* Question Text */}
                    <Textarea label="Question Text" name="questionText" required rows={3}
                        placeholder="Enter your question here..."
                        register={register('questionText', { required: 'Question text is required', minLength: { value: 5, message: 'Min 5 characters' } })}
                        error={errors.questionText?.message} />

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Select label="Question Type" name="questionType" required
                            options={QUESTION_TYPES}
                            register={register('questionType', { required: 'Required' })}
                            error={errors.questionType?.message} />
                        <Select label="Difficulty" name="difficulty" required
                            options={DIFFICULTY_LEVELS}
                            register={register('difficulty', { required: 'Required' })}
                            error={errors.difficulty?.message} />
                        <Input label="Marks" name="marks" type="number" required
                            placeholder="e.g. 5"
                            register={register('marks', { required: 'Required', min: { value: 0.5, message: 'Min 0.5' } })}
                            error={errors.marks?.message} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input label="Negative Marks" name="negativeMarks" type="number"
                            placeholder="e.g. 1 (optional)" hint="Marks deducted for wrong answer"
                            register={register('negativeMarks', { min: { value: 0, message: 'Min 0' } })} />
                        <Input label="Hint" name="hintText" placeholder="Optional hint for students"
                            register={register('hintText')} />
                    </div>

                    <Textarea label="Explanation" name="explanation" rows={2}
                        placeholder="Explain the correct answer (shown after submission)"
                        register={register('explanation')} />

                    {/* Tags multi-select */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Tags</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {selectedTags?.map(uuid => {
                                const tag = tags.find(t => t.uuid === uuid);
                                return tag ? (
                                    <span key={uuid} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-primary-light text-primary font-medium">
                                        {tag.name}
                                        <button type="button" onClick={() => setValue('tagUuids', selectedTags.filter(u => u !== uuid))}
                                            className="hover:text-primary-hover"><X size={12} /></button>
                                    </span>
                                ) : null;
                            })}
                        </div>
                        <select className="w-full h-10 rounded-lg border border-gray-300 bg-white pl-3 pr-10 text-sm text-gray-900 appearance-none cursor-pointer transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            value="" onChange={(e) => {
                                const v = e.target.value;
                                if (v && !selectedTags?.includes(v)) setValue('tagUuids', [...(selectedTags || []), v]);
                            }}>
                            <option value="">Select tags...</option>
                            {tags.filter(t => !selectedTags?.includes(t.uuid)).map(t => (
                                <option key={t.uuid} value={t.uuid}>{t.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Image URL for IMAGE_BASED */}
                    {questionType === 'IMAGE_BASED' && (
                        <Input label="Image URL" name="mediaUrl" placeholder="https://... (image URL)"
                            register={register('mediaUrl')} />
                    )}

                    {/* Code snippet for CODE_SNIPPET */}
                    {questionType === 'CODE_SNIPPET' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Code Block</label>
                            <textarea rows={5} placeholder="// Paste your code snippet here"
                                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 font-mono placeholder:text-gray-400 resize-y transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                {...register('codeSnippet')} />
                        </div>
                    )}

                    {/* ─── Dynamic Options Section ─── */}
                    <div className="border-t border-gray-100 pt-5">
                        <h4 className="text-sm font-semibold text-gray-800 mb-3">Answer Options</h4>

                        {/* MCQ_SINGLE / IMAGE_BASED / CODE_SNIPPET */}
                        {(questionType === 'MCQ_SINGLE' || questionType === 'IMAGE_BASED' || questionType === 'CODE_SNIPPET') && (
                            <div className="space-y-2.5">
                                {optFields.map((f, idx) => (
                                    <div key={f.id} className="flex items-center gap-2.5">
                                        <input type="radio" name="correctOption" checked={watch(`options.${idx}.isCorrect`)}
                                            onChange={() => handleRadioCorrect(idx)}
                                            className="w-4 h-4 text-primary accent-primary cursor-pointer" />
                                        <input type="text" placeholder={`Option ${idx + 1}`}
                                            className="flex-1 h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                            {...register(`options.${idx}.optionText`, { required: 'Required' })} />
                                        <button type="button" disabled={optFields.length <= 2}
                                            onClick={() => removeOpt(idx)}
                                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                                            <X size={16} />
                                        </button>
                                    </div>
                                ))}
                                {optFields.length < 6 && (
                                    <Button type="button" variant="ghost" size="sm" icon={<Plus size={14} />}
                                        onClick={() => addOpt({ optionText: '', isCorrect: false, optionOrder: optFields.length + 1 })}>
                                        Add Option
                                    </Button>
                                )}
                            </div>
                        )}

                        {/* MCQ_MULTI */}
                        {questionType === 'MCQ_MULTI' && (
                            <div className="space-y-2.5">
                                {optFields.map((f, idx) => (
                                    <div key={f.id} className="flex items-center gap-2.5">
                                        <input type="checkbox" checked={watch(`options.${idx}.isCorrect`)}
                                            onChange={(e) => setValue(`options.${idx}.isCorrect`, e.target.checked)}
                                            className="w-4 h-4 text-primary accent-primary rounded cursor-pointer" />
                                        <input type="text" placeholder={`Option ${idx + 1}`}
                                            className="flex-1 h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                            {...register(`options.${idx}.optionText`, { required: 'Required' })} />
                                        <button type="button" disabled={optFields.length <= 2}
                                            onClick={() => removeOpt(idx)}
                                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                                            <X size={16} />
                                        </button>
                                    </div>
                                ))}
                                {optFields.length < 6 && (
                                    <Button type="button" variant="ghost" size="sm" icon={<Plus size={14} />}
                                        onClick={() => addOpt({ optionText: '', isCorrect: false, optionOrder: optFields.length + 1 })}>
                                        Add Option
                                    </Button>
                                )}
                            </div>
                        )}

                        {/* TRUE_FALSE */}
                        {questionType === 'TRUE_FALSE' && (
                            <div className="flex gap-4">
                                {['True', 'False'].map(val => (
                                    <label key={val} className={`flex items-center gap-2.5 px-5 py-3 rounded-xl border-2 cursor-pointer transition-all duration-200 ${watch('trueFalseAnswer') === val ? 'border-primary bg-primary-light text-primary font-semibold' : 'border-gray-200 hover:border-gray-300'}`}>
                                        <input type="radio" value={val} {...register('trueFalseAnswer')}
                                            className="w-4 h-4 accent-primary" />
                                        {val}
                                    </label>
                                ))}
                            </div>
                        )}

                        {/* SHORT_ANSWER / FILL_IN_THE_BLANK */}
                        {SINGLE_ANSWER_TYPES.includes(questionType) && (
                            <Textarea name="shortAnswer" rows={2}
                                placeholder="Enter correct answer or keywords (student answer will be checked against this)"
                                register={register('shortAnswer', { required: 'Answer is required' })}
                                error={errors.shortAnswer?.message} />
                        )}

                        {/* ESSAY */}
                        {questionType === 'ESSAY' && (
                            <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100">
                                <Info size={20} className="text-blue-500 mt-0.5 flex-shrink-0" />
                                <p className="text-sm text-blue-700">Essay questions are manually graded by the admin. No correct answer options required.</p>
                            </div>
                        )}

                        {/* ORDERING */}
                        {questionType === 'ORDERING' && (
                            <div className="space-y-2.5">
                                {optFields.map((f, idx) => (
                                    <div key={f.id} className="flex items-center gap-2.5">
                                        <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                                            {idx + 1}
                                        </span>
                                        <GripVertical size={16} className="text-gray-300 flex-shrink-0" />
                                        <input type="text" placeholder={`Item ${idx + 1}`}
                                            className="flex-1 h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                            {...register(`options.${idx}.optionText`, { required: 'Required' })} />
                                        <button type="button" disabled={optFields.length <= 2}
                                            onClick={() => removeOpt(idx)}
                                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                                            <X size={16} />
                                        </button>
                                    </div>
                                ))}
                                {optFields.length < 8 && (
                                    <Button type="button" variant="ghost" size="sm" icon={<Plus size={14} />}
                                        onClick={() => addOpt({ optionText: '', isCorrect: true, optionOrder: optFields.length + 1 })}>
                                        Add Item
                                    </Button>
                                )}
                            </div>
                        )}

                        {/* MATCH_THE_FOLLOWING */}
                        {questionType === 'MATCH_THE_FOLLOWING' && <MatchPairsSection control={control} register={register} watch={watch} setValue={setValue} />}
                    </div>
                </form>
            )}
        </Modal>
    );
}

/* ─── Match Pairs Sub-component ─── */
function MatchPairsSection({ control, register, watch, setValue }) {
    const { fields, append, remove } = useFieldArray({ control, name: 'matchPairs' });

    useEffect(() => {
        if (!fields.length) {
            append({ term: '', definition: '' });
            append({ term: '', definition: '' });
        }
    }, []);

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-[1fr_1fr_40px] gap-2 text-xs font-semibold text-gray-500 px-1">
                <span>Question Items</span><span>Match Items</span><span />
            </div>
            {fields.map((f, idx) => (
                <div key={f.id} className="grid grid-cols-[1fr_1fr_40px] gap-2">
                    <input type="text" placeholder={`Term ${idx + 1}`}
                        className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        {...register(`matchPairs.${idx}.term`, { required: true })} />
                    <input type="text" placeholder={`Definition ${idx + 1}`}
                        className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        {...register(`matchPairs.${idx}.definition`, { required: true })} />
                    <button type="button" disabled={fields.length <= 2} onClick={() => remove(idx)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors self-center">
                        <X size={16} />
                    </button>
                </div>
            ))}
            {fields.length < 8 && (
                <Button type="button" variant="ghost" size="sm" icon={<Plus size={14} />}
                    onClick={() => append({ term: '', definition: '' })}>
                    Add Pair
                </Button>
            )}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════ */
/* SUB-COMPONENT: View Question Modal                         */
/* ═══════════════════════════════════════════════════════════ */
function ViewQuestionModal({ modalState, closeModal, setModalState }) {
    const isOpen = modalState.mode === 'view';
    const q = modalState.question;
    if (!isOpen || !q) return null;

    const typeLabel = QUESTION_TYPES.find(t => t.value === q.questionType)?.label || q.questionType;

    return (
        <Modal isOpen={isOpen} onClose={closeModal} title="Question Preview" size="md"
            footer={<>
                <Button variant="outline" onClick={closeModal}>Close</Button>
                <Button onClick={() => setModalState({ mode: 'edit', question: q })}>Edit</Button>
            </>}>
            <div className="space-y-5">
                {/* Question text */}
                <p className="text-base font-semibold text-gray-900 leading-relaxed">{q.questionText}</p>

                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                    <Badge variant={TYPE_BADGE_VARIANT[q.questionType] || 'default'}>{typeLabel}</Badge>
                    <Badge variant={DIFF_VARIANT[q.difficulty] || 'default'} dot>{q.difficulty}</Badge>
                    <Badge variant="default">{q.marks} marks</Badge>
                </div>

                {/* Tags */}
                {q.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {q.tags.map(t => (
                            <span key={t.uuid} className="text-xs px-2.5 py-1 rounded-full bg-primary-light text-primary font-medium">{t.name}</span>
                        ))}
                    </div>
                )}

                {/* Options */}
                <div className="border-t border-gray-100 pt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">
                        {OPEN_ENDED_TYPES.includes(q.questionType) ? 'Answer' : 'Options'}
                    </h4>

                    {(MCQ_TYPES.includes(q.questionType) || q.questionType === 'TRUE_FALSE' || q.questionType === 'IMAGE_BASED' || q.questionType === 'CODE_SNIPPET') && (
                        <div className="space-y-2">
                            {q.options?.sort((a, b) => a.optionOrder - b.optionOrder).map((o, i) => (
                                <div key={i} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 transition-colors ${o.isCorrect ? 'border-emerald-300 bg-emerald-50' : 'border-gray-100 bg-gray-50/50'}`}>
                                    {o.isCorrect ? <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" /> : <div className="w-[18px] h-[18px] rounded-full border-2 border-gray-300 flex-shrink-0" />}
                                    <span className={`text-sm ${o.isCorrect ? 'font-semibold text-emerald-800' : 'text-gray-700'}`}>{o.optionText}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {SINGLE_ANSWER_TYPES.includes(q.questionType) && (
                        <div className="px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-800 font-medium">
                            {q.options?.[0]?.optionText || '—'}
                        </div>
                    )}

                    {q.questionType === 'ESSAY' && (
                        <p className="text-sm text-gray-500 italic">Open ended — manually graded</p>
                    )}

                    {q.questionType === 'ORDERING' && (
                        <div className="space-y-2">
                            {q.options?.sort((a, b) => a.optionOrder - b.optionOrder).map((o, i) => (
                                <div key={i} className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-100">
                                    <span className="w-7 h-7 rounded-lg bg-primary-light flex items-center justify-center text-xs font-bold text-primary">{i + 1}</span>
                                    <span className="text-sm text-gray-700">{o.optionText}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {q.questionType === 'MATCH_THE_FOLLOWING' && (() => {
                        const terms = q.options?.filter(o => !o.isCorrect)?.sort((a, b) => a.optionOrder - b.optionOrder) || [];
                        const defs = q.options?.filter(o => o.isCorrect)?.sort((a, b) => a.optionOrder - b.optionOrder) || [];
                        return (
                            <div className="space-y-2">
                                {terms.map((t, i) => (
                                    <div key={i} className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
                                        <div className="px-3 py-2 rounded-lg bg-blue-50 border border-blue-100 text-sm text-blue-800">{t.optionText}</div>
                                        <span className="text-gray-300">↔</span>
                                        <div className="px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-100 text-sm text-emerald-800">{defs[i]?.optionText}</div>
                                    </div>
                                ))}
                            </div>
                        );
                    })()}
                </div>

                {/* Explanation */}
                {q.explanation && (
                    <div className="border-t border-gray-100 pt-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Explanation</h4>
                        <div className="px-4 py-3 rounded-xl bg-amber-50 border border-amber-100 text-sm text-amber-900">{q.explanation}</div>
                    </div>
                )}

                {/* Hint */}
                {q.hintText && (
                    <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Hint</h4>
                        <p className="text-sm text-gray-600">{q.hintText}</p>
                    </div>
                )}
            </div>
        </Modal>
    );
}

/* ═══════════════════════════════════════════════════════════ */
/* SUB-COMPONENT: Import Modal                                */
/* ═══════════════════════════════════════════════════════════ */
function ImportModal({ modalState, closeModal, importMut }) {
    const isOpen = modalState.mode === 'import';
    const [file, setFile] = useState(null);
    const [importResult, setImportResult] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (!isOpen) { setFile(null); setImportResult(null); }
    }, [isOpen]);

    const downloadTemplate = () => {
        const csv = 'questionText,questionType,difficulty,marks,negativeMarks,explanation,option1,option2,option3,option4,correctOption\n';
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'question_import_template.csv'; a.click();
        URL.revokeObjectURL(url);
    };

    const handleFile = (f) => { if (f && f.name.endsWith('.csv')) setFile(f); else toast.error('Only CSV files are accepted'); };
    const handleDrop = (e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); };

    const handleImport = async () => {
        if (!file) return;
        const fd = new FormData(); fd.append('file', file);
        try {
            const result = await importMut.mutateAsync(fd);
            setImportResult(result.data);
        } catch { /* handled by mutation onError */ }
    };

    return (
        <Modal isOpen={isOpen} onClose={closeModal} title="Bulk Import Questions" size="md"
            footer={<>
                <Button variant="outline" onClick={closeModal}>Cancel</Button>
                <Button disabled={!file} loading={importMut.isPending} onClick={handleImport}>Import</Button>
            </>}>
            <div className="space-y-6">
                {/* Step 1 */}
                <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-2">Step 1 — Download Template</h4>
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100 mb-3">
                        <Info size={18} className="text-blue-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-blue-700">Download the CSV template and fill in your questions. Each row represents one question.</p>
                    </div>
                    <Button variant="outline" size="sm" icon={<Download size={14} />} onClick={downloadTemplate}>Download Template</Button>
                </div>

                {/* Step 2 */}
                <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-2">Step 2 — Upload File</h4>
                    {!file ? (
                        <div onClick={() => fileInputRef.current?.click()}
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={handleDrop}
                            className={`flex flex-col items-center justify-center gap-3 py-10 px-6 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 ${dragOver ? 'border-primary bg-primary-light' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}>
                            <Upload size={36} className="text-gray-300" />
                            <p className="text-sm font-medium text-gray-600">Drag & drop your CSV file here</p>
                            <p className="text-xs text-gray-400">or click to browse</p>
                            <input ref={fileInputRef} type="file" accept=".csv" className="hidden"
                                onChange={(e) => handleFile(e.target.files[0])} />
                        </div>
                    ) : (
                        <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-200">
                            <div className="flex items-center gap-3">
                                <FileText size={20} className="text-primary" />
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                    <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
                                </div>
                            </div>
                            <button onClick={() => setFile(null)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                                <X size={16} />
                            </button>
                        </div>
                    )}
                </div>

                {/* Import Results */}
                {importResult && (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
                            <CheckCircle2 size={16} /> {importResult.imported} questions imported
                        </div>
                        {importResult.failed > 0 && (
                            <div className="flex items-center gap-2 text-sm font-medium text-red-600">
                                <XCircle size={16} /> {importResult.failed} rows failed
                            </div>
                        )}
                        {importResult.errors?.length > 0 && (
                            <div className="max-h-40 overflow-y-auto rounded-lg border border-red-100 bg-red-50 p-3 space-y-1">
                                {importResult.errors.map((e, i) => (
                                    <p key={i} className="text-xs text-red-700">Row {e.row}: {e.reason}</p>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Modal>
    );
}