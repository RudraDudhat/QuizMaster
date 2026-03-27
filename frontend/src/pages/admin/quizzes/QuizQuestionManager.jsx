import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
    Search, Plus, ArrowLeft, GripVertical, X, Clock,
    ClipboardList, HelpCircle, AlertTriangle, CheckCircle2,
} from 'lucide-react';
import {
    getQuestionsForQuiz, addQuestionToQuiz,
    removeQuestionFromQuiz, reorderQuestions,
} from '../../../api/quizQuestion.api';
import { getAllQuestions } from '../../../api/question.api';
import { getQuizByUuid } from '../../../api/quiz.api';
import { QUESTION_TYPES, DIFFICULTY_LEVELS } from '../../../utils/constants';
import { formatDuration, truncateText } from '../../../utils/formatters';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import Input from '../../../components/common/Input';
import Select from '../../../components/common/Select';
import Modal from '../../../components/common/Modal';
import Pagination from '../../../components/common/Pagination';
import EmptyState from '../../../components/common/EmptyState';
import Card from '../../../components/ui/Card';

/* ─── Badge variant maps ─── */
const TYPE_VARIANT = {
    MCQ_SINGLE: 'info', MCQ_MULTI: 'info', TRUE_FALSE: 'default',
    SHORT_ANSWER: 'warning', ESSAY: 'warning', FILL_IN_THE_BLANK: 'warning',
    ORDERING: 'success', MATCH_THE_FOLLOWING: 'success',
    CODE_SNIPPET: 'danger', IMAGE_BASED: 'default',
};
const DIFF_VARIANT = { EASY: 'success', MEDIUM: 'warning', HARD: 'danger' };

/* ═══════════════════════════════════════════ */
export default function QuizQuestionManager() {
    const { quizUuid } = useParams();
    const navigate = useNavigate();

    /* ─── State ─── */
    const [questionBankPage, setQuestionBankPage] = useState(0);
    const [bankSearch, setBankSearch] = useState('');
    const [bankTypeFilter, setBankTypeFilter] = useState('');
    const [bankDiffFilter, setBankDiffFilter] = useState('');
    const [addModal, setAddModal] = useState({ open: false, question: null });
    const [addServerErrors, setAddServerErrors] = useState({});
    const [removeModal, setRemoveModal] = useState({ open: false, questionUuid: null, questionText: '' });
    const [linkedQuestions, setLinkedQuestions] = useState([]);
    const clearAddServerErrors = useCallback(() => setAddServerErrors({}), []);

    /* ─── Data Fetching ─── */
    const { data: quizResponse } = useQuery({
        queryKey: ['quiz', quizUuid],
        queryFn: () => getQuizByUuid(quizUuid),
    });
    const quiz = quizResponse?.data;

    const { data: linkedResponse, isLoading: linkedLoading, refetch: refetchLinked } = useQuery({
        queryKey: ['quiz-questions', quizUuid],
        queryFn: () => getQuestionsForQuiz(quizUuid),
        staleTime: 30_000,
    });

    useEffect(() => {
        if (linkedResponse?.data) setLinkedQuestions(linkedResponse.data);
    }, [linkedResponse]);

    const { data: bankResponse, isLoading: bankLoading } = useQuery({
        queryKey: ['admin-questions', questionBankPage, bankSearch, bankTypeFilter, bankDiffFilter],
        queryFn: () => getAllQuestions({
            page: questionBankPage, size: 10,
            search: bankSearch || undefined,
            type: bankTypeFilter || undefined,
            difficulty: bankDiffFilter || undefined,
        }),
        staleTime: 30_000,
        keepPreviousData: true,
    });
    const bankQuestions = bankResponse?.data?.content ?? [];
    const bankTotalPages = bankResponse?.data?.totalPages ?? 0;

    const totalMarks = linkedQuestions.reduce((sum, q) => sum + (q.marks ?? 0), 0);

    /* ─── Mutations ─── */
    const addMut = useMutation({
        mutationFn: (payload) => addQuestionToQuiz(quizUuid, payload),
        onSuccess: () => {
            clearAddServerErrors();
            toast.success('Question added to quiz!');
            refetchLinked();
            setAddModal({ open: false, question: null });
        },
        onError: (err) => {
            const responseData = err.response?.data;
            const validationErrors = responseData?.data;

            if (
                responseData?.message === 'Validation failed'
                && validationErrors
                && typeof validationErrors === 'object'
                && !Array.isArray(validationErrors)
            ) {
                setAddServerErrors(validationErrors);
                const firstValidationMessage = Object.values(validationErrors).find(Boolean);
                toast.error(firstValidationMessage || 'Validation failed');
                return;
            }

            clearAddServerErrors();
            toast.error(responseData?.message || 'Failed to add question');
        },
    });
    const removeMut = useMutation({
        mutationFn: (questionUuid) => removeQuestionFromQuiz(quizUuid, questionUuid),
        onSuccess: () => { toast.success('Question removed from quiz'); refetchLinked(); setRemoveModal({ open: false, questionUuid: null, questionText: '' }); },
        onError: (err) => {
            const message = err?.response?.data?.message || 'Failed to remove question';
            toast.error(message);
        },
    });
    const reorderMut = useMutation({
        mutationFn: (orderedIds) => reorderQuestions(quizUuid, orderedIds),
        onSuccess: () => toast.success('Order saved'),
        onError: () => { toast.error('Failed to save order'); refetchLinked(); },
    });

    /* ─── Drag & Drop ─── */
    const dragIdx = useRef(null);
    const dragOverIdx = useRef(null);
    const [dragOverIndex, setDragOverIndex] = useState(null);

    const handleDragStart = (idx) => { dragIdx.current = idx; };
    const handleDragOver = (e, idx) => {
        e.preventDefault();
        dragOverIdx.current = idx;
        setDragOverIndex(idx);
    };
    const handleDragEnd = () => {
        if (dragIdx.current !== null && dragOverIdx.current !== null && dragIdx.current !== dragOverIdx.current) {
            const items = [...linkedQuestions];
            const [removed] = items.splice(dragIdx.current, 1);
            items.splice(dragOverIdx.current, 0, removed);
            setLinkedQuestions(items);
            reorderMut.mutate(items.map(q => q.uuid));
        }
        dragIdx.current = null;
        dragOverIdx.current = null;
        setDragOverIndex(null);
    };

    /* ─── Filter options ─── */
    const typeOptions = [{ value: '', label: 'All Types' }, ...QUESTION_TYPES];
    const diffOptions = [{ value: '', label: 'All Difficulties' }, ...DIFFICULTY_LEVELS];

    const goBack = () => navigate('/admin/quizzes/' + quizUuid + '/edit');

    /* ═══════════════════════ RENDER ═══════════════════════ */
    return (
        <div className="space-y-6">
            {/* ─── Page Header ─── */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button onClick={goBack}
                        className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Manage Questions</h1>
                        {quiz?.title && <p className="text-sm text-gray-500 mt-0.5">{quiz.title}</p>}
                    </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <InfoChip icon="📋" label={`${linkedQuestions.length} Questions`} />
                    <InfoChip icon="💯" label={`Total: ${totalMarks} marks`} />
                    <InfoChip icon="⏱️" label={quiz?.timeLimitSeconds ? formatDuration(quiz.timeLimitSeconds) : 'No limit'} />
                    <Button variant="outline" size="sm" onClick={goBack}>Back to Quiz</Button>
                </div>
            </div>

            {/* ─── Two-Panel Layout ─── */}
            <div className="grid grid-cols-1 md:grid-cols-[55fr_45fr] gap-6">
                {/* ═══ LEFT PANEL — Linked Questions ═══ */}
                <Card padding="md">
                    <div className="mb-5">
                        <h2 className="text-base font-bold text-gray-900">Questions in Quiz</h2>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {linkedQuestions.length} questions · {totalMarks} total marks
                        </p>
                    </div>

                    {linkedLoading ? (
                        <div className="space-y-3">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="skeleton h-[72px] rounded-xl" />
                            ))}
                        </div>
                    ) : linkedQuestions.length === 0 ? (
                        <EmptyState
                            icon={<ClipboardList size={48} />}
                            title="No questions added yet"
                            description="Search and add questions from the Question Bank on the right"
                        />
                    ) : (
                        <div className="space-y-2">
                            {linkedQuestions.map((q, idx) => (
                                <div
                                    key={q.id ?? q.questionUuid ?? `linked-q-${idx}`}
                                    draggable
                                    onDragStart={() => handleDragStart(idx)}
                                    onDragOver={(e) => handleDragOver(e, idx)}
                                    onDragEnd={handleDragEnd}
                                    className={`group flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all duration-150 cursor-grab active:cursor-grabbing
                                        ${dragOverIndex === idx ? 'border-primary border-dashed bg-primary-light/50' : 'border-gray-100 hover:border-gray-200 bg-white hover:bg-gray-50/50'}
                                        ${dragIdx.current === idx ? 'opacity-40' : ''}
                                    `}
                                >
                                    {/* Drag handle */}
                                    <GripVertical size={18} className="text-gray-300 flex-shrink-0" />

                                    {/* Order badge */}
                                    <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                                        #{q.displayOrder || idx + 1}
                                    </span>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 truncate">
                                            {truncateText(q.questionText, 60)}
                                        </p>
                                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                            <Badge variant={TYPE_VARIANT[q.questionType] || 'default'} size="sm">
                                                {QUESTION_TYPES.find(t => t.value === q.questionType)?.label || q.questionType}
                                            </Badge>
                                            <Badge variant={DIFF_VARIANT[q.difficulty] || 'default'} size="sm">
                                                {q.difficulty}
                                            </Badge>
                                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-semibold">
                                                {q.marks} marks
                                            </span>
                                        </div>
                                    </div>

                                    {/* Right side info */}
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        {q.perQuestionSecs > 0 && (
                                            <span className="flex items-center gap-1 text-[11px] text-gray-400">
                                                <Clock size={12} />
                                                {formatDuration(q.perQuestionSecs)}
                                            </span>
                                        )}
                                        {/* Pool toggle (visual only) */}
                                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${q.isInPool ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                                            {q.isInPool ? 'In Pool' : 'Excluded'}
                                        </span>
                                        {/* Remove */}
                                        <button onClick={() => setRemoveModal({ open: true, questionUuid: q.questionUuid, questionText: q.questionText })}
                                            className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all duration-150">
                                            <X size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                {/* ═══ RIGHT PANEL — Question Bank ═══ */}
                <Card padding="md">
                    <div className="mb-4">
                        <h2 className="text-base font-bold text-gray-900">Question Bank</h2>
                        <p className="text-sm text-gray-500 mt-0.5">Search and add questions to your quiz</p>
                    </div>

                    {/* Filters */}
                    <div className="space-y-3 mb-5">
                        <Input name="bankSearch" placeholder="Search questions..."
                            prefixIcon={<Search size={16} />} value={bankSearch}
                            onChange={(e) => { setBankSearch(e.target.value); setQuestionBankPage(0); }} />
                        <div className="grid grid-cols-2 gap-3">
                            <Select name="bankTypeFilter" options={typeOptions} value={bankTypeFilter}
                                onChange={(e) => { setBankTypeFilter(e.target.value); setQuestionBankPage(0); }} />
                            <Select name="bankDiffFilter" options={diffOptions} value={bankDiffFilter}
                                onChange={(e) => { setBankDiffFilter(e.target.value); setQuestionBankPage(0); }} />
                        </div>
                    </div>

                    {/* Bank List */}
                    {bankLoading ? (
                        <div className="space-y-3">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="skeleton h-[68px] rounded-xl" />
                            ))}
                        </div>
                    ) : bankQuestions.length === 0 ? (
                        <EmptyState icon={<HelpCircle size={48} />}
                            title="No questions found"
                            description="Try adjusting your search or filters" />
                    ) : (
                        <div className="space-y-2">
                            {bankQuestions.map((q, idx) => {
                                const qUuid = q.questionUuid || q.uuid;
                                const isLinked = linkedQuestions.some(lq => lq.questionUuid === qUuid);
                                return (
                                    <div key={qUuid ?? q.id ?? `bank-q-${questionBankPage}-${idx}`}
                                        className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-100 hover:border-gray-200 bg-white hover:bg-gray-50/50 transition-all duration-150">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 truncate">
                                                {truncateText(q.questionText, 55)}
                                            </p>
                                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                                <Badge variant={TYPE_VARIANT[q.questionType] || 'default'} size="sm">
                                                    {QUESTION_TYPES.find(t => t.value === q.questionType)?.label || q.questionType}
                                                </Badge>
                                                <Badge variant={DIFF_VARIANT[q.difficulty] || 'default'} size="sm">
                                                    {q.difficulty}
                                                </Badge>
                                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-semibold">
                                                    {q.marks} marks
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex-shrink-0">
                                            {isLinked ? (
                                                <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
                                                    <CheckCircle2 size={13} /> Added
                                                </span>
                                            ) : (
                                                <Button size="sm" icon={<Plus size={14} />}
                                                    onClick={() => setAddModal({ open: true, question: q })}>
                                                    Add
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Bank Pagination */}
                    <div className="mt-4">
                        <Pagination currentPage={questionBankPage} totalPages={bankTotalPages}
                            onPageChange={(p) => setQuestionBankPage(p)} />
                    </div>
                </Card>
            </div>

            {/* ═══ Add Modal ═══ */}
            <AddQuestionModal
                addModal={addModal}
                setAddModal={setAddModal}
                addMut={addMut}
                linkedCount={linkedQuestions.length}
                serverErrors={addServerErrors}
                clearServerErrors={clearAddServerErrors}
            />

            {/* ═══ Remove Modal ═══ */}
            <Modal isOpen={removeModal.open}
                onClose={() => setRemoveModal({ open: false, questionUuid: null, questionText: '' })}
                title="Remove Question" size="sm"
                footer={<>
                    <Button variant="outline" onClick={() => setRemoveModal({ open: false, questionUuid: null, questionText: '' })}>Cancel</Button>
                    <Button variant="danger" loading={removeMut.isPending}
                        onClick={() => removeMut.mutate(removeModal.questionUuid)}>Remove</Button>
                </>}>
                <div className="text-center">
                    <div className="mx-auto w-14 h-14 rounded-full bg-[var(--color-block-red)] border-2 border-[var(--color-border)] shadow-[2px_2px_0_var(--color-border)] flex items-center justify-center mb-4">
                        <AlertTriangle size={28} className="text-[var(--color-danger)]" />
                    </div>
                    <p className="text-sm text-[var(--color-text-secondary)] font-medium mb-2">Remove this question from the quiz?</p>
                    <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">{truncateText(removeModal.questionText, 80)}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">The question will remain in the Question Bank. Only the link to this quiz will be removed.</p>
                </div>
            </Modal>
        </div>
    );
}

/* ═══════════════════════════════════════════ */
/* InfoChip — small header stat chip          */
/* ═══════════════════════════════════════════ */
function InfoChip({ icon, label }) {
    return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200">
            <span>{icon}</span> {label}
        </span>
    );
}

/* ═══════════════════════════════════════════ */
/* AddQuestionModal                           */
/* ═══════════════════════════════════════════ */
function AddQuestionModal({ addModal, setAddModal, addMut, linkedCount, serverErrors, clearServerErrors }) {
    const q = addModal.question;
    const closeAdd = () => {
        clearServerErrors();
        setAddModal({ open: false, question: null });
    };

    const { register, handleSubmit, reset, watch, setValue, setError, clearErrors, formState: { errors } } = useForm({
        defaultValues: { marks: '', negativeMarks: 0, perQuestionSecs: '', displayOrder: '', isInPool: true },
    });

    useEffect(() => {
        if (addModal.open && q) {
            clearServerErrors();
            reset({
                marks: q.marks || '',
                negativeMarks: q.negativeMarks || 0,
                perQuestionSecs: '',
                displayOrder: linkedCount + 1,
                isInPool: true,
            });
        }
    }, [addModal.open, q, linkedCount, reset, clearServerErrors]);

    useEffect(() => {
        if (!serverErrors || typeof serverErrors !== 'object') return;

        const supportedFields = new Set(['marks', 'negativeMarks', 'perQuestionSecs', 'displayOrder', 'isInPool']);
        Object.entries(serverErrors).forEach(([field, message]) => {
            if (supportedFields.has(field) && message) {
                setError(field, { type: 'server', message });
            }
        });
    }, [serverErrors, setError]);

    const isInPool = watch('isInPool');

    const onSubmit = (values) => {
        const uuid = q.questionUuid || q.uuid;
        if (!uuid) {
            toast.error('Question UUID is missing');
            return;
        }
        addMut.mutate({
            questionUuid: uuid,
            marks: Number(values.marks),
            negativeMarks: Number(values.negativeMarks) || 0,
            displayOrder: Number(values.displayOrder),
            perQuestionSecs: values.perQuestionSecs ? Number(values.perQuestionSecs) : null,
            isInPool: values.isInPool,
        });
    };

    if (!q) return null;

    const typeLabel = QUESTION_TYPES.find(t => t.value === q.questionType)?.label || q.questionType;

    return (
        <Modal isOpen={addModal.open} onClose={closeAdd} title="Add Question to Quiz" size="md"
            footer={<>
                <Button variant="outline" onClick={closeAdd}>Cancel</Button>
                <Button loading={addMut.isPending} onClick={handleSubmit(onSubmit)}>Add to Quiz</Button>
            </>}>
            {/* Question preview */}
            <div className="mb-5 p-4 rounded-xl bg-[var(--color-block-cream)] border-2 border-[var(--color-border)] shadow-[2px_2px_0_var(--color-border)]">
                <p className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-1.5">Question</p>
                <p className="text-sm font-semibold text-[var(--color-text-primary)] leading-relaxed mb-2">{q.questionText}</p>
                <div className="flex gap-1.5">
                    <Badge variant={TYPE_VARIANT[q.questionType] || 'default'} size="sm">{typeLabel}</Badge>
                    <Badge variant={DIFF_VARIANT[q.difficulty] || 'default'} size="sm">{q.difficulty}</Badge>
                </div>
            </div>

            {/* Form */}
            <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Configure for this Quiz</h4>
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div className="grid grid-cols-2 gap-4">
                    <Input label="Marks" name="marks" type="number" required placeholder="e.g. 5"
                        hint="Override default marks for this quiz"
                        register={register('marks', {
                            required: 'Required',
                            min: { value: 0.5, message: 'Min 0.5' },
                            onChange: () => clearErrors('marks'),
                        })}
                        error={errors.marks?.message} />
                    <Input label="Negative Marks" name="negativeMarks" type="number" placeholder="e.g. 1"
                        hint="Marks deducted for wrong answer (0 = no penalty)"
                        register={register('negativeMarks', {
                            min: { value: 0, message: 'Min 0' },
                            onChange: () => clearErrors('negativeMarks'),
                        })}
                        error={errors.negativeMarks?.message} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <Input label="Per Question Time Limit" name="perQuestionSecs" type="number"
                        placeholder="Seconds (leave empty for quiz default)"
                        hint="Override quiz timer for this specific question"
                        register={register('perQuestionSecs', {
                            min: { value: 10, message: 'Min 10 seconds' },
                            onChange: () => clearErrors('perQuestionSecs'),
                        })}
                        error={errors.perQuestionSecs?.message} />
                    <Input label="Display Order" name="displayOrder" type="number" required placeholder="e.g. 1"
                        hint="Position in the quiz (can be reordered later)"
                        register={register('displayOrder', {
                            required: 'Required',
                            min: { value: 1, message: 'Min 1' },
                            onChange: () => clearErrors('displayOrder'),
                        })}
                        error={errors.displayOrder?.message} />
                </div>

                {/* Pool toggle */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--color-block-mint)] border-2 border-[var(--color-border)] shadow-[2px_2px_0_var(--color-border)]">
                    <div>
                        <p className="text-sm font-medium text-[var(--color-text-primary)]">Include in Pool</p>
                        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Uncheck to exclude from random pool selection</p>
                    </div>
                    <button type="button" onClick={() => setValue('isInPool', !isInPool)}
                        className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${isInPool ? 'bg-primary' : 'bg-gray-300'}`}>
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${isInPool ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                </div>
            </form>
        </Modal>
    );
}