import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
    ChevronRight, Lock, CheckCircle, Clock, Trophy, AlertTriangle,
    BookOpen, HelpCircle, Timer, Target, Shuffle, Eye, RefreshCw,
} from 'lucide-react';
import { getQuizDetail, startAttempt } from '../../../api/attempt.api';
import { formatPercentage, formatDuration, formatDate, formatDateTime } from '../../../utils/formatters';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/common/Badge';
import Button from '../../../components/common/Button';
import EmptyState from '../../../components/common/EmptyState';

// ─── Difficulty badge variant ─────────────────────────────
const diffVariant = (d) => d === 'EASY' ? 'success' : d === 'HARD' ? 'danger' : 'warning';
const typeVariant = (t) => t === 'EXAM' ? 'danger' : t === 'PRACTICE' ? 'info' : 'default';

// ─── Countdown hook ───────────────────────────────────────
function useCountdown(target) {
    const [left, setLeft] = useState(null);
    useEffect(() => {
        if (!target) return;
        const tick = () => {
            const ms = new Date(target) - Date.now();
            setLeft(ms > 0 ? ms : 0);
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [target]);
    if (left === null) return null;
    const s = Math.floor(left / 1000);
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}

// ─── Info box ─────────────────────────────────────────────
function InfoBox({ icon, label, value }) {
    return (
        <div style={{ background: 'var(--color-bg-muted)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {icon}
            </div>
            <div>
                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', fontWeight: 500 }}>{label}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)', marginTop: 1 }}>{value}</div>
            </div>
        </div>
    );
}

// ─── Rule item ────────────────────────────────────────────
function RuleItem({ icon, text, color }) {
    return (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--color-border-subtle)' }}>
            <span style={{ color: color ?? 'var(--color-success)', marginTop: 1, flexShrink: 0 }}>{icon}</span>
            <span style={{ fontSize: 13, color: 'var(--color-text-primary)', lineHeight: 1.5 }}>{text}</span>
        </div>
    );
}

// ─── Skeleton ─────────────────────────────────────────────
function Skeleton({ h = 16, w = '100%', mt = 0 }) {
    return <div className="skeleton" style={{ height: h, width: w, borderRadius: 8, marginTop: mt }} />;
}

// ════════════════════════════════════════════════════════
export default function QuizDetail() {
    const navigate = useNavigate();
    const { quizUuid } = useParams();

    const [accessCode, setAccessCode]     = useState('');
    const [accessCodeError, setAccessCodeError] = useState('');
    const [starting, setStarting]         = useState(false);

    const { data: response, isLoading, isError } = useQuery({
        queryKey: ['student-quiz-detail', quizUuid],
        queryFn:  () => getQuizDetail(quizUuid),
        staleTime: 30_000,
    });
    const quiz = response?.data;
    const requiresAccessCode = Boolean(quiz?.requiresAccessCode ?? quiz?.accessCode);

    // Countdown (for UPCOMING quizzes)
    const countdown = useCountdown(
        quiz?.quizStatus === 'UPCOMING' && quiz?.startsAt ? quiz.startsAt : null
    );
    const withinCountdown = quiz?.startsAt &&
        (new Date(quiz.startsAt) - Date.now()) < 86_400_000;

    // ── Start handler ─────────────────────────────────────
    const handleStartQuiz = async () => {
        const trimmedAccessCode = accessCode.trim();

        if (requiresAccessCode && !trimmedAccessCode) {
            setAccessCodeError('Access code is required to start this quiz.');
            return;
        }

        setStarting(true);
        setAccessCodeError('');
        try {
            const result = await startAttempt(quizUuid, { accessCode: trimmedAccessCode });
            const attemptUuid = result.data.attemptUuid;
            navigate(`/student/quiz/${attemptUuid}`, { state: { attemptData: result.data } });
        } catch (error) {
            const msg = error.response?.data?.message ?? '';
            if (msg.toLowerCase().includes('access code')) {
                setAccessCodeError('Invalid access code. Please try again.');
            } else if (msg.toLowerCase().includes('max attempts')) {
                toast.error('You have used all your attempts for this quiz.');
            } else if (msg.toLowerCase().includes('cooldown')) {
                toast.error('Please wait before retrying this quiz.');
            } else {
                toast.error(msg || 'Failed to start quiz.');
            }
        } finally {
            setStarting(false);
        }
    };

    // ── Error state ───────────────────────────────────────
    if (isError) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <Card padding="lg" shadow="md" className="">
                    <div style={{ textAlign: 'center', padding: '20px 40px' }}>
                        <Lock size={48} style={{ color: 'var(--color-danger)', margin: '0 auto 16px' }} />
                        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 8px' }}>Quiz Not Available</h2>
                        <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', margin: '0 0 20px' }}>
                            This quiz doesn't exist or you don't have access to it.
                        </p>
                        <Button variant="primary" onClick={() => navigate('/student/quizzes')}>Back to Quizzes</Button>
                    </div>
                </Card>
            </div>
        );
    }

    // ── Start card status ─────────────────────────────────
    const status = quiz?.quizStatus;
    const canStart = !['UPCOMING', 'EXPIRED', 'MAX_ATTEMPTS_REACHED'].includes(status)
        && (!requiresAccessCode || accessCode.trim().length > 0)
        && !starting;

    const statusSection = (() => {
        if (status === 'AVAILABLE') return (
            <div style={{ textAlign: 'center', padding: '12px 0 16px' }}>
                <CheckCircle size={40} style={{ color: 'var(--color-success)', margin: '0 auto 8px' }} />
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)' }}>Ready to Start</div>
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>Good luck!</div>
            </div>
        );
        if (status === 'UPCOMING') return (
            <div style={{ textAlign: 'center', padding: '12px 0 16px' }}>
                <Clock size={40} style={{ color: 'var(--color-info)', margin: '0 auto 8px' }} />
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    Starts on {formatDateTime(quiz?.startsAt)}
                </div>
                {withinCountdown && countdown && (
                    <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-primary)', marginTop: 8, fontVariantNumeric: 'tabular-nums', letterSpacing: '0.05em' }}>
                        Starting in {countdown}
                    </div>
                )}
            </div>
        );
        if (status === 'EXPIRED') return (
            <div style={{ textAlign: 'center', padding: '12px 0 16px' }}>
                <Lock size={40} style={{ color: 'var(--color-text-secondary)', margin: '0 auto 8px' }} />
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)' }}>This quiz has expired</div>
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>
                    Expired on {formatDate(quiz?.expiresAt)}
                </div>
            </div>
        );
        if (status === 'COMPLETED' || quiz?.isPassed) return (
            <div style={{ textAlign: 'center', padding: '12px 0 16px' }}>
                <Trophy size={40} style={{ color: 'var(--color-warning)', margin: '0 auto 8px' }} />
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)' }}>Quiz Completed! 🏆</div>
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>
                    Best score: {formatPercentage(quiz?.studentBestPercentage)}
                </div>
            </div>
        );
        if (status === 'MAX_ATTEMPTS_REACHED') return (
            <div style={{ textAlign: 'center', padding: '12px 0 16px' }}>
                <Lock size={40} style={{ color: 'var(--color-danger)', margin: '0 auto 8px' }} />
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)' }}>No attempts remaining</div>
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>
                    You have used all {quiz?.maxAttempts} attempts
                </div>
            </div>
        );
        return null;
    })();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* BREADCRUMB */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--color-text-secondary)' }}>
                <button onClick={() => navigate('/student/quizzes')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontWeight: 600, padding: 0, fontSize: 13 }}>
                    Quizzes
                </button>
                <ChevronRight size={14} />
                <span style={{ color: 'var(--color-text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {isLoading ? '...' : quiz?.title}
                </span>
            </div>

            {/* MAIN LAYOUT */}
            <div className="quiz-detail-layout" style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>

                {/* ── LEFT — Quiz Details ── */}
                <div style={{ flex: '1 1 60%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>

                    {/* Header card */}
                    <Card padding="lg" shadow="sm">
                        {isLoading ? (
                            <div>
                                <Skeleton h={22} w="40%" />
                                <Skeleton h={32} w="85%" mt={14} />
                                <Skeleton h={15} w="95%" mt={10} />
                                <Skeleton h={15} w="70%" mt={6} />
                            </div>
                        ) : (
                            <>
                                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                                    <Badge variant={diffVariant(quiz?.difficulty)} size="sm">{quiz?.difficulty}</Badge>
                                    <Badge variant={typeVariant(quiz?.quizType)} size="sm">{quiz?.quizType}</Badge>
                                    {quiz?.categoryName && (
                                        <Badge variant="default" size="sm">{quiz.categoryName}</Badge>
                                    )}
                                </div>
                                <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-text-primary)', margin: '0 0 12px', lineHeight: 1.2 }}>
                                    {quiz?.title}
                                </h1>
                                {quiz?.description && (
                                    <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.7, margin: 0 }}>
                                        {quiz.description}
                                    </p>
                                )}
                            </>
                        )}
                    </Card>

                    {/* Info grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        {isLoading ? (
                            [...Array(4)].map((_, i) => <Skeleton key={i} h={68} />)
                        ) : (
                            <>
                                <InfoBox icon={<HelpCircle size={16} style={{ color: 'var(--color-primary)' }} />} label="Questions" value={quiz?.questionCount ?? '—'} />
                                <InfoBox icon={<Timer size={16} style={{ color: 'var(--color-warning)' }} />}  label="Time Limit" value={quiz?.timeLimitSeconds ? formatDuration(quiz.timeLimitSeconds) : 'No limit'} />
                                <InfoBox icon={<Target size={16} style={{ color: 'var(--color-success)' }} />} label="Total Marks" value={quiz?.totalMarks ?? '—'} />
                                <InfoBox icon={<CheckCircle size={16} style={{ color: 'var(--color-danger)' }} />} label="Pass Marks" value={quiz?.passMarks ?? '—'} />
                            </>
                        )}
                    </div>

                    {/* Rules */}
                    <Card padding="lg" shadow="sm">
                        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 12px' }}>Quiz Rules</h3>
                        {isLoading ? (
                            [...Array(4)].map((_, i) => <Skeleton key={i} h={12} mt={10} />)
                        ) : (
                            <div>
                                <RuleItem icon="✓" text="Read each question carefully before answering" />
                                <RuleItem icon="✓" text="You cannot go back once submitted" />
                                {quiz?.timeLimitSeconds && <>
                                    <RuleItem icon={<Timer size={14} />} text={`You have ${formatDuration(quiz.timeLimitSeconds)} to complete this quiz`} color="var(--color-warning)" />
                                    <RuleItem icon={<Timer size={14} />} text="Quiz will auto-submit when time runs out" color="var(--color-warning)" />
                                </>}
                                {quiz?.shuffleQuestions && (
                                    <RuleItem icon={<Shuffle size={14} />} text="Questions are shuffled for each attempt" color="var(--color-primary)" />
                                )}
                                {quiz?.showCorrectAnswers && (
                                    <RuleItem icon={<Eye size={14} />} text="You can review correct answers after submission" color="var(--color-success)" />
                                )}
                                {quiz?.maxAttempts > 0
                                    ? <RuleItem icon={<RefreshCw size={14} />} text={`Maximum ${quiz.maxAttempts} attempt(s) allowed`} color="var(--color-text-secondary)" />
                                    : <RuleItem icon={<RefreshCw size={14} />} text="Unlimited attempts allowed" color="var(--color-text-secondary)" />
                                }
                            </div>
                        )}
                    </Card>

                    {/* Previous attempts */}
                    {!isLoading && (quiz?.attemptsUsed ?? 0) > 0 && (
                        <Card padding="lg" shadow="sm">
                            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 12px' }}>Your Previous Attempts</h3>
                            <div style={{ fontSize: 14, color: 'var(--color-text-primary)', lineHeight: 1.8 }}>
                                <p style={{ margin: '0 0 4px' }}>
                                    You have attempted this quiz <strong>{quiz.attemptsUsed}</strong> time(s).
                                </p>
                                <p style={{ margin: '0 0 4px' }}>
                                    Your best score: <strong style={{ color: 'var(--color-primary)' }}>{formatPercentage(quiz.studentBestPercentage)}</strong>
                                </p>
                                <p style={{ margin: '0 0 16px', color: quiz.isPassed ? 'var(--color-success)' : 'var(--color-text-secondary)' }}>
                                    {quiz.isPassed ? '✅ You have passed this quiz!' : 'Keep trying — you can do it!'}
                                </p>
                            </div>
                            <button onClick={() => navigate('/student/history')}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontWeight: 600, fontSize: 13, padding: 0 }}>
                                View attempt history →
                            </button>
                        </Card>
                    )}
                </div>

                {/* ── RIGHT — Start Card (sticky) ── */}
                <div className="quiz-detail-sidebar" style={{ flex: '0 0 320px', minWidth: 280, position: 'sticky', top: 88 }}>
                    <Card padding="lg" shadow="md">

                        {/* Status section */}
                        {isLoading ? (
                            <div style={{ textAlign: 'center', padding: '12px 0 16px' }}>
                                <Skeleton h={40} w={40} />
                                <Skeleton h={18} w="60%" mt={10} />
                                <Skeleton h={13} w="40%" mt={8} />
                            </div>
                        ) : statusSection}

                        {/* Divider */}
                        <div style={{ height: 1, background: 'var(--color-border)', margin: '4px 0 16px' }} />

                        {/* Attempts counter */}
                        {isLoading ? (
                            <Skeleton h={14} w="70%" />
                        ) : (
                            <div style={{ marginBottom: 16 }}>
                                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                                    Attempt {(quiz?.attemptsUsed ?? 0) + 1} of{' '}
                                    {quiz?.maxAttempts === 0 ? '∞' : quiz?.maxAttempts}
                                </div>
                                {(quiz?.maxAttempts ?? 0) > 0 && (
                                    <div style={{ width: '100%', height: 6, background: 'var(--color-border-soft)', borderRadius: 9999, overflow: 'hidden' }}>
                                        <div style={{
                                            width: `${Math.min(100, ((quiz?.attemptsUsed ?? 0) / quiz.maxAttempts) * 100)}%`,
                                            height: '100%',
                                            background: quiz?.attemptsRemaining === 0 ? 'var(--color-danger)' : 'var(--color-primary)',
                                            borderRadius: 9999, transition: 'width 0.5s ease',
                                        }} />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Access code */}
                        {!isLoading && requiresAccessCode && (
                            <div style={{ marginBottom: 16 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 8 }}>
                                    🔒 Access Code Required
                                </div>
                                <input
                                    type="text"
                                    placeholder="Enter access code"
                                    value={accessCode}
                                    onChange={e => { setAccessCode(e.target.value); setAccessCodeError(''); }}
                                    style={{
                                        width: '100%', height: 40, border: `1px solid ${accessCodeError ? 'var(--color-danger)' : 'var(--color-border)'}`,
                                        borderRadius: 8, padding: '0 12px', fontSize: 14,
                                        fontFamily: 'monospace', outline: 'none', background: 'var(--color-bg-card)', boxSizing: 'border-box',
                                    }}
                                    onFocus={e => { if (!accessCodeError) e.target.style.borderColor = 'var(--color-primary)'; }}
                                    onBlur={e  => { if (!accessCodeError) e.target.style.borderColor = 'var(--color-border)'; }}
                                />
                                {accessCodeError && (
                                    <p style={{ fontSize: 12, color: 'var(--color-danger)', marginTop: 4, fontWeight: 500 }}>{accessCodeError}</p>
                                )}
                            </div>
                        )}

                        {/* Start button */}
                        {isLoading ? (
                            <Skeleton h={44} />
                        ) : (
                            <>
                                <Button
                                    variant="primary" size="lg" fullWidth
                                    disabled={!canStart}
                                    loading={starting}
                                    onClick={handleStartQuiz}
                                >
                                    {starting ? 'Starting…' : 'Start Quiz'}
                                </Button>
                                {!canStart && !starting && (
                                    <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 8, textAlign: 'center' }}>
                                        {status === 'UPCOMING' && "Quiz hasn't started yet"}
                                        {status === 'EXPIRED'  && "This quiz has expired"}
                                        {status === 'MAX_ATTEMPTS_REACHED' && "No attempts remaining"}
                                        {status === 'AVAILABLE' && requiresAccessCode && accessCode.trim().length === 0 && 'Enter access code to start'}
                                    </p>
                                )}
                            </>
                        )}

                        {/* Quick stats */}
                        {!isLoading && (
                            <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
                                {[
                                    { icon: '⏱️', val: quiz?.timeLimitSeconds ? formatDuration(quiz.timeLimitSeconds) : 'No limit' },
                                    { icon: '📝', val: `${quiz?.questionCount ?? 0} questions` },
                                    { icon: '🎯', val: `${quiz?.passMarks ?? 0} to pass` },
                                ].map(({ icon, val }) => (
                                    <div key={val} style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: 14 }}>{icon}</div>
                                        <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 3, fontWeight: 500 }}>{val}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
}