import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    ArrowLeft, CheckCircle2, XCircle, SkipForward, PenLine,
    ChevronDown, Clock, Lightbulb, Lock, HelpCircle, AlertCircle,
    ArrowRight,
} from 'lucide-react';
import { getAttemptReview } from '../../../api/attempt.api';
import { formatDuration, truncateText } from '../../../utils/formatters';
import Tabs from '../../../components/ui/Tabs';
import EmptyState from '../../../components/common/EmptyState';
import Button from '../../../components/common/Button';
import Spinner from '../../../components/common/Spinner';

function QuestionCard({ q, index, expanded, onToggle }) {
    const isCorrect = q.isCorrect;
    const isSkipped = q.isSkipped;
    const isEssay = q.questionType === 'ESSAY';
    const marksColor = q.marksAwarded > 0 ? 'var(--color-success)' : q.marksAwarded < 0 ? 'var(--color-danger)' : 'var(--color-text-secondary)';

    let statusIcon, statusBg, statusColor, statusLabel;
    if (isSkipped) {
        statusIcon = <SkipForward size={14} />;
        statusBg = '#F3F4F6'; statusColor = '#6B7280'; statusLabel = 'Skipped';
    } else if (isEssay && isCorrect == null) {
        statusIcon = <PenLine size={14} />;
        statusBg = '#EFF6FF'; statusColor = 'var(--color-info)'; statusLabel = 'Manual';
    } else if (isCorrect) {
        statusIcon = <CheckCircle2 size={14} />;
        statusBg = '#ECFDF5'; statusColor = 'var(--color-success)'; statusLabel = 'Correct';
    } else {
        statusIcon = <XCircle size={14} />;
        statusBg = '#FEF2F2'; statusColor = 'var(--color-danger)'; statusLabel = 'Wrong';
    }

    const cardBorderColor = isSkipped ? '#E5E7EB' : isEssay ? '#BFDBFE' : isCorrect ? '#A7F3D0' : '#FECACA';
    const selectedUuids = q.studentSelectedOptionIds ?? [];
    const correctUuids = q.correctOptionIds ?? [];

    return (
        <div style={{ background: '#fff', borderRadius: 14, border: `1.5px solid ${cardBorderColor}`, boxShadow: 'var(--shadow-sm)', overflow: 'hidden', transition: 'box-shadow 0.2s' }}>
            {/* Header */}
            <button
                onClick={onToggle}
                style={{ width: '100%', display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px 18px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            >
                {/* Number badge */}
                <div style={{ flexShrink: 0, width: 30, height: 30, borderRadius: 8, background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, marginTop: 2 }}>
                    Q{index + 1}
                </div>

                {/* Status indicator */}
                <div style={{ flexShrink: 0, width: 26, height: 26, borderRadius: '50%', background: statusBg, color: statusColor, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 4 }}>
                    {statusIcon}
                </div>

                {/* Center */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', lineHeight: 1.5, marginBottom: 4 }}>
                        {truncateText(q.questionText, 90)}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: marksColor }}>
                        {q.marksAwarded ?? 0} / {q.marks} marks
                    </div>
                </div>

                {/* Right */}
                <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--color-text-secondary)' }}>
                        <Clock size={11} />
                        {formatDuration(q.timeSpentSeconds) || '—'}
                    </div>
                    {q.hintUsed && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#92400E', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 6, padding: '2px 6px' }}>
                            💡 Hint used
                        </span>
                    )}
                    <div style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.25s ease', color: 'var(--color-text-secondary)' }}>
                        <ChevronDown size={16} />
                    </div>
                </div>
            </button>

            {/* Expand body */}
            <div style={{
                maxHeight: expanded ? 2000 : 0,
                opacity: expanded ? 1 : 0,
                overflow: 'hidden',
                transition: 'max-height 0.35s ease, opacity 0.25s ease',
            }}>
                <div style={{ padding: '0 18px 20px', borderTop: '1px solid #F3F4F6' }}>
                    {/* Full question */}
                    <div style={{ padding: '16px 0', fontSize: 15, fontWeight: 500, color: 'var(--color-text-primary)', lineHeight: 1.7 }}>
                        {q.questionText}
                    </div>

                    {/* Options */}
                    {q.options?.length > 0 && !['SHORT_ANSWER', 'ESSAY', 'FILL_IN_THE_BLANK'].includes(q.questionType) && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                            {[...q.options].sort((a, b) => a.optionOrder - b.optionOrder).map((opt) => {
                                const isOptCorrect = opt.isCorrect || correctUuids.includes(opt.id ?? opt.uuid);
                                const isSelected = selectedUuids.includes(opt.id ?? opt.uuid);
                                let optBg = '#FAFAFA';
                                let optBorder = '#E5E7EB';
                                if (isOptCorrect) { optBg = '#ECFDF5'; optBorder = '#6EE7B7'; }
                                else if (isSelected) { optBg = '#FEF2F2'; optBorder = '#FCA5A5'; }

                                return (
                                    <div key={opt.id ?? opt.uuid} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', borderRadius: 10, background: optBg, border: `1.5px solid ${optBorder}` }}>
                                        <div style={{ flexShrink: 0, marginTop: 2 }}>
                                            {isOptCorrect
                                                ? <CheckCircle2 size={16} style={{ color: 'var(--color-success)' }} />
                                                : isSelected
                                                    ? <XCircle size={16} style={{ color: 'var(--color-danger)' }} />
                                                    : <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #D1D5DB' }} />
                                            }
                                        </div>
                                        <span style={{ flex: 1, fontSize: 14, color: 'var(--color-text-primary)', lineHeight: 1.5 }}>{opt.optionText}</span>
                                        <div style={{ flexShrink: 0, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                            {isOptCorrect && (
                                                <span style={{ fontSize: 10, fontWeight: 700, color: '#065F46', background: '#D1FAE5', borderRadius: 6, padding: '2px 7px' }}>Correct</span>
                                            )}
                                            {isSelected && (
                                                <span style={{ fontSize: 10, fontWeight: 700, color: isOptCorrect ? '#065F46' : '#991B1B', background: isOptCorrect ? '#D1FAE5' : '#FEE2E2', borderRadius: 6, padding: '2px 7px' }}>Your Answer</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Text answer */}
                    {q.textAnswer && (
                        <div style={{ marginBottom: 16 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Your Answer</div>
                            <div style={{ padding: '12px 14px', background: '#F8FAFC', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 14, color: 'var(--color-text-primary)', lineHeight: 1.6 }}>
                                {q.textAnswer}
                            </div>
                        </div>
                    )}

                    {/* Skipped */}
                    {isSkipped && (
                        <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontStyle: 'italic', marginBottom: 12 }}>
                            — You skipped this question
                        </div>
                    )}

                    {/* Essay note */}
                    {isEssay && (
                        <div style={{ padding: '10px 14px', background: '#EFF6FF', border: '1.5px solid #BFDBFE', borderRadius: 10, fontSize: 13, color: '#1E40AF', marginBottom: 16, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                            <PenLine size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                            <span>✍️ Essay questions are manually graded. Your marks will be updated by your instructor.</span>
                        </div>
                    )}

                    {/* Ordering */}
                    {q.questionType === 'ORDERING' && q.options?.length > 0 && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                            {['Your Order', 'Correct Order'].map((title, side) => {
                                const ids = side === 0 ? selectedUuids : correctUuids;
                                return (
                                    <div key={title}>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{title}</div>
                                        {ids.map((id, i) => {
                                            const opt = q.options.find(o => (o.id ?? o.uuid) === id);
                                            const studentOrder = selectedUuids.indexOf(id);
                                            const correctOrder = correctUuids.indexOf(id);
                                            const match = studentOrder === correctOrder;
                                            return (
                                                <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, background: match ? '#ECFDF5' : '#FEF2F2', border: `1px solid ${match ? '#A7F3D0' : '#FECACA'}`, marginBottom: 6, fontSize: 13, color: match ? '#065F46' : '#991B1B' }}>
                                                    <span style={{ fontWeight: 700, fontSize: 11, width: 18, textAlign: 'center' }}>{i + 1}.</span>
                                                    {opt?.optionText || id}
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Match the Following */}
                    {q.questionType === 'MATCH_THE_FOLLOWING' && q.options?.length > 0 && (
                        <div style={{ marginBottom: 16 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
                                {['Question Item', 'Your Match', 'Correct Match'].map(h => (
                                    <div key={h} style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</div>
                                ))}
                            </div>
                            {q.options.filter(o => o.matchPairKey).map((opt, i) => {
                                const correctMatch = q.options.find(o => o.matchPairVal && o.optionOrder === opt.optionOrder);
                                const studentMatchId = q.matchPairs?.[opt.id ?? opt.uuid];
                                const studentMatch = q.options.find(o => String(o.id ?? o.uuid) === String(studentMatchId));
                                const isMatch = studentMatch?.matchPairVal === correctMatch?.matchPairVal;
                                return (
                                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 6 }}>
                                        <div style={{ padding: '7px 10px', borderRadius: 8, background: '#F8FAFC', border: '1px solid #E5E7EB', fontSize: 13 }}>{opt.matchPairKey || opt.optionText}</div>
                                        <div style={{ padding: '7px 10px', borderRadius: 8, background: isMatch ? '#ECFDF5' : '#FEF2F2', border: `1px solid ${isMatch ? '#A7F3D0' : '#FECACA'}`, fontSize: 13, color: isMatch ? '#065F46' : '#991B1B' }}>{studentMatch?.matchPairVal || '—'}</div>
                                        <div style={{ padding: '7px 10px', borderRadius: 8, background: '#ECFDF5', border: '1px solid #A7F3D0', fontSize: 13, color: '#065F46' }}>{correctMatch?.matchPairVal || '—'}</div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Explanation */}
                    {q.explanation && (
                        <div style={{ marginTop: 8 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>💡 Explanation</div>
                            <div style={{ padding: '12px 16px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderLeft: '3px solid var(--color-info)', borderRadius: '0 10px 10px 0', fontSize: 14, color: '#1E40AF', lineHeight: 1.7 }}>
                                {q.explanation}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function AttemptReview() {
    const { attemptUuid } = useParams();
    const navigate = useNavigate();
    const [filter, setFilter] = useState('all');
    const [expandedQuestion, setExpandedQuestion] = useState(null);

    const { data: response, isLoading, isError } = useQuery({
        queryKey: ['attempt-review', attemptUuid],
        queryFn: () => getAttemptReview(attemptUuid),
        staleTime: 300_000,
        retry: 1,
    });

    const review = response?.data;
    const questions = review?.questions ?? [];

    const filteredQuestions = questions.filter(q => {
        if (filter === 'correct') return q.isCorrect === true;
        if (filter === 'wrong') return q.isCorrect === false && !q.isSkipped;
        if (filter === 'skipped') return q.isSkipped === true;
        return true;
    });

    const correctCount = questions.filter(q => q.isCorrect).length;
    const wrongCount = questions.filter(q => !q.isCorrect && !q.isSkipped).length;
    const skippedCount = questions.filter(q => q.isSkipped).length;

    if (isLoading) {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--color-bg-page)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Spinner size="lg" label="Loading review..." />
            </div>
        );
    }

    if (isError) {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--color-bg-page)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                <div style={{ background: '#fff', borderRadius: 20, border: '1px solid var(--color-border)', padding: '40px 32px', maxWidth: 420, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, boxShadow: 'var(--shadow-md)' }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Lock size={28} style={{ color: 'var(--color-danger)' }} />
                    </div>
                    <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text-primary)' }}>Review Not Available</h2>
                    <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                        Answer review may not be enabled for this quiz, or the attempt could not be found.
                    </p>
                    <Button onClick={() => navigate(`/student/results/${attemptUuid}`)}>Back to Results</Button>
                </div>
            </div>
        );
    }

    const emptyConfig = {
        correct: { icon: <CheckCircle2 size={48} />, title: 'No correct answers', desc: 'Try a different filter' },
        wrong: { icon: <XCircle size={48} />, title: 'No wrong answers 🎉', desc: 'Try a different filter' },
        skipped: { icon: <SkipForward size={48} />, title: 'No skipped questions', desc: 'Try a different filter' },
        all: { icon: <HelpCircle size={48} />, title: 'No questions found', desc: 'Try a different filter' },
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg-page)', paddingBottom: 80 }}>
            <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>

            {/* ── Header ── */}
            <div style={{ background: '#fff', borderBottom: '1px solid var(--color-border)', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 50, boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button onClick={() => navigate(`/student/results/${attemptUuid}`)} style={{ width: 36, height: 36, borderRadius: 10, border: '1.5px solid var(--color-border)', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--color-text-secondary)', flexShrink: 0 }}>
                            <ArrowLeft size={16} />
                        </button>
                        <div>
                            <h1 style={{ fontSize: 17, fontWeight: 700, color: 'var(--color-text-primary)' }}>Answer Review</h1>
                            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 1 }}>{review?.quizTitle}</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {[
                            { color: 'var(--color-success)', bg: '#ECFDF5', label: 'Correct', val: correctCount },
                            { color: 'var(--color-danger)', bg: '#FEF2F2', label: 'Wrong', val: wrongCount },
                            { color: '#6B7280', bg: '#F3F4F6', label: 'Skipped', val: skippedCount },
                        ].map(({ color, bg, label, val }) => (
                            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 11px', borderRadius: 20, background: bg, fontSize: 12, fontWeight: 700, color }}>
                                {val} {label}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 16px' }}>

                {/* ── Filter Tabs ── */}
                <div style={{ marginBottom: 20 }}>
                    <Tabs
                        tabs={[
                            { key: 'all', label: 'All', count: questions.length },
                            { key: 'correct', label: '✅ Correct', count: correctCount },
                            { key: 'wrong', label: '❌ Wrong', count: wrongCount },
                            { key: 'skipped', label: '⏭️ Skipped', count: skippedCount },
                        ]}
                        activeTab={filter}
                        onChange={setFilter}
                        variant="pill"
                    />
                </div>

                {/* ── Question Cards ── */}
                {filteredQuestions.length === 0 ? (
                    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--color-border)' }}>
                        <EmptyState
                            icon={emptyConfig[filter].icon}
                            title={emptyConfig[filter].title}
                            description={emptyConfig[filter].desc}
                        />
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {filteredQuestions.map((q, i) => (
                            <div key={q.questionUuid} style={{ animation: `fadeUp 0.3s ease ${i * 40}ms both` }}>
                                <QuestionCard
                                    q={q}
                                    index={questions.indexOf(q)}
                                    expanded={expandedQuestion === q.questionUuid}
                                    onToggle={() => setExpandedQuestion(expandedQuestion === q.questionUuid ? null : q.questionUuid)}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Bottom Nav ── */}
            <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid var(--color-border)', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 -4px 12px rgba(0,0,0,0.06)', zIndex: 40 }}>
                <Button variant="outline" icon={<ArrowLeft size={15} />} onClick={() => navigate(`/student/results/${attemptUuid}`)}>
                    Back to Results
                </Button>
                <Button variant="outline" onClick={() => navigate('/student/quizzes')}>
                    Browse Quizzes <ArrowRight size={15} />
                </Button>
            </div>
        </div>
    );
}
