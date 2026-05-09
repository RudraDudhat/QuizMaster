import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
    ArrowLeft, CheckCircle2, XCircle, Hourglass, FileText, AlertCircle,
} from 'lucide-react';
import { getAttemptForGrading, gradeEssayAnswer } from '../../../api/grading.api';
import Card from '../../../components/ui/Card';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Textarea from '../../../components/common/Textarea';
import Badge from '../../../components/common/Badge';

/**
 * One pending-essay grading row. Holds its own form state so different
 * questions can be graded independently.
 */
function EssayCard({ attemptUuid, q, onGraded }) {
    const isPending = q.isCorrect == null && q.questionType === 'ESSAY' && !q.isSkipped;
    const queryClient = useQueryClient();

    const [marks, setMarks] = useState(
        q.marksAwarded != null ? String(q.marksAwarded) : ''
    );
    const [note, setNote] = useState('');
    const [verdict, setVerdict] = useState(
        q.isCorrect == null ? null : q.isCorrect ? 'correct' : 'wrong'
    );

    const gradeMut = useMutation({
        mutationFn: (payload) => gradeEssayAnswer(attemptUuid, q.questionUuid, payload),
        onSuccess: () => {
            toast.success('Answer graded');
            queryClient.invalidateQueries({ queryKey: ['admin-grading-attempt', attemptUuid] });
            queryClient.invalidateQueries({ queryKey: ['admin-grading-pending'] });
            onGraded?.();
        },
        onError: (err) =>
            toast.error(err.response?.data?.message || 'Failed to grade answer'),
    });

    const submit = (asCorrect) => {
        const numericMarks = Number(marks);
        if (Number.isNaN(numericMarks) || numericMarks < 0) {
            toast.error('Enter a valid non-negative mark');
            return;
        }
        if (numericMarks > q.marks) {
            toast.error(`Cannot exceed max marks (${q.marks})`);
            return;
        }
        setVerdict(asCorrect ? 'correct' : 'wrong');
        gradeMut.mutate({
            marksAwarded: numericMarks,
            isCorrect: asCorrect,
            note: note.trim() || null,
        });
    };

    return (
        <Card padding="lg" shadow="sm" className="bg-[var(--color-bg-card)]">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
                <div className="flex items-center gap-2 min-w-0">
                    <FileText size={16} className="text-[var(--color-text-secondary)] flex-shrink-0" aria-hidden="true" />
                    <h3 className="text-base font-extrabold text-[var(--color-text-primary)]">
                        {q.questionText}
                    </h3>
                </div>
                <div className="flex flex-wrap gap-1.5">
                    <Badge variant="default">Essay</Badge>
                    <Badge variant="default">Max: {q.marks}</Badge>
                    {isPending ? (
                        <Badge variant="warning" dot>
                            Pending
                        </Badge>
                    ) : verdict === 'correct' ? (
                        <Badge variant="success" dot>
                            Approved
                        </Badge>
                    ) : (
                        <Badge variant="danger" dot>
                            Rejected
                        </Badge>
                    )}
                </div>
            </div>

            {/* Student answer */}
            <div className="mb-4">
                <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-secondary)] mb-2">
                    Student's answer
                </p>
                {q.textAnswer ? (
                    <div
                        className="rounded-xl border-2 border-[var(--color-border-soft)] bg-[var(--color-bg-muted)] px-4 py-3 whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-text-primary)]"
                    >
                        {q.textAnswer}
                    </div>
                ) : (
                    <div className="rounded-xl border-2 border-dashed border-[var(--color-border-soft)] bg-[var(--color-bg-muted)] px-4 py-6 text-center text-sm text-[var(--color-text-muted)] italic">
                        Student left this question blank.
                    </div>
                )}
            </div>

            {/* Grading form */}
            <div className="grid sm:grid-cols-[1fr_2fr] gap-4 mb-4">
                <Input
                    label="Marks awarded"
                    type="number"
                    min={0}
                    max={q.marks}
                    step="0.5"
                    value={marks}
                    onChange={(e) => setMarks(e.target.value)}
                    hint={`0 to ${q.marks}`}
                />
                <Textarea
                    label="Note (optional)"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Feedback the student will see in their review."
                    rows={2}
                />
            </div>

            <div className="flex flex-wrap gap-3">
                <Button
                    variant="primary"
                    icon={<CheckCircle2 size={16} />}
                    loading={gradeMut.isPending && verdict === 'correct'}
                    disabled={gradeMut.isPending}
                    onClick={() => submit(true)}
                >
                    Approve
                </Button>
                <Button
                    variant="danger"
                    icon={<XCircle size={16} />}
                    loading={gradeMut.isPending && verdict === 'wrong'}
                    disabled={gradeMut.isPending}
                    onClick={() => submit(false)}
                >
                    Reject
                </Button>
                {!isPending && (
                    <span className="ml-auto self-center text-xs text-[var(--color-text-muted)]">
                        Already graded — submitting again will overwrite.
                    </span>
                )}
            </div>
        </Card>
    );
}

export default function GradingReview() {
    const { attemptUuid } = useParams();
    const navigate = useNavigate();

    const { data: response, isLoading, isError } = useQuery({
        queryKey: ['admin-grading-attempt', attemptUuid],
        queryFn: () => getAttemptForGrading(attemptUuid),
        staleTime: 0,
    });

    const review = response?.data;
    const allQuestions = review?.questions ?? [];
    const essayQuestions = allQuestions.filter((q) => q.questionType === 'ESSAY');
    const pendingCount = essayQuestions.filter(
        (q) => q.isCorrect == null && !q.isSkipped
    ).length;

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="skeleton h-10 w-60 rounded-xl" />
                <div className="skeleton h-32 rounded-2xl" />
                <div className="skeleton h-48 rounded-2xl" />
            </div>
        );
    }

    if (isError) {
        return (
            <Card padding="lg" className="text-center">
                <AlertCircle size={36} className="mx-auto text-[var(--color-danger)] mb-2" aria-hidden="true" />
                <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                    Couldn't load this attempt.
                </p>
                <Button onClick={() => navigate('/admin/grading')}>
                    Back to queue
                </Button>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3 flex-wrap">
                <Button
                    variant="outline"
                    size="sm"
                    icon={<ArrowLeft size={14} />}
                    onClick={() => navigate('/admin/grading')}
                >
                    Back
                </Button>
                <div className="min-w-0">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text-primary)] truncate">
                        {review?.quizTitle}
                    </h1>
                    <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
                        {essayQuestions.length} essay question{essayQuestions.length === 1 ? '' : 's'} in this attempt
                        {pendingCount > 0 && (
                            <>
                                {' • '}
                                <span className="text-[var(--color-warning)] font-semibold inline-flex items-center gap-1">
                                    <Hourglass size={12} aria-hidden="true" />
                                    {pendingCount} pending
                                </span>
                            </>
                        )}
                    </p>
                </div>
            </div>

            {essayQuestions.length === 0 ? (
                <Card padding="lg" className="text-center bg-[var(--color-block-cream)]">
                    <p className="text-sm text-[var(--color-text-secondary)]">
                        This attempt has no essay questions.
                    </p>
                </Card>
            ) : (
                <div className="space-y-4">
                    {essayQuestions.map((q) => (
                        <EssayCard key={q.questionUuid} attemptUuid={attemptUuid} q={q} />
                    ))}
                </div>
            )}
        </div>
    );
}
