import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    Clock, Grid3X3, Send, ChevronLeft, ChevronRight,
    Flag, Lightbulb, X, AlertTriangle, CheckCircle,
    Save, LayoutGrid, GripVertical, BookOpen,
} from 'lucide-react';
import { saveAnswer, submitAttempt, logAuditEvent } from '../../../api/attempt.api';
import { truncateText } from '../../../utils/formatters';
import Modal from '../../../components/common/Modal';
import Button from '../../../components/common/Button';
import Spinner from '../../../components/common/Spinner';

// ─── Helpers ──────────────────────────────────────────────
function formatTimeLeft(secs) {
    if (secs === null || secs === undefined) return '--:--';
    const s = Math.max(0, Math.floor(secs));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    const pad = (n) => String(n).padStart(2, '0');
    if (h > 0) return `${pad(h)}:${pad(m)}:${pad(ss)}`;
    return `${pad(m)}:${pad(ss)}`;
}

function formatSavedTime(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    const h = d.getHours(), m = d.getMinutes(), s = d.getSeconds();
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(h)}:${pad(m)}:${pad(ss(s))}`;
    function ss(n) { return String(n).padStart(2, '0'); }
}

function isAnswered(ans) {
    if (!ans) return false;
    if (ans.selectedOptionIds?.length > 0) return true;
    if (ans.textAnswer?.trim()) return true;
    if (ans.orderedOptionIds?.length > 0) return true;
    if (ans.matchPairs && Object.keys(ans.matchPairs).length > 0) return true;
    if (ans.booleanAnswer !== undefined && ans.booleanAnswer !== null) return true;
    return false;
}

function getDifficultyColor(d) {
    if (!d) return '#6b7280';
    switch (d.toUpperCase()) {
        case 'EASY': return '#10B981';
        case 'MEDIUM': return '#F59E0B';
        case 'HARD': return '#EF4444';
        default: return '#6b7280';
    }
}

// ─── Styles ───────────────────────────────────────────────
const css = {
    topBar: {
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: 56, background: '#fff', borderBottom: '1px solid #e5e7eb',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', gap: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    },
    optionBtn: (selected) => ({
        width: '100%', display: 'flex', alignItems: 'flex-start', gap: 14,
        padding: '14px 18px', borderRadius: 10, cursor: 'pointer',
        border: selected ? '2px solid var(--color-primary)' : '2px solid #e5e7eb',
        background: selected ? 'var(--color-primary-light)' : '#fff',
        textAlign: 'left', transition: 'all 0.15s', outline: 'none',
        marginBottom: 10,
    }),
    radioCircle: (selected) => ({
        width: 20, height: 20, borderRadius: '50%', flexShrink: 0, marginTop: 1,
        border: selected ? '6px solid var(--color-primary)' : '2px solid #d1d5db',
        background: '#fff', transition: 'all 0.15s',
    }),
    checkBox: (selected) => ({
        width: 20, height: 20, borderRadius: 5, flexShrink: 0, marginTop: 1,
        border: selected ? '2px solid var(--color-primary)' : '2px solid #d1d5db',
        background: selected ? 'var(--color-primary)' : '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s', color: '#fff', fontSize: 12, fontWeight: 700,
    }),
    tfBtn: (selected) => ({
        flex: 1, padding: '18px 24px', borderRadius: 12, cursor: 'pointer',
        border: selected ? '2.5px solid var(--color-primary)' : '2px solid #e5e7eb',
        background: selected ? 'var(--color-primary)' : '#fff',
        color: selected ? '#fff' : 'var(--color-text-primary)',
        fontSize: 17, fontWeight: 700, transition: 'all 0.18s', textAlign: 'center',
    }),
    navBtn: (state) => {
        const colors = {
            current: { bg: 'var(--color-primary)', color: '#fff', border: 'var(--color-primary)' },
            answered_flagged: { bg: '#F59E0B', color: '#fff', border: '#F59E0B' },
            answered: { bg: '#10B981', color: '#fff', border: '#10B981' },
            flagged: { bg: '#FEF3C7', color: '#92400E', border: '#F59E0B' },
            empty: { bg: '#fff', color: '#6b7280', border: '#e5e7eb' },
        }[state] || { bg: '#fff', color: '#6b7280', border: '#e5e7eb' };
        return {
            width: 40, height: 40, borderRadius: 8, cursor: 'pointer',
            border: `2px solid ${colors.border}`, background: colors.bg,
            color: colors.color, fontSize: 13, fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s',
        };
    },
    draggableItem: (isDragging) => ({
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px', borderRadius: 10, marginBottom: 8,
        border: '2px solid #e5e7eb', background: isDragging ? '#EEF2FF' : '#fff',
        opacity: isDragging ? 0.7 : 1, cursor: 'grab',
        transition: 'all 0.15s',
    }),
};

// ─── Question type renderers ──────────────────────────────
function MCQSingle({ question, ans, setAns }) {
    const opts = question.options ?? [];
    const sel = ans?.selectedOptionIds ?? [];
    return (
        <div>
            {opts.map(opt => {
                const selected = sel.includes(opt.id);
                return (
                    <button key={opt.id} style={css.optionBtn(selected)}
                        onClick={() => setAns(q => ({ ...q, selectedOptionIds: [opt.id] }))}>
                        <div style={css.radioCircle(selected)} />
                        <div style={{ flex: 1 }}>
                            <span style={{ fontSize: 15, lineHeight: 1.5, color: 'var(--color-text-primary)' }}>{opt.optionText}</span>
                            {opt.mediaUrl && <img src={opt.mediaUrl} alt="" style={{ marginTop: 8, maxWidth: 240, borderRadius: 8 }} />}
                        </div>
                    </button>
                );
            })}
        </div>
    );
}

function MCQMulti({ question, ans, setAns }) {
    const opts = question.options ?? [];
    const sel = ans?.selectedOptionIds ?? [];
    const toggle = (id) => {
        const newSel = sel.includes(id) ? sel.filter(x => x !== id) : [...sel, id];
        setAns(q => ({ ...q, selectedOptionIds: newSel }));
    };
    return (
        <div>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 12, fontStyle: 'italic' }}>Select all that apply</p>
            {opts.map(opt => {
                const selected = sel.includes(opt.id);
                return (
                    <button key={opt.id} style={css.optionBtn(selected)} onClick={() => toggle(opt.id)}>
                        <div style={css.checkBox(selected)}>{selected && '✓'}</div>
                        <div style={{ flex: 1 }}>
                            <span style={{ fontSize: 15, lineHeight: 1.5, color: 'var(--color-text-primary)' }}>{opt.optionText}</span>
                            {opt.mediaUrl && <img src={opt.mediaUrl} alt="" style={{ marginTop: 8, maxWidth: 240, borderRadius: 8 }} />}
                        </div>
                    </button>
                );
            })}
        </div>
    );
}

function TrueFalse({ question, ans, setAns }) {
    const opts = question.options ?? [];
    const trueOpt  = opts.find(o => o.optionText?.toLowerCase() === 'true')  || opts[0];
    const falseOpt = opts.find(o => o.optionText?.toLowerCase() === 'false') || opts[1];
    const val = ans?.booleanAnswer;
    const selectTF = (bool, opt) => {
        setAns(q => ({ ...q, booleanAnswer: bool, selectedOptionIds: opt ? [opt.id] : [] }));
    };
    return (
        <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
            <button style={css.tfBtn(val === true)}  onClick={() => selectTF(true,  trueOpt)}>✓ True</button>
            <button style={css.tfBtn(val === false)} onClick={() => selectTF(false, falseOpt)}>✗ False</button>
        </div>
    );
}

function TextAnswer({ question, ans, setAns, rows = 3, essay = false }) {
    return (
        <div>
            <textarea
                rows={rows}
                value={ans?.textAnswer ?? ''}
                onChange={e => setAns(q => ({ ...q, textAnswer: e.target.value }))}
                placeholder={essay ? 'Write your essay answer here...' : 'Type your answer here...'}
                style={{
                    width: '100%', padding: '12px 14px', border: '2px solid #e5e7eb',
                    borderRadius: 10, fontSize: 15, fontFamily: 'inherit', resize: 'vertical',
                    outline: 'none', transition: 'border-color 0.15s', lineHeight: 1.6,
                    background: '#fafbfc',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
                onBlur={e  => e.target.style.borderColor = '#e5e7eb'}
            />
            {essay && (
                <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 8, fontStyle: 'italic' }}>
                    📝 Essay answers are manually graded by your instructor.
                </p>
            )}
        </div>
    );
}

function OrderingQuestion({ question, ans, setAns }) {
    const [items, setItems] = useState(() => {
        const opts = [...(question.options ?? [])].sort((a, b) => a.optionOrder - b.optionOrder);
        if (ans?.orderedOptionIds?.length) {
            const idxMap = Object.fromEntries(ans.orderedOptionIds.map((id, i) => [id, i]));
            return opts.slice().sort((a, b) => (idxMap[a.id] ?? 999) - (idxMap[b.id] ?? 999));
        }
        return opts;
    });
    const [dragging, setDragging] = useState(null);

    const handleDragStart = (i) => setDragging(i);
    const handleDragOver = (e, i) => {
        e.preventDefault();
        if (dragging === null || dragging === i) return;
        const newItems = [...items];
        const [moved] = newItems.splice(dragging, 1);
        newItems.splice(i, 0, moved);
        setDragging(i);
        setItems(newItems);
        setAns(q => ({ ...q, orderedOptionIds: newItems.map(x => x.id) }));
    };
    const handleDragEnd = () => setDragging(null);

    return (
        <div>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 12, fontStyle: 'italic' }}>Drag items to arrange in the correct order</p>
            {items.map((opt, i) => (
                <div key={opt.id}
                    draggable
                    onDragStart={() => handleDragStart(i)}
                    onDragOver={e => handleDragOver(e, i)}
                    onDragEnd={handleDragEnd}
                    style={css.draggableItem(dragging === i)}
                >
                    <GripVertical size={16} style={{ color: '#9ca3af', flexShrink: 0 }} />
                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>{i + 1}</div>
                    <span style={{ flex: 1, fontSize: 15 }}>{opt.optionText}</span>
                </div>
            ))}
        </div>
    );
}

function MatchQuestion({ question, ans, setAns }) {
    const opts = question.options ?? [];
    const leftItems  = opts.filter(o => o.matchPairKey);
    const rightItems = opts.filter(o => o.matchPairVal);
    const pairs = ans?.matchPairs ?? {};

    const rightOptions = [
        { value: '', label: '— Select match —' },
        ...rightItems.map(o => ({ value: String(o.id), label: o.matchPairVal || o.optionText })),
    ];

    return (
        <div>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 16, fontStyle: 'italic' }}>Match each item on the left with the correct answer</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {leftItems.map((left, i) => {
                    const colors = ['#6366F1','#10B981','#F59E0B','#EF4444','#8B5CF6','#06B6D4'];
                    const c = colors[i % colors.length];
                    return (
                        <div key={left.id} style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                            <div style={{ flex: '1 1 220px', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#f8fafc', borderRadius: 10, border: '2px solid #e5e7eb' }}>
                                <div style={{ width: 10, height: 10, borderRadius: '50%', background: c, flexShrink: 0 }} />
                                <span style={{ fontSize: 14, fontWeight: 500 }}>{left.matchPairKey || left.optionText}</span>
                            </div>
                            <div style={{ color: '#9ca3af', fontWeight: 700, fontSize: 18 }}>→</div>
                            <div style={{ flex: '1 1 220px', position: 'relative' }}>
                                <select
                                    value={String(pairs[left.id] ?? '')}
                                    onChange={e => {
                                        const val = e.target.value ? Number(e.target.value) : undefined;
                                        const newPairs = { ...pairs };
                                        if (val) newPairs[left.id] = val;
                                        else delete newPairs[left.id];
                                        setAns(q => ({ ...q, matchPairs: newPairs }));
                                    }}
                                    style={{ width: '100%', height: 44, borderRadius: 10, border: `2px solid ${pairs[left.id] ? c : '#e5e7eb'}`, padding: '0 36px 0 12px', fontSize: 14, outline: 'none', background: '#fff', appearance: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                                >
                                    {rightOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                                <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#9ca3af' }}>▼</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function renderAnswerSection(question, ans, setAns) {
    if (!question) return null;
    const type = question.questionType;
    switch (type) {
        case 'MCQ_SINGLE':    return <MCQSingle question={question} ans={ans} setAns={setAns} />;
        case 'MCQ_MULTI':     return <MCQMulti question={question} ans={ans} setAns={setAns} />;
        case 'TRUE_FALSE':    return <TrueFalse question={question} ans={ans} setAns={setAns} />;
        case 'SHORT_ANSWER':
        case 'FILL_IN_THE_BLANK': return <TextAnswer question={question} ans={ans} setAns={setAns} rows={3} />;
        case 'ESSAY':         return <TextAnswer question={question} ans={ans} setAns={setAns} rows={8} essay />;
        case 'ORDERING':      return <OrderingQuestion question={question} ans={ans} setAns={setAns} />;
        case 'MATCH_THE_FOLLOWING': return <MatchQuestion question={question} ans={ans} setAns={setAns} />;
        case 'CODE_SNIPPET':
            return (
                <div>
                    <div style={{ background: '#1e1e2e', borderRadius: 10, padding: 16, marginBottom: 16, overflow: 'auto' }}>
                        <pre style={{ color: '#cdd6f4', fontFamily: 'monospace', fontSize: 14, lineHeight: 1.6, margin: 0 }}>{question.questionText}</pre>
                    </div>
                    <TextAnswer question={question} ans={ans} setAns={setAns} rows={4} />
                </div>
            );
        case 'IMAGE_BASED':
            return (
                <div>
                    {question.mediaUrl && <img src={question.mediaUrl} alt="Question" style={{ maxWidth: '100%', borderRadius: 12, marginBottom: 16, border: '1px solid #e5e7eb' }} />}
                    <MCQSingle question={question} ans={ans} setAns={setAns} />
                </div>
            );
        default:
            return <TextAnswer question={question} ans={ans} setAns={setAns} rows={3} />;
    }
}

// ════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════
export default function QuizTaking() {
    const { attemptUuid } = useParams();
    const location = useLocation();
    const navigate  = useNavigate();
    const attemptData = location.state?.attemptData;

    const questions = attemptData?.questions ?? [];

    // ── Core state ────────────────────────────────────────
    const [currentIndex,      setCurrentIndex]      = useState(0);
    const [answers,           setAnswers]            = useState({});
    const [questionTimeSpent, setQuestionTimeSpent]  = useState(0);
    const [showHint,          setShowHint]           = useState(false);
    const [showNavigator,     setShowNavigator]      = useState(false);
    const [submitModal,       setSubmitModal]        = useState(false);
    const [submitting,        setSubmitting]         = useState(false);
    const [autoSaving,        setAutoSaving]         = useState(false);
    const [lastSaved,         setLastSaved]          = useState(null);
    const [tabSwitchCount,    setTabSwitchCount]     = useState(0);
    const [warningModal,      setWarningModal]       = useState({ open: false, message: '' });
    const [leaveModal,        setLeaveModal]         = useState({ open: false, to: null });
    const [dragOver,          setDragOver]           = useState(null);

    // ── Timer ─────────────────────────────────────────────
    const [timeLeft, setTimeLeft] = useState(() => {
        if (!attemptData?.deadlineAt) return null;
        const deadline = new Date(attemptData.deadlineAt);
        const now = new Date();
        return Math.max(0, Math.floor((deadline - now) / 1000));
    });

    const currentQuestion   = questions[currentIndex];
    const qId               = currentQuestion?.quizQuestionId;
    const currentAns        = answers[qId] ?? {};
    const answersRef         = useRef(answers);
    const questionTimeRef    = useRef(questionTimeSpent);
    const currentIndexRef    = useRef(currentIndex);
    const questionsRef       = useRef(questions);
    const attemptUuidRef     = useRef(attemptUuid);
    answersRef.current       = answers;
    questionTimeRef.current  = questionTimeSpent;
    currentIndexRef.current  = currentIndex;
    questionsRef.current     = questions;
    attemptUuidRef.current   = attemptUuid;

    // ── Invalid session ───────────────────────────────────
    if (!attemptData) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 16, background: 'var(--color-bg-page)' }}>
                <div style={{ width: 64, height: 64, background: '#FEF2F2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AlertTriangle size={32} style={{ color: '#EF4444' }} />
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Invalid attempt session</h2>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, margin: 0 }}>Please start the quiz from the quiz detail page.</p>
                <Button onClick={() => navigate('/student/quizzes')}>Go to Quizzes</Button>
            </div>
        );
    }

    // ── Save current answer ───────────────────────────────
    const saveCurrentAnswer = useCallback(async (silent = false) => {
        const idx     = currentIndexRef.current;
        const qs      = questionsRef.current;
        const qq      = qs[idx];
        if (!qq) return;
        const qqId    = qq.quizQuestionId;
        const ans     = answersRef.current[qqId];
        if (!ans && !silent) return;

        if (!silent) setAutoSaving(true);
        try {
            await saveAnswer(attemptUuidRef.current, {
                quizQuestionId:   qqId,
                selectedOptionIds: ans?.selectedOptionIds ?? null,
                textAnswer:        ans?.textAnswer        ?? null,
                orderedOptionIds:  ans?.orderedOptionIds  ?? null,
                matchPairs:        ans?.matchPairs        ?? null,
                booleanAnswer:     (ans?.booleanAnswer !== undefined && ans?.booleanAnswer !== null) ? ans.booleanAnswer : null,
                hintUsed:          ans?.hintUsed          ?? false,
                timeSpentSeconds:  questionTimeRef.current,
                isFlagged:         ans?.isFlagged         ?? false,
            });
            setLastSaved(new Date().toISOString());
        } catch {
            if (!silent) toast.error('Failed to save answer. Check connection.');
        } finally {
            if (!silent) setAutoSaving(false);
        }
    }, []);

    // ── Main timer ────────────────────────────────────────
    const handleAutoSubmit = useCallback(async () => {
        await saveCurrentAnswer(true);
        try {
            const result = await submitAttempt(attemptUuidRef.current);
            navigate(`/student/results/${attemptUuidRef.current}`, {
                state: { resultData: result.data, autoSubmitted: true },
            });
        } catch {
            navigate(`/student/results/${attemptUuidRef.current}`, {
                state: { autoSubmitted: true },
            });
        }
    }, [navigate, saveCurrentAnswer]);

    useEffect(() => {
        if (timeLeft === null) return;
        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    handleAutoSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // ── Per-question timer ────────────────────────────────
    useEffect(() => {
        setQuestionTimeSpent(0);
    }, [currentIndex]);

    useEffect(() => {
        const interval = setInterval(() => {
            setQuestionTimeSpent(p => p + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [currentIndex]);

    // Per-question auto-advance
    useEffect(() => {
        if (!currentQuestion?.perQuestionSecs) return;
        if (questionTimeSpent >= currentQuestion.perQuestionSecs) {
            saveCurrentAnswer(true);
            toast('⏱ Time up for this question!', { icon: '⚡' });
            if (currentIndex < questions.length - 1) {
                setCurrentIndex(p => p + 1);
                setShowHint(false);
            }
        }
    }, [questionTimeSpent]);

    // ── Auto-save every 30s ───────────────────────────────
    useEffect(() => {
        const interval = setInterval(() => {
            saveCurrentAnswer(true);
        }, 30000);
        return () => clearInterval(interval);
    }, [saveCurrentAnswer]);

    // ── Anti-cheat ────────────────────────────────────────
    useEffect(() => {
        const handleVisibility = () => {
            if (document.hidden) {
                setTabSwitchCount(prev => {
                    const newCount = prev + 1;
                    logAuditEvent(attemptUuidRef.current, { eventType: 'TAB_SWITCH', eventData: { count: newCount } });
                    const msg = newCount === 1
                        ? '⚠️ Warning: You switched tabs. This has been recorded.'
                        : newCount >= 3
                            ? '🚨 Multiple tab switches detected. Your attempt may be flagged as suspicious.'
                            : `⚠️ Tab switch #${newCount} recorded.`;
                    setWarningModal({ open: true, message: msg });
                    return newCount;
                });
            }
        };
        const handleFSChange = () => {
            if (!document.fullscreenElement) {
                logAuditEvent(attemptUuidRef.current, { eventType: 'FULLSCREEN_EXIT', eventData: {} });
            }
        };
        const noContext = e => e.preventDefault();
        const noCopy    = e => e.preventDefault();

        document.addEventListener('visibilitychange', handleVisibility);
        document.addEventListener('fullscreenchange', handleFSChange);
        document.addEventListener('contextmenu', noContext);
        document.addEventListener('copy', noCopy);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibility);
            document.removeEventListener('fullscreenchange', handleFSChange);
            document.removeEventListener('contextmenu', noContext);
            document.removeEventListener('copy', noCopy);
        };
    }, []);

    // ── Prevent accidental exit ───────────────────────────
    useEffect(() => {
        const handleBefore = e => { e.preventDefault(); e.returnValue = ''; };
        window.addEventListener('beforeunload', handleBefore);
        return () => window.removeEventListener('beforeunload', handleBefore);
    }, []);

    // ── Submit ────────────────────────────────────────────
    const handleSubmit = async () => {
        setSubmitting(true);
        await saveCurrentAnswer(false);
        try {
            const result = await submitAttempt(attemptUuid);
            navigate(`/student/results/${attemptUuid}`, { state: { resultData: result.data } });
        } catch {
            toast.error('Failed to submit. Please try again.');
            setSubmitting(false);
        }
    };

    // ── Navigation ────────────────────────────────────────
    const goTo = async (idx) => {
        await saveCurrentAnswer(true);
        setCurrentIndex(idx);
        setShowHint(false);
        setQuestionTimeSpent(0);
    };

    const setCurrentAns = useCallback((updater) => {
        setAnswers(prev => {
            const cur = prev[qId] ?? {};
            const next = typeof updater === 'function' ? updater(cur) : updater;
            return { ...prev, [qId]: next };
        });
    }, [qId]);

    const toggleFlag = () => {
        const isFlagged = !(currentAns?.isFlagged);
        setAnswers(prev => ({ ...prev, [qId]: { ...(prev[qId] ?? {}), isFlagged } }));
        setTimeout(() => saveCurrentAnswer(true), 100);
    };

    const openHint = () => {
        setShowHint(true);
        setAnswers(prev => ({ ...prev, [qId]: { ...(prev[qId] ?? {}), hintUsed: true } }));
        setTimeout(() => saveCurrentAnswer(true), 100);
    };

    // ── Timer display ─────────────────────────────────────
    const timerColor = timeLeft === null ? 'var(--color-text-secondary)'
        : timeLeft > 60 ? 'var(--color-text-primary)'
        : timeLeft > 30 ? 'var(--color-warning)'
        : 'var(--color-danger)';
    const timerAnim  = timeLeft !== null && timeLeft <= 10 ? 'shake 0.5s infinite'
        : timeLeft !== null && timeLeft <= 30 ? 'pulse 1s infinite' : 'none';

    // ── Summary for submit modal ──────────────────────────
    const answeredCount  = Object.values(answers).filter(a => isAnswered(a)).length;
    const unanswered     = questions.length - answeredCount;
    const flaggedList    = Object.values(answers).filter(a => a.isFlagged);
    const flaggedCount   = flaggedList.length;
    const firstFlagged   = questions.findIndex(q => answers[q.quizQuestionId]?.isFlagged);

    // ── Navigator state per question ─────────────────────
    const getNavState = (idx) => {
        if (idx === currentIndex) return 'current';
        const a = answers[questions[idx]?.quizQuestionId];
        const f = a?.isFlagged;
        const d = isAnswered(a);
        if (d && f) return 'answered_flagged';
        if (d) return 'answered';
        if (f) return 'flagged';
        return 'empty';
    };

    // ─────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────
    return (
        <>
            <style>{`
                @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
                @keyframes shake {
                    0%,100%{transform:translateX(0)}
                    20%{transform:translateX(-3px)}
                    40%{transform:translateX(3px)}
                    60%{transform:translateX(-2px)}
                    80%{transform:translateX(2px)}
                }
            `}</style>

            <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--color-bg-page)', overflow: 'hidden' }}>

                {/* ── TOP BAR ── */}
                <div style={css.topBar}>
                    {/* Left */}
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>
                            {truncateText(attemptData?.quizTitle ?? 'Quiz', 30)}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                            Question {currentIndex + 1} of {questions.length}
                        </span>
                    </div>

                    {/* Center – timer */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        <Clock size={16} style={{ color: timerColor }} />
                        {timeLeft !== null ? (
                            <span style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 700, color: timerColor, animation: timerAnim, letterSpacing: '0.05em' }}>
                                {formatTimeLeft(timeLeft)}
                            </span>
                        ) : (
                            <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>No time limit</span>
                        )}
                    </div>

                    {/* Right */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {autoSaving ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--color-text-secondary)' }}>
                                <Spinner size="sm" /> Saving...
                            </div>
                        ) : lastSaved ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#10B981' }}>
                                <CheckCircle size={13} /> Saved
                            </div>
                        ) : null}

                        <button
                            onClick={() => setShowNavigator(p => !p)}
                            title="Question Navigator"
                            style={{ width: 36, height: 36, border: showNavigator ? '2px solid var(--color-primary)' : '1px solid #e5e7eb', borderRadius: 8, background: showNavigator ? 'var(--color-primary-light)' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: showNavigator ? 'var(--color-primary)' : '#6b7280' }}
                        >
                            <Grid3X3 size={16} />
                        </button>

                        <Button variant="danger" size="sm" icon={<Send size={13} />} onClick={() => setSubmitModal(true)}>
                            Submit
                        </Button>
                    </div>
                </div>

                {/* ── MAIN AREA ── */}
                <div style={{ flex: 1, display: 'flex', marginTop: 56, overflow: 'hidden' }}>

                    {/* QUESTION AREA */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '24px', minWidth: 0 }}>
                        <div style={{ maxWidth: 760, margin: '0 auto' }}>

                            {/* Question header */}
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
                                {/* Left badges */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                    <span style={{ padding: '4px 12px', background: 'var(--color-primary)', color: '#fff', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                                        Q{currentIndex + 1}
                                    </span>
                                    <span style={{ padding: '4px 10px', background: '#F0FDF4', color: '#10B981', border: '1px solid #86efac', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                                        +{currentQuestion?.marks ?? 0} marks
                                    </span>
                                    {currentQuestion?.negativeMarks > 0 && (
                                        <span style={{ padding: '4px 10px', background: '#FEF2F2', color: '#EF4444', border: '1px solid #fca5a5', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                                            -{currentQuestion.negativeMarks}
                                        </span>
                                    )}
                                    {currentQuestion?.difficulty && (
                                        <span style={{ padding: '4px 10px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 20, fontSize: 11, fontWeight: 600, color: getDifficultyColor(currentQuestion.difficulty) }}>
                                            {currentQuestion.difficulty}
                                        </span>
                                    )}
                                </div>

                                {/* Right controls */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    {currentQuestion?.perQuestionSecs && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: '#FEF3C7', color: '#92400E', fontSize: 12, fontWeight: 600 }}>
                                            <Clock size={12} />
                                            {Math.max(0, currentQuestion.perQuestionSecs - questionTimeSpent)}s
                                        </div>
                                    )}
                                    <button
                                        onClick={toggleFlag}
                                        title={currentAns?.isFlagged ? 'Remove flag' : 'Flag for review'}
                                        style={{ width: 36, height: 36, borderRadius: 8, border: currentAns?.isFlagged ? '2px solid #F59E0B' : '1px solid #e5e7eb', background: currentAns?.isFlagged ? '#FFFBEB' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, transition: 'all 0.15s' }}
                                    >
                                        🚩
                                    </button>
                                    {currentQuestion?.hintText && (
                                        <button
                                            onClick={openHint}
                                            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#F59E0B', transition: 'all 0.15s' }}
                                        >
                                            <Lightbulb size={13} /> Hint
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Question text */}
                            {currentQuestion?.questionType === 'CODE_SNIPPET' ? (
                                <div style={{ background: '#1e1e2e', borderRadius: 12, padding: '20px 24px', marginBottom: 24, overflow: 'auto', border: '1px solid #374151' }}>
                                    <pre style={{ color: '#cdd6f4', fontFamily: '"Fira Code", "Cascadia Code", monospace', fontSize: 14, lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>
                                        {currentQuestion.questionText}
                                    </pre>
                                </div>
                            ) : (
                                <div style={{ fontSize: 18, fontWeight: 500, color: 'var(--color-text-primary)', lineHeight: 1.7, marginBottom: 24, padding: '20px 24px', background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                    {currentQuestion?.questionText}
                                    {currentQuestion?.mediaUrl && currentQuestion.questionType !== 'CODE_SNIPPET' && (
                                        <img src={currentQuestion.mediaUrl} alt="Question media" style={{ display: 'block', marginTop: 16, maxWidth: '100%', borderRadius: 10, border: '1px solid #e5e7eb' }} />
                                    )}
                                </div>
                            )}

                            {/* Hint panel */}
                            {showHint && currentQuestion?.hintText && (
                                <div style={{ padding: '14px 18px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                    <Lightbulb size={18} style={{ color: '#F59E0B', flexShrink: 0, marginTop: 1 }} />
                                    <div style={{ flex: 1 }}>
                                        <span style={{ fontSize: 13, fontWeight: 700, color: '#92400E' }}>Hint: </span>
                                        <span style={{ fontSize: 13, color: '#78350F' }}>{currentQuestion.hintText}</span>
                                        <div style={{ fontSize: 11, color: '#A16207', marginTop: 4 }}>(Using hint is recorded)</div>
                                    </div>
                                    <button onClick={() => setShowHint(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#92400E', padding: 2 }}><X size={14} /></button>
                                </div>
                            )}

                            {/* Answer section */}
                            <div style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', border: '1px solid #e5e7eb', marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                {renderAnswerSection(currentQuestion, currentAns, setCurrentAns)}
                                {!currentQuestion?.questionType && (
                                    <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: 20 }}>Loading question...</div>
                                )}
                            </div>

                            {/* Navigation */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingBottom: 24 }}>
                                <Button
                                    variant="outline"
                                    icon={<ChevronLeft size={16} />}
                                    disabled={currentIndex === 0}
                                    onClick={() => goTo(currentIndex - 1)}
                                >
                                    Previous
                                </Button>

                                {/* Mini dots (up to 10) */}
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', flex: 1 }}>
                                    {questions.slice(0, 10).map((_, idx) => {
                                        const state = getNavState(idx);
                                        const dotColors = {
                                            current: 'var(--color-primary)',
                                            answered_flagged: '#F59E0B',
                                            answered: '#10B981',
                                            flagged: '#FEF3C7',
                                            empty: '#e5e7eb',
                                        };
                                        return (
                                            <button key={idx}
                                                onClick={() => goTo(idx)}
                                                style={{ width: 10, height: 10, borderRadius: '50%', border: 'none', background: dotColors[state] ?? '#e5e7eb', cursor: 'pointer', padding: 0, transition: 'all 0.15s', transform: idx === currentIndex ? 'scale(1.4)' : 'scale(1)' }}
                                            />
                                        );
                                    })}
                                    {questions.length > 10 && <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', alignSelf: 'center' }}>+{questions.length - 10}</span>}
                                </div>

                                {currentIndex < questions.length - 1 ? (
                                    <Button
                                        variant="primary"
                                        onClick={() => goTo(currentIndex + 1)}
                                    >
                                        Next <ChevronRight size={16} />
                                    </Button>
                                ) : (
                                    <Button
                                        variant="danger"
                                        icon={<Send size={14} />}
                                        onClick={() => setSubmitModal(true)}
                                    >
                                        Submit Quiz
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* NAVIGATOR PANEL */}
                    {showNavigator && (
                        <>
                            {/* Mobile overlay backdrop */}
                            <div
                                onClick={() => setShowNavigator(false)}
                                style={{ display: 'none', position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 90 }}
                                className="navigator-backdrop"
                            />
                            <div style={{
                                width: 300, background: '#fff', borderLeft: '1px solid #e5e7eb',
                                overflowY: 'auto', padding: '20px', flexShrink: 0,
                                boxShadow: '-4px 0 12px rgba(0,0,0,0.06)',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                                    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Question Navigator</h3>
                                    <button onClick={() => setShowNavigator(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}><X size={16} /></button>
                                </div>

                                {/* Stats */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 18 }}>
                                    {[
                                        { label: 'Answered',  val: answeredCount, color: '#10B981' },
                                        { label: 'Flagged',   val: flaggedCount,  color: '#F59E0B' },
                                        { label: 'Remaining', val: unanswered,    color: '#6b7280' },
                                    ].map(({ label, val, color }) => (
                                        <div key={label} style={{ textAlign: 'center', padding: '8px 4px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                                            <div style={{ fontSize: 18, fontWeight: 700, color }}>{val}</div>
                                            <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', fontWeight: 500 }}>{label}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* Legend */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16, fontSize: 11, color: 'var(--color-text-secondary)' }}>
                                    {[
                                        { color: '#10B981', label: 'Answered' },
                                        { color: 'var(--color-primary)', label: 'Current' },
                                        { color: '#F59E0B', label: 'Flagged' },
                                        { color: '#e5e7eb', label: 'Not answered' },
                                    ].map(({ color, label }) => (
                                        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                            <div style={{ width: 12, height: 12, borderRadius: 3, background: color, border: color === '#e5e7eb' ? '1px solid #d1d5db' : 'none' }} />
                                            {label}
                                        </div>
                                    ))}
                                </div>

                                {/* Grid */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                                    {questions.map((_, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => { goTo(idx); if (window.innerWidth < 768) setShowNavigator(false); }}
                                            style={css.navBtn(getNavState(idx))}
                                        >
                                            {idx + 1}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* ── SUBMIT MODAL ── */}
                <Modal
                    isOpen={submitModal}
                    onClose={() => setSubmitModal(false)}
                    title="Submit Quiz?"
                    size="sm"
                    footer={
                        <>
                            <Button variant="outline" onClick={() => {
                                setSubmitModal(false);
                                if (flaggedCount > 0 && firstFlagged !== -1) goTo(firstFlagged);
                            }}>
                                Review
                            </Button>
                            <Button variant="danger" loading={submitting} onClick={handleSubmit}>
                                Submit Now
                            </Button>
                        </>
                    }
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {/* Summary table */}
                        <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
                            {[
                                { label: 'Total Questions', val: questions.length,  color: 'var(--color-text-primary)' },
                                { label: 'Answered',        val: answeredCount,      color: '#10B981' },
                                { label: 'Unanswered',      val: unanswered,         color: unanswered > 0 ? '#EF4444' : '#10B981' },
                                { label: 'Flagged',         val: flaggedCount,       color: flaggedCount > 0 ? '#F59E0B' : 'var(--color-text-primary)' },
                            ].map(({ label, val, color }, i) => (
                                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderBottom: i < 3 ? '1px solid #f1f5f9' : 'none', background: i % 2 ? '#fafbfc' : '#fff' }}>
                                    <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{label}</span>
                                    <span style={{ fontSize: 14, fontWeight: 700, color }}>{val}</span>
                                </div>
                            ))}
                        </div>

                        {unanswered > 0 && (
                            <div style={{ padding: '12px 14px', background: '#FEF2F2', border: '1px solid #fca5a5', borderRadius: 10, fontSize: 13, color: '#991B1B' }}>
                                ⚠️ You have <strong>{unanswered}</strong> unanswered question(s). Unanswered questions will receive 0 marks.
                            </div>
                        )}
                        {flaggedCount > 0 && (
                            <div style={{ padding: '12px 14px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, fontSize: 13, color: '#92400E' }}>
                                🚩 You have <strong>{flaggedCount}</strong> flagged question(s). Review them before submitting.
                            </div>
                        )}
                    </div>
                </Modal>

                {/* ── WARNING MODAL ── */}
                <Modal
                    isOpen={warningModal.open}
                    onClose={() => setWarningModal({ open: false, message: '' })}
                    title="Warning"
                    size="sm"
                    closeOnBackdrop={false}
                    footer={
                        <Button variant="primary" onClick={() => setWarningModal({ open: false, message: '' })}>
                            I Understand
                        </Button>
                    }
                >
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '8px 0', textAlign: 'center' }}>
                        <div style={{ width: 56, height: 56, background: '#FEF3C7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <AlertTriangle size={28} style={{ color: '#F59E0B' }} />
                        </div>
                        <p style={{ fontSize: 15, color: 'var(--color-text-primary)', lineHeight: 1.6, margin: 0 }}>
                            {warningModal.message}
                        </p>
                    </div>
                </Modal>
            </div>
        </>
    );
}