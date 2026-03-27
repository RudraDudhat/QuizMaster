import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Trophy, BookOpen, CheckCircle2, XCircle, SkipForward,
    Plus, Minus, Clock, AlertCircle, X, ArrowRight,
    RotateCcw, List, ChevronRight,
} from 'lucide-react';
import { getAttemptResult } from '../../../api/attempt.api';
import {
    formatPercentage, formatScore, formatDuration,
    formatDateTime, getStatusColor,
} from '../../../utils/formatters';
import Badge from '../../../components/common/Badge';
import Button from '../../../components/common/Button';

function Shimmer({ h = 20, rounded = 8 }) {
    return (
        <div style={{
            height: h, borderRadius: rounded,
            background: 'linear-gradient(90deg,var(--color-skeleton-1) 25%,var(--color-skeleton-2) 50%,var(--color-skeleton-1) 75%)',
            backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite',
        }} />
    );
}

function CountUp({ target, duration = 1500 }) {
    const [val, setVal] = useState(0);
    useEffect(() => {
        if (target == null) return;
        const steps = 60;
        const inc = target / steps;
        let cur = 0;
        const iv = setInterval(() => {
            cur = Math.min(cur + inc, target);
            setVal(cur);
            if (cur >= target) clearInterval(iv);
        }, duration / steps);
        return () => clearInterval(iv);
    }, [target, duration]);
    return <>{val.toFixed(2)}</>;
}

function AnimatedBar({ pct, color, delay = 0 }) {
    const [w, setW] = useState(0);
    useEffect(() => {
        const t = setTimeout(() => setW(Math.min(pct, 100)), 80 + delay);
        return () => clearTimeout(t);
    }, [pct, delay]);
    return <div style={{ height: '100%', width: `${w}%`, background: color, transition: 'width 900ms ease', borderRadius: 4, flexShrink: 0 }} />;
}

export default function AttemptResult() {
    const { attemptUuid } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const resultData = location.state?.resultData;
    const autoSubmitted = location.state?.autoSubmitted ?? false;
    const [bannerVisible, setBannerVisible] = useState(autoSubmitted);
    const [iconReady, setIconReady] = useState(false);

    const { data: response, isLoading, isError } = useQuery({
        queryKey: ['attempt-result', attemptUuid],
        queryFn: () => getAttemptResult(attemptUuid),
        enabled: !resultData,
        staleTime: 300_000,
    });

    const result = resultData ?? response?.data;

    useEffect(() => {
        const t = setTimeout(() => setIconReady(true), 100);
        return () => clearTimeout(t);
    }, []);

    if (isLoading && !result) {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--color-bg-page)', padding: '32px 16px' }}>
                <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
                <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <Shimmer h={280} rounded={20} />
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                        {[...Array(6)].map((_, i) => <Shimmer key={i} h={100} rounded={14} />)}
                    </div>
                    <Shimmer h={160} rounded={16} />
                    <Shimmer h={100} rounded={16} />
                </div>
            </div>
        );
    }

    if (isError && !result) {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--color-bg-page)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--color-danger-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <AlertCircle size={32} style={{ color: 'var(--color-danger)' }} />
                    </div>
                    <h2 style={{ fontSize: 20, fontWeight: 700 }}>Failed to load result</h2>
                    <Button onClick={() => navigate('/student/quizzes')}>Back to Quizzes</Button>
                </div>
            </div>
        );
    }

    const isPassed = result?.isPassed;
    const pct = result?.percentage ?? 0;
    const totalQ = (result?.correctCount ?? 0) + (result?.wrongCount ?? 0) + (result?.skippedCount ?? 0);
    const scoreColor = pct >= 70 ? 'var(--color-success)' : pct >= 50 ? 'var(--color-warning)' : 'var(--color-danger)';
    const passLinePct = result?.passMarks && result?.totalMarksPossible
        ? (result.passMarks / result.totalMarksPossible) * 100 : null;

    const stats = [
        { icon: <CheckCircle2 size={20} />, iconBg: 'var(--color-success-soft)', iconColor: 'var(--color-success)', value: result?.correctCount ?? 0, label: 'Correct answers', vc: 'var(--color-success)' },
        { icon: <XCircle size={20} />, iconBg: 'var(--color-danger-soft)', iconColor: 'var(--color-danger)', value: result?.wrongCount ?? 0, label: 'Wrong answers', vc: 'var(--color-danger)' },
        { icon: <SkipForward size={20} />, iconBg: 'var(--color-warning-soft)', iconColor: 'var(--color-warning)', value: result?.skippedCount ?? 0, label: 'Skipped', vc: 'var(--color-warning)' },
        { icon: <Plus size={20} />, iconBg: 'var(--color-success-soft)', iconColor: 'var(--color-success)', value: `+${result?.positiveMarks ?? 0}`, label: 'Marks earned', vc: 'var(--color-success)' },
        { icon: <Minus size={20} />, iconBg: 'var(--color-danger-soft)', iconColor: 'var(--color-danger)', value: `-${result?.negativeMarksDeducted ?? 0}`, label: 'Marks deducted', vc: 'var(--color-danger)' },
        { icon: <Clock size={20} />, iconBg: 'var(--color-primary-soft)', iconColor: 'var(--color-primary)', value: formatDuration(result?.timeTakenSeconds) || '—', label: 'Time taken', vc: 'var(--color-primary)' },
    ];

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg-page)', paddingBottom: 48 }}>
            <style>{`
                @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
                @keyframes popIn{0%{opacity:0;transform:scale(0.3)}70%{transform:scale(1.1)}100%{opacity:1;transform:scale(1)}}
                @keyframes wobble{0%,100%{transform:rotate(0)}20%{transform:rotate(-8deg)}40%{transform:rotate(8deg)}60%{transform:rotate(-4deg)}80%{transform:rotate(3deg)}}
                @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
            `}</style>

            {/* Auto-submitted banner */}
            {bannerVisible && (
                <div style={{ background: 'var(--color-warning-soft)', borderBottom: '1px solid var(--color-warning)', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Clock size={18} style={{ color: 'var(--color-warning)', flexShrink: 0 }} />
                    <span style={{ fontSize: 14, color: 'var(--color-warning)', flex: 1 }}>
                        ⏱️ Your quiz was automatically submitted because the time limit was reached.
                    </span>
                    <button onClick={() => setBannerVisible(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-warning)', display: 'flex', alignItems: 'center', padding: 4 }}>
                        <X size={16} />
                    </button>
                </div>
            )}

            <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* ── Hero Card ── */}
                <div style={{ background: 'var(--color-bg-card)', borderRadius: 24, border: '3px solid var(--color-border)', boxShadow: '6px 6px 0 var(--color-border)', padding: 'clamp(28px,5vw,48px) clamp(20px,5vw,40px)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: -50, right: -50, width: 180, height: 180, borderRadius: '50%', background: isPassed ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.05)', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', bottom: -40, left: -40, width: 140, height: 140, borderRadius: '50%', background: isPassed ? 'rgba(16,185,129,0.04)' : 'rgba(239,68,68,0.03)', pointerEvents: 'none' }} />

                    <div style={{ display: 'inline-flex', marginBottom: 24, animation: iconReady ? (isPassed ? 'popIn 0.6s cubic-bezier(0.34,1.56,0.64,1)' : 'wobble 0.7s ease, fadeUp 0.4s ease') : 'none', opacity: iconReady ? 1 : 0 }}>
                        <div style={{ width: 88, height: 88, borderRadius: '50%', background: isPassed ? 'var(--color-success-soft)' : 'var(--color-danger-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 0 14px ${isPassed ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.08)'}` }}>
                            {isPassed ? <Trophy size={42} style={{ color: 'var(--color-success)' }} /> : <BookOpen size={42} style={{ color: 'var(--color-danger)' }} />}
                        </div>
                    </div>

                    <h1 style={{ fontSize: 'clamp(20px,4vw,28px)', fontWeight: 800, color: isPassed ? 'var(--color-success)' : 'var(--color-text-primary)', marginBottom: 6 }}>
                        {isPassed ? 'Congratulations! 🎉' : 'Keep Trying! 💪'}
                    </h1>
                    <p style={{ fontSize: 15, color: isPassed ? 'var(--color-success)' : 'var(--color-text-secondary)', fontWeight: 500, marginBottom: 28 }}>
                        {isPassed ? 'You passed the quiz!' : "You didn't pass this time."}
                    </p>

                    <div style={{ fontSize: 'clamp(52px,12vw,80px)', fontWeight: 900, lineHeight: 1, color: scoreColor, letterSpacing: '-2px', marginBottom: 8 }}>
                        <CountUp target={pct} duration={1500} />%
                    </div>
                    <div style={{ fontSize: 16, color: 'var(--color-text-secondary)', fontWeight: 500, marginBottom: 4 }}>
                        {formatScore(result?.marksObtained, result?.totalMarksPossible)} marks
                    </div>
                    {result?.passMarks != null && (
                        <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                            Pass mark: <strong style={{ color: 'var(--color-text-primary)' }}>{result.passMarks}</strong>
                        </div>
                    )}
                </div>

                {/* ── Stats Grid ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                    {stats.map((s, i) => (
                        <div key={i} style={{ animation: `fadeUp 0.4s ease ${i * 70}ms both`, background: 'var(--color-bg-card)', borderRadius: 16, border: '3px solid var(--color-border)', boxShadow: '4px 4px 0 var(--color-border)', padding: '16px 14px' }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: s.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.iconColor, marginBottom: 10 }}>
                                {s.icon}
                            </div>
                            <div style={{ fontSize: 22, fontWeight: 800, color: s.vc, lineHeight: 1, marginBottom: 4 }}>{s.value}</div>
                            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 500 }}>{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* ── Performance Bars ── */}
                <div style={{ background: 'var(--color-bg-card)', borderRadius: 18, border: '3px solid var(--color-border)', boxShadow: '5px 5px 0 var(--color-border)', padding: '24px' }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 24 }}>Performance Overview</h3>

                    <div style={{ marginBottom: 28 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>Answer Breakdown</span>
                            <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{totalQ} total</span>
                        </div>
                        <div style={{ height: 16, background: 'var(--color-bg-muted)', borderRadius: 8, overflow: 'hidden', display: 'flex', gap: 2 }}>
                            {totalQ > 0 && <>
                                <AnimatedBar pct={(result?.correctCount ?? 0) / totalQ * 100} color="var(--color-success)" delay={0} />
                                <AnimatedBar pct={(result?.wrongCount ?? 0) / totalQ * 100} color="var(--color-danger)" delay={120} />
                                <AnimatedBar pct={(result?.skippedCount ?? 0) / totalQ * 100} color="var(--color-border-muted)" delay={240} />
                            </>}
                        </div>
                        <div style={{ display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap' }}>
                            {[
                                { color: 'var(--color-success)', label: `Correct (${result?.correctCount ?? 0})` },
                                { color: 'var(--color-danger)', label: `Wrong (${result?.wrongCount ?? 0})` },
                                { color: 'var(--color-border-muted)', label: `Skipped (${result?.skippedCount ?? 0})` },
                            ].map(({ color, label }) => (
                                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--color-text-secondary)' }}>
                                    <div style={{ width: 10, height: 10, borderRadius: 3, background: color, flexShrink: 0 }} />
                                    {label}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>Your Score vs Pass Mark</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: scoreColor }}>{pct.toFixed(1)}%</span>
                        </div>
                        <div style={{ height: 16, background: 'var(--color-bg-muted)', borderRadius: 8, overflow: 'visible', position: 'relative' }}>
                            <div style={{ height: '100%', borderRadius: 8, overflow: 'hidden' }}>
                                <AnimatedBar pct={pct} color={scoreColor} delay={0} />
                            </div>
                            {passLinePct != null && (
                                <div style={{ position: 'absolute', top: -8, bottom: -8, left: `${Math.min(passLinePct, 99)}%`, width: 2, background: 'var(--color-danger)', borderRadius: 1, pointerEvents: 'none' }}>
                                    <div style={{ position: 'absolute', bottom: '100%', marginBottom: 4, left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap', fontSize: 10, color: 'var(--color-danger)', fontWeight: 700, background: 'var(--color-bg-card)', padding: '2px 5px', borderRadius: 4, border: '1px solid var(--color-danger)' }}>
                                        Pass {passLinePct.toFixed(0)}%
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Attempt Info ── */}
                <div style={{ background: 'var(--color-bg-card)', borderRadius: 18, border: '3px solid var(--color-border)', boxShadow: '5px 5px 0 var(--color-border)', padding: '20px 24px' }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Attempt Details</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14 }}>
                        {[
                            { label: 'Quiz', value: result?.quizTitle || '—' },
                            { label: 'Attempt #', value: result?.attemptNumber ? `#${result.attemptNumber}` : '—' },
                            { label: 'Submitted', value: formatDateTime(result?.submittedAt) || '—' },
                            { label: 'Status', value: <Badge variant={getStatusColor(result?.status)}>{result?.status}</Badge> },
                            { label: 'Rank', value: result?.rank ? `#${result.rank} overall` : '—' },
                        ].map(({ label, value }) => (
                            <div key={label}>
                                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>{label}</div>
                                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>{value}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Action Buttons ── */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', paddingTop: 4 }}>
                    <Button variant="primary" icon={<List size={15} />} onClick={() => navigate(`/student/results/${attemptUuid}/review`)}>
                        Review Answers
                    </Button>
                    {!isPassed && result?.status !== 'MAX_ATTEMPTS_REACHED' && (
                        <Button variant="outline" icon={<RotateCcw size={15} />} onClick={() => navigate(`/student/quizzes/${result?.quizUuid}`)}>
                            Try Again
                        </Button>
                    )}
                    <Button variant="outline" icon={<ArrowRight size={15} />} onClick={() => navigate('/student/quizzes')}>
                        View All Quizzes
                    </Button>
                    <Button variant="ghost" icon={<ChevronRight size={15} />} onClick={() => navigate('/student/history')}>
                        My History
                    </Button>
                </div>

            </div>
        </div>
    );
}
