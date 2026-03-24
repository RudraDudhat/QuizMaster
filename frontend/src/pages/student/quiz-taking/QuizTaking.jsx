import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    Clock, Grid3X3, Send, ChevronLeft, ChevronRight,
    Lightbulb, X, AlertTriangle, CheckCircle,
    Save, GripVertical,
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

// Key fix: use selectedOptionUuids (not selectedOptionIds)
function isAnswered(ans) {
    if (!ans) return false;
    if (ans.selectedOptionUuids?.length > 0) return true;
    if (ans.textAnswer?.trim()) return true;
    if (ans.orderedOptionUuids?.length > 0) return true;
    if (ans.matchPairs && Object.keys(ans.matchPairs).length > 0) return true;
    if (ans.booleanAnswer !== undefined && ans.booleanAnswer !== null) return true;
    return false;
}

function getDifficultyColor(d) {
    if (!d) return '#6b7280';
    switch (String(d).toUpperCase()) {
        case 'EASY':   return '#10B981';
        case 'MEDIUM': return '#F59E0B';
        case 'HARD':   return '#EF4444';
        default:       return '#6b7280';
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
            current:         { bg: 'var(--color-primary)', color: '#fff',     border: 'var(--color-primary)' },
            answered_flagged:{ bg: '#F59E0B',              color: '#fff',     border: '#F59E0B' },
            answered:        { bg: '#10B981',              color: '#fff',     border: '#10B981' },
            flagged:         { bg: '#FEF3C7',              color: '#92400E',  border: '#F59E0B' },
            empty:           { bg: '#fff',                 color: '#6b7280',  border: '#e5e7eb' },
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

// ─── MCQ Single ───────────────────────────────────────────
// BUG FIX: use opt.uuid instead of opt.id; selectedOptionUuids not selectedOptionIds
function MCQSingle({ question, ans, setAns }) {
    const opts = question.options ?? [];
    const sel  = ans?.selectedOptionUuids ?? [];
    return (
        <div>
            {opts.map(opt => {
                const selected = sel.includes(opt.uuid);
                return (
                    <button key={opt.uuid} style={css.optionBtn(selected)}
                        onClick={() => setAns(cur => ({ ...cur, selectedOptionUuids: [opt.uuid] }))}>
                        <div style={css.radioCircle(selected)} />
                        <div style={{ flex: 1 }}>
                            <span style={{ fontSize: 15, lineHeight: 1.5, color: 'var(--color-text-primary)' }}>
                                {opt.optionText}
                            </span>
                            {opt.mediaUrl && <img src={opt.mediaUrl} alt="" style={{ marginTop: 8, maxWidth: 240, borderRadius: 8 }} />}
                        </div>
                    </button>
                );
            })}
        </div>
    );
}

// ─── MCQ Multi ────────────────────────────────────────────
function MCQMulti({ question, ans, setAns }) {
    const opts = question.options ?? [];
    const sel  = ans?.selectedOptionUuids ?? [];
    const toggle = (uuid) => {
        const newSel = sel.includes(uuid) ? sel.filter(x => x !== uuid) : [...sel, uuid];
        setAns(cur => ({ ...cur, selectedOptionUuids: newSel }));
    };
    return (
        <div>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 12, fontStyle: 'italic' }}>
                Select all that apply
            </p>
            {opts.map(opt => {
                const selected = sel.includes(opt.uuid);
                return (
                    <button key={opt.uuid} style={css.optionBtn(selected)} onClick={() => toggle(opt.uuid)}>
                        <div style={css.checkBox(selected)}>{selected && '✓'}</div>
                        <div style={{ flex: 1 }}>
                            <span style={{ fontSize: 15, lineHeight: 1.5, color: 'var(--color-text-primary)' }}>
                                {opt.optionText}
                            </span>
                            {opt.mediaUrl && <img src={opt.mediaUrl} alt="" style={{ marginTop: 8, maxWidth: 240, borderRadius: 8 }} />}
                        </div>
                    </button>
                );
            })}
        </div>
    );
}

// ─── True / False ─────────────────────────────────────────
function TrueFalse({ question, ans, setAns }) {
    const opts     = question.options ?? [];
    const trueOpt  = opts.find(o => String(o.optionText).toLowerCase() === 'true')  || opts[0];
    const falseOpt = opts.find(o => String(o.optionText).toLowerCase() === 'false') || opts[1];
    const val      = ans?.booleanAnswer;
    const selectTF = (bool, opt) => {
        setAns(cur => ({
            ...cur,
            booleanAnswer: bool,
            selectedOptionUuids: opt?.uuid ? [opt.uuid] : [],
        }));
    };
    return (
        <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
            <button style={css.tfBtn(val === true)}  onClick={() => selectTF(true,  trueOpt)}>✓ True</button>
            <button style={css.tfBtn(val === false)} onClick={() => selectTF(false, falseOpt)}>✗ False</button>
        </div>
    );
}

// ─── Text Answer ──────────────────────────────────────────
function TextAnswer({ ans, setAns, rows = 3, essay = false }) {
    return (
        <div>
            <textarea
                rows={rows}
                value={ans?.textAnswer ?? ''}
                onChange={e => setAns(cur => ({ ...cur, textAnswer: e.target.value }))}
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

// ─── Ordering ─────────────────────────────────────────────
function OrderingQuestion({ question, ans, setAns }) {
    const [items, setItems] = useState(() => {
        const opts = [...(question.options ?? [])].sort((a, b) => (a.optionOrder ?? 0) - (b.optionOrder ?? 0));
        if (ans?.orderedOptionUuids?.length) {
            const idxMap = Object.fromEntries(ans.orderedOptionUuids.map((uuid, i) => [uuid, i]));
            return [...opts].sort((a, b) => (idxMap[a.uuid] ?? 999) - (idxMap[b.uuid] ?? 999));
        }
        return opts;
    });
    const [dragging, setDragging] = useState(null);

    const handleDragStart = (i) => setDragging(i);
    const handleDragOver  = (e, i) => {
        e.preventDefault();
        if (dragging === null || dragging === i) return;
        const newItems = [...items];
        const [moved] = newItems.splice(dragging, 1);
        newItems.splice(i, 0, moved);
        setDragging(i);
        setItems(newItems);
        setAns(cur => ({ ...cur, orderedOptionUuids: newItems.map(x => x.uuid) }));
    };
    const handleDragEnd = () => setDragging(null);

    return (
        <div>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 12, fontStyle: 'italic' }}>
                Drag items to arrange in the correct order
            </p>
            {items.map((opt, i) => (
                <div key={opt.uuid}
                    draggable
                    onDragStart={() => handleDragStart(i)}
                    onDragOver={e => handleDragOver(e, i)}
                    onDragEnd={handleDragEnd}
                    style={css.draggableItem(dragging === i)}
                >
                    <GripVertical size={16} style={{ color: '#9ca3af', flexShrink: 0 }} />
                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                        {i + 1}
                    </div>
                    <span style={{ flex: 1, fontSize: 15 }}>{opt.optionText}</span>
                </div>
            ))}
        </div>
    );
}

// ─── Match the Following ──────────────────────────────────
function MatchQuestion({ question, ans, setAns }) {
    const opts       = question.options ?? [];
    const leftItems  = opts.filter(o => o.matchPairKey);
    const rightItems = opts.filter(o => o.matchPairVal);
    const pairs      = ans?.matchPairs ?? {};

    // fallback: if no matchPairKey, split options in half
    const lefts  = leftItems.length  ? leftItems  : opts.slice(0, Math.ceil(opts.length / 2));
    const rights = rightItems.length ? rightItems : opts.slice(Math.ceil(opts.length / 2));

    const rightOptions = [
        { value: '', label: '— Select match —' },
        ...rights.map(o => ({ value: String(o.uuid), label: o.matchPairVal || o.optionText })),
    ];

    const colorsArr = ['#6366F1','#10B981','#F59E0B','#EF4444','#8B5CF6','#06B6D4'];

    return (
        <div>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 16, fontStyle: 'italic' }}>
                Match each item on the left with the correct answer
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {lefts.map((left, i) => {
                    const c = colorsArr[i % colorsArr.length];
                    return (
                        <div key={left.uuid} style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                            <div style={{ flex: '1 1 200px', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#f8fafc', borderRadius: 10, border: '2px solid #e5e7eb' }}>
                                <div style={{ width: 10, height: 10, borderRadius: '50%', background: c, flexShrink: 0 }} />
                                <span style={{ fontSize: 14, fontWeight: 500 }}>{left.matchPairKey || left.optionText}</span>
                            </div>
                            <div style={{ color: '#9ca3af', fontWeight: 700, fontSize: 18 }}>→</div>
                            <div style={{ flex: '1 1 200px', position: 'relative' }}>
                                <select
                                    value={String(pairs[left.uuid] ?? '')}
                                    onChange={e => {
                                        const val = e.target.value || undefined;
                                        const newPairs = { ...pairs };
                                        if (val) newPairs[left.uuid] = val;
                                        else delete newPairs[left.uuid];
                                        setAns(cur => ({ ...cur, matchPairs: newPairs }));
                                    }}
                                    style={{ width: '100%', height: 44, borderRadius: 10, border: `2px solid ${pairs[left.uuid] ? c : '#e5e7eb'}`, padding: '0 36px 0 12px', fontSize: 14, outline: 'none', background: '#fff', appearance: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
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

// ─── Answer section dispatcher ────────────────────────────
function renderAnswerSection(question, ans, setAns) {
    if (!question) return null;
    const type = String(question.questionType ?? '');
    switch (type) {
        case 'MCQ_SINGLE':          return <MCQSingle question={question} ans={ans} setAns={setAns} />;
        case 'MCQ_MULTI':           return <MCQMulti  question={question} ans={ans} setAns={setAns} />;
        case 'TRUE_FALSE':          return <TrueFalse question={question} ans={ans} setAns={setAns} />;
        case 'SHORT_ANSWER':
        case 'FILL_IN_THE_BLANK':   return <TextAnswer ans={ans} setAns={setAns} rows={3} />;
        case 'ESSAY':               return <TextAnswer ans={ans} setAns={setAns} rows={8} essay />;
        case 'ORDERING':            return <OrderingQuestion question={question} ans={ans} setAns={setAns} />;
        case 'MATCH_THE_FOLLOWING': return <MatchQuestion question={question} ans={ans} setAns={setAns} />;
        case 'CODE_SNIPPET':
            return <MCQSingle question={question} ans={ans} setAns={setAns} />;
        case 'IMAGE_BASED':
            return (
                <div>
                    {question.mediaUrl && (
                        <img src={question.mediaUrl} alt="Question" style={{ maxWidth: '100%', borderRadius: 12, marginBottom: 16, border: '1px solid #e5e7eb' }} />
                    )}
                    <MCQSingle question={question} ans={ans} setAns={setAns} />
                </div>
            );
        default:
            return <TextAnswer ans={ans} setAns={setAns} rows={3} />;
    }
}

// ════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════
export default function QuizTaking() {
    const { attemptUuid } = useParams();
    const location        = useLocation();
    const navigate        = useNavigate();
    const attemptData     = location.state?.attemptData;
    const questions       = attemptData?.questions ?? [];

    // ── State ─────────────────────────────────────────────
    const [currentIndex,       setCurrentIndex]      = useState(0);
    const [answers,            setAnswers]            = useState({});
    const [questionTimeSpent,  setQuestionTimeSpent]  = useState(0);
    const [showHint,           setShowHint]           = useState(false);
    const [showNavigator,      setShowNavigator]      = useState(false);
    const [submitModal,        setSubmitModal]        = useState(false);
    const [submitting,         setSubmitting]         = useState(false);
    const [saveNextLoading,    setSaveNextLoading]    = useState(false);
    const [autoSaving,         setAutoSaving]         = useState(false);
    const [lastSaved,          setLastSaved]          = useState(null);
    const [tabSwitchCount,     setTabSwitchCount]     = useState(0);
    const [warningModal,       setWarningModal]       = useState({ open: false, message: '' });

    // ── Timer ─────────────────────────────────────────────
    const [timeLeft, setTimeLeft] = useState(() => {
        if (!attemptData?.deadlineAt) return null;
        const deadline = new Date(attemptData.deadlineAt);
        const now      = new Date();
        return Math.max(0, Math.floor((deadline - now) / 1000));
    });

    // BUG FIX: use quizQuestionUuid as the answers map key
    const currentQuestion = questions[currentIndex];
    const qKey            = currentQuestion?.quizQuestionUuid;   // ← was quizQuestionId
    const currentAns      = answers[qKey] ?? {};

    // Stable refs for use inside callbacks/intervals
    const answersRef      = useRef(answers);
    const questionTimeRef = useRef(questionTimeSpent);
    const currentIdxRef   = useRef(currentIndex);
    const questionsRef    = useRef(questions);
    const attemptRef      = useRef(attemptUuid);
    answersRef.current    = answers;
    questionTimeRef.current = questionTimeSpent;
    currentIdxRef.current   = currentIndex;
    questionsRef.current    = questions;
    attemptRef.current      = attemptUuid;

    // ── Invalid session guard ─────────────────────────────
    if (!attemptData) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 16, background: 'var(--color-bg-page)' }}>
                <div style={{ width: 64, height: 64, background: '#FEF2F2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AlertTriangle size={32} style={{ color: '#EF4444' }} />
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Invalid attempt session</h2>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, margin: 0 }}>
                    Please start the quiz from the quiz detail page.
                </p>
                <Button onClick={() => navigate('/student/quizzes')}>Go to Quizzes</Button>
            </div>
        );
    }

    // ── Save current answer ───────────────────────────────
    // BUG FIX: send quizQuestionUuid + selectedOptionUuids (not quizQuestionId/selectedOptionIds)
    const saveCurrentAnswer = useCallback(async (silent = false) => {
        const idx = currentIdxRef.current;
        const qs  = questionsRef.current;
        const qq  = qs[idx];
        if (!qq?.quizQuestionUuid) return;

        const key = qq.quizQuestionUuid;
        const ans = answersRef.current[key];

        if (!silent) setAutoSaving(true);
        try {
            await saveAnswer(attemptRef.current, {
                quizQuestionUuid:   key,                                   // ← correct field
                selectedOptionUuids: ans?.selectedOptionUuids ?? null,     // ← correct field
                textAnswer:          ans?.textAnswer          ?? null,
                orderedOptionUuids:  ans?.orderedOptionUuids  ?? null,     // ← correct field
                matchPairs:          ans?.matchPairs          ?? null,
                booleanAnswer:       ans?.booleanAnswer !== undefined && ans?.booleanAnswer !== null
                                       ? ans.booleanAnswer : null,
                hintUsed:            ans?.hintUsed   ?? false,
                timeSpentSeconds:    questionTimeRef.current,
                isFlagged:           ans?.isFlagged  ?? false,
            });
            setLastSaved(new Date().toISOString());
        } catch {
            if (!silent) toast.error('Failed to save answer. Check connection.');
        } finally {
            if (!silent) setAutoSaving(false);
        }
    }, []);

    // ── Auto-submit when timer hits 0 ─────────────────────
    const handleAutoSubmit = useCallback(async () => {
        await saveCurrentAnswer(true);
        try {
            const result = await submitAttempt(attemptRef.current);
            navigate(`/student/results/${attemptRef.current}`, {
                state: { resultData: result.data, autoSubmitted: true },
            });
        } catch {
            navigate(`/student/results/${attemptRef.current}`, {
                state: { autoSubmitted: true },
            });
        }
    }, [navigate, saveCurrentAnswer]);

    // ── Global countdown ──────────────────────────────────
    useEffect(() => {
        if (timeLeft === null) return;
        const id = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) { clearInterval(id); handleAutoSubmit(); return 0; }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Per-question time spent ───────────────────────────
    useEffect(() => { setQuestionTimeSpent(0); }, [currentIndex]);
    useEffect(() => {
        const id = setInterval(() => setQuestionTimeSpent(p => p + 1), 1000);
        return () => clearInterval(id);
    }, [currentIndex]);

    // Per-question auto-advance when perQuestionSecs expires
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

    // ── Auto-save every 30 s ──────────────────────────────
    useEffect(() => {
        const id = setInterval(() => saveCurrentAnswer(true), 30000);
        return () => clearInterval(id);
    }, [saveCurrentAnswer]);

    // ── Anti-cheat ────────────────────────────────────────
    useEffect(() => {
        const onVisibility = () => {
            if (document.hidden) {
                setTabSwitchCount(prev => {
                    const n = prev + 1;
                    logAuditEvent(attemptRef.current, { eventType: 'TAB_SWITCH', eventData: { count: n } });
                    const msg = n === 1
                        ? '⚠️ Warning: You switched tabs. This has been recorded.'
                        : n >= 3
                            ? '🚨 Multiple tab switches detected. Your attempt may be flagged as suspicious.'
                            : `⚠️ Tab switch #${n} recorded.`;
                    setWarningModal({ open: true, message: msg });
                    return n;
                });
            }
        };
        const onFS      = () => { if (!document.fullscreenElement) logAuditEvent(attemptRef.current, { eventType: 'FULLSCREEN_EXIT', eventData: {} }); };
        const noCtx     = e => e.preventDefault();
        const noCopy    = e => e.preventDefault();
        const noBefore  = e => { e.preventDefault(); e.returnValue = ''; };

        document.addEventListener('visibilitychange', onVisibility);
        document.addEventListener('fullscreenchange', onFS);
        document.addEventListener('contextmenu', noCtx);
        document.addEventListener('copy', noCopy);
        window.addEventListener('beforeunload', noBefore);

        return () => {
            document.removeEventListener('visibilitychange', onVisibility);
            document.removeEventListener('fullscreenchange', onFS);
            document.removeEventListener('contextmenu', noCtx);
            document.removeEventListener('copy', noCopy);
            window.removeEventListener('beforeunload', noBefore);
        };
    }, []);

    // ── Answer setter for current question only ───────────
    // BUG FIX: setCurrentAns now closes over the CURRENT qKey via a fresh function each render
    // — no useCallback here so it always uses the latest qKey
    const setCurrentAns = (updater) => {
        if (!qKey) return;
        setAnswers(prev => {
            const cur  = prev[qKey] ?? {};
            const next = typeof updater === 'function' ? updater(cur) : updater;
            return { ...prev, [qKey]: next };
        });
    };

    // ── Navigation ────────────────────────────────────────
    const goTo = async (idx) => {
        await saveCurrentAnswer(true);
        setCurrentIndex(idx);
        setShowHint(false);
        setQuestionTimeSpent(0);
    };

    const handleSaveAndNext = async () => {
        setSaveNextLoading(true);
        await saveCurrentAnswer(false);  // visible save indicator
        setSaveNextLoading(false);
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(p => p + 1);
            setShowHint(false);
            setQuestionTimeSpent(0);
        }
    };

    const toggleFlag = () => {
        if (!qKey) return;
        const isFlagged = !currentAns?.isFlagged;
        setAnswers(prev => ({ ...prev, [qKey]: { ...(prev[qKey] ?? {}), isFlagged } }));
        setTimeout(() => saveCurrentAnswer(true), 50);
    };

    const openHint = () => {
        setShowHint(true);
        if (!qKey) return;
        setAnswers(prev => ({ ...prev, [qKey]: { ...(prev[qKey] ?? {}), hintUsed: true } }));
        setTimeout(() => saveCurrentAnswer(true), 50);
    };

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

    // ── Timer colors ──────────────────────────────────────
    const timerColor = timeLeft === null  ? 'var(--color-text-secondary)'
        : timeLeft > 60  ? 'var(--color-text-primary)'
        : timeLeft > 30  ? 'var(--color-warning)'
        : 'var(--color-danger)';
    const timerAnim  = timeLeft !== null && timeLeft <= 10 ? 'shake 0.5s infinite'
        : timeLeft !== null && timeLeft <= 30 ? 'pulse 1s infinite' : 'none';

    // ── Submit modal summary ──────────────────────────────
    const answeredCount  = questions.filter(q => isAnswered(answers[q.quizQuestionUuid])).length;
    const unanswered     = questions.length - answeredCount;
    const flaggedCount   = questions.filter(q => answers[q.quizQuestionUuid]?.isFlagged).length;
    const firstFlagged   = questions.findIndex(q => answers[q.quizQuestionUuid]?.isFlagged);

    // ── Navigator state for a question index ─────────────
    const getNavState = (idx) => {
        if (idx === currentIndex) return 'current';
        const a = answers[questions[idx]?.quizQuestionUuid];
        const f = a?.isFlagged;
        const d = isAnswered(a);
        if (d && f) return 'answered_flagged';
        if (d)      return 'answered';
        if (f)      return 'flagged';
        return 'empty';
    };

    // ─────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────
    return (
        <>
            <style>{`
                @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
                @keyframes shake {
                    0%,100%{transform:translateX(0)}
                    20%{transform:translateX(-3px)} 40%{transform:translateX(3px)}
                    60%{transform:translateX(-2px)} 80%{transform:translateX(2px)}
                }
            `}</style>

            <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--color-bg-page)', overflow: 'hidden' }}>

                {/* ══ TOP BAR ══ */}
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

                {/* ══ MAIN AREA ══ */}
                <div style={{ flex: 1, display: 'flex', marginTop: 56, overflow: 'hidden' }}>

                    {/* QUESTION AREA */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '24px', minWidth: 0 }}>
                        <div style={{ maxWidth: 760, margin: '0 auto' }}>

                            {/* Question header */}
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
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
                                <div style={{ marginBottom: 24 }}>
                                    <div style={{ fontSize: 18, fontWeight: 500, color: 'var(--color-text-primary)', lineHeight: 1.7, marginBottom: 16, padding: '20px 24px', background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                        {currentQuestion.questionText}
                                    </div>
                                    {(currentQuestion.codeContent || currentQuestion.mediaUrl) && (
                                        <div style={{ background: '#1e1e2e', borderRadius: 12, padding: '20px 24px', overflow: 'auto', border: '1px solid #374151' }}>
                                            <pre style={{ color: '#cdd6f4', fontFamily: '"Fira Code", monospace', fontSize: 14, lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>
                                                {currentQuestion.codeContent || currentQuestion.mediaUrl}
                                            </pre>
                                        </div>
                                    )}
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
                            </div>

                            {/* Navigation row */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingBottom: 32, flexWrap: 'wrap' }}>
                                {/* Previous */}
                                <Button
                                    variant="outline"
                                    icon={<ChevronLeft size={16} />}
                                    disabled={currentIndex === 0}
                                    onClick={() => goTo(currentIndex - 1)}
                                >
                                    Previous
                                </Button>

                                {/* Mini dots */}
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', flex: 1 }}>
                                    {questions.slice(0, 10).map((_, idx) => {
                                        const state = getNavState(idx);
                                        const dotColor = {
                                            current: 'var(--color-primary)',
                                            answered_flagged: '#F59E0B',
                                            answered: '#10B981',
                                            flagged: '#FEF3C7',
                                            empty: '#e5e7eb',
                                        }[state] ?? '#e5e7eb';
                                        return (
                                            <button key={idx}
                                                onClick={() => goTo(idx)}
                                                title={`Question ${idx + 1}`}
                                                style={{ width: 10, height: 10, borderRadius: '50%', border: 'none', background: dotColor, cursor: 'pointer', padding: 0, transition: 'all 0.15s', transform: idx === currentIndex ? 'scale(1.4)' : 'scale(1)' }}
                                            />
                                        );
                                    })}
                                    {questions.length > 10 && (
                                        <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', alignSelf: 'center' }}>
                                            +{questions.length - 10}
                                        </span>
                                    )}
                                </div>

                                {/* Right side: Save & Next + Next/Submit */}
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    {currentIndex < questions.length - 1 && (
                                        <Button
                                            variant="outline"
                                            loading={saveNextLoading}
                                            icon={!saveNextLoading ? <Save size={14} /> : null}
                                            onClick={handleSaveAndNext}
                                        >
                                            Save &amp; Next
                                        </Button>
                                    )}
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
                    </div>

                    {/* ══ NAVIGATOR PANEL ══ */}
                    {showNavigator && (
                        <div style={{ width: 300, background: '#fff', borderLeft: '1px solid #e5e7eb', overflowY: 'auto', padding: '20px', flexShrink: 0, boxShadow: '-4px 0 12px rgba(0,0,0,0.06)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Question Navigator</h3>
                                <button onClick={() => setShowNavigator(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Stats */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 18 }}>
                                {[
                                    { label: 'Answered',  val: answeredCount,            color: '#10B981' },
                                    { label: 'Flagged',   val: flaggedCount,              color: '#F59E0B' },
                                    { label: 'Remaining', val: questions.length - answeredCount, color: '#6b7280' },
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
                                    { color: '#10B981',              label: 'Answered' },
                                    { color: 'var(--color-primary)', label: 'Current' },
                                    { color: '#F59E0B',              label: 'Flagged' },
                                    { color: '#e5e7eb',              label: 'Not answered' },
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
                    )}
                </div>

                {/* ══ SUBMIT MODAL ══ */}
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
                        <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
                            {[
                                { label: 'Total Questions', val: questions.length, color: 'var(--color-text-primary)' },
                                { label: 'Answered',        val: answeredCount,     color: '#10B981' },
                                { label: 'Unanswered',      val: unanswered,        color: unanswered > 0 ? '#EF4444' : '#10B981' },
                                { label: 'Flagged',         val: flaggedCount,      color: flaggedCount > 0 ? '#F59E0B' : 'var(--color-text-primary)' },
                            ].map(({ label, val, color }, i) => (
                                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderBottom: i < 3 ? '1px solid #f1f5f9' : 'none', background: i % 2 ? '#fafbfc' : '#fff' }}>
                                    <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{label}</span>
                                    <span style={{ fontSize: 14, fontWeight: 700, color }}>{val}</span>
                                </div>
                            ))}
                        </div>
                        {unanswered > 0 && (
                            <div style={{ padding: '12px 14px', background: '#FEF2F2', border: '1px solid #fca5a5', borderRadius: 10, fontSize: 13, color: '#991B1B' }}>
                                ⚠️ You have <strong>{unanswered}</strong> unanswered question(s). They will receive 0 marks.
                            </div>
                        )}
                        {flaggedCount > 0 && (
                            <div style={{ padding: '12px 14px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, fontSize: 13, color: '#92400E' }}>
                                🚩 You have <strong>{flaggedCount}</strong> flagged question(s). Review them before submitting.
                            </div>
                        )}
                    </div>
                </Modal>

                {/* ══ WARNING MODAL ══ */}
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