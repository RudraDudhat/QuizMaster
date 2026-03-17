import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ArrowRight, CheckCircle2 } from 'lucide-react';
import useAuthStore from '../store/authStore';
import Button from '../components/common/Button';

/* ───────── scroll-reveal hook ───────── */
function useReveal() {
    const ref = useRef(null);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    el.classList.add('revealed');
                    obs.unobserve(el);
                }
            },
            { threshold: 0.15 }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, []);
    return ref;
}

function Reveal({ children, delay = 0, className = '' }) {
    const ref = useReveal();
    return (
        <div
            ref={ref}
            className={`opacity-0 translate-y-6 transition-all duration-500 ease-out [&.revealed]:opacity-100 [&.revealed]:translate-y-0 ${className}`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
}

/* ───────── data ───────── */
const stats = [
    { value: '10,000+', label: 'Quizzes Created' },
    { value: '50,000+', label: 'Students' },
    { value: '99.9%', label: 'Uptime' },
    { value: '10', label: 'Question Types' },
];

const features = [
    { icon: '⏱️', title: 'Smart Timer', desc: 'Set time limits per quiz or per question. Auto-submits when time runs out.' },
    { icon: '📊', title: 'Deep Analytics', desc: 'Score distributions, per-question accuracy, drop-off analysis, and student performance.' },
    { icon: '🔒', title: 'Anti-Cheat System', desc: 'Tab switch detection, fullscreen enforcement, and suspicious activity flagging.' },
    { icon: '🎮', title: 'Gamification', desc: 'XP points, streaks, badges, and leaderboards to keep students motivated.' },
    { icon: '📝', title: '10 Question Types', desc: 'MCQ, True/False, Essay, Code Snippet, Image-based, Ordering, Matching and more.' },
    { icon: '👥', title: 'Student Groups', desc: 'Organize students into classes and assign quizzes to specific groups.' },
];

const steps = [
    { num: '1', icon: '🏗️', title: 'Create', desc: 'Build your quiz with our intuitive editor. Add questions, set a timer, and configure rules.' },
    { num: '2', icon: '🚀', title: 'Publish', desc: 'Share with students or assign to a specific group. Set access codes if needed.' },
    { num: '3', icon: '📈', title: 'Analyze', desc: 'Track results in real time. See who passed, which questions were hardest, and more.' },
];

/* ───────── component ───────── */
export default function Landing() {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuthStore();
    const [scrolled, setScrolled] = useState(false);

    /* redirect if already logged in */
    useEffect(() => {
        if (isAuthenticated) {
            const r = user?.role;
            if (r === 'ADMIN' || r === 'SUPER_ADMIN') navigate('/admin/dashboard', { replace: true });
            else if (r === 'STUDENT') navigate('/student/dashboard', { replace: true });
        }
    }, [isAuthenticated, user, navigate]);

    /* navbar shadow on scroll */
    useEffect(() => {
        const handler = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handler, { passive: true });
        return () => window.removeEventListener('scroll', handler);
    }, []);

    const scrollToFeatures = () =>
        document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });

    return (
        <div className="min-h-screen bg-white text-gray-900">
            {/* ─── NAVBAR ─── */}
            <nav
                className={`fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-5 lg:px-10 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-lg shadow-md border-b border-gray-100' : 'bg-transparent'
                    }`}
            >
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                        <BookOpen size={20} className="text-white" />
                    </div>
                    <span className="text-lg font-bold tracking-tight">
                        QuizMaster <span className="text-primary">Pro</span>
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" onClick={() => navigate('/login')}>
                        Login
                    </Button>
                    <Button size="sm" onClick={() => navigate('/register')}>
                        Get Started
                    </Button>
                </div>
            </nav>

            {/* ─── HERO ─── */}
            <section
                className="relative min-h-screen flex items-center justify-center px-5 pt-16"
                style={{
                    backgroundImage: 'radial-gradient(circle, #00000010 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                }}
            >
                <div className="max-w-3xl mx-auto text-center">
                    <Reveal>
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gray-200 bg-white text-sm font-medium text-gray-600 shadow-sm mb-6">
                            🎯 The Ultimate Quiz Platform
                        </span>
                    </Reveal>

                    <Reveal delay={80}>
                        <h1
                            className="font-extrabold tracking-tight leading-[1.1] text-gray-900 mb-6"
                            style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
                        >
                            Create Quizzes. <br className="hidden sm:block" />
                            Challenge Students. <br className="hidden sm:block" />
                            <span className="text-primary">Track Progress.</span>
                        </h1>
                    </Reveal>

                    <Reveal delay={160}>
                        <p className="text-lg text-gray-500 leading-relaxed max-w-xl mx-auto mb-8">
                            A powerful platform for educators to build engaging quizzes with real-time analytics,
                            auto-grading, anti-cheat, and instant feedback.
                        </p>
                    </Reveal>

                    <Reveal delay={240}>
                        <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
                            <Button size="lg" onClick={() => navigate('/register')} icon={<ArrowRight size={18} />}>
                                Start for Free
                            </Button>
                            <Button variant="outline" size="lg" onClick={scrollToFeatures}>
                                See How It Works
                            </Button>
                        </div>
                    </Reveal>

                    <Reveal delay={320}>
                        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-400">
                            {['No credit card required', 'Free to use', 'Setup in minutes'].map((t) => (
                                <span key={t} className="flex items-center gap-1.5">
                                    <CheckCircle2 size={14} className="text-emerald-500" /> {t}
                                </span>
                            ))}
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* ─── STATS BAR ─── */}
            <Reveal className="bg-gray-50 border-y border-gray-100">
                <div className="max-w-5xl mx-auto grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
                    {stats.map((s) => (
                        <div key={s.label} className="flex flex-col items-center py-8 px-4">
                            <span className="text-3xl font-extrabold text-gray-900">{s.value}</span>
                            <span className="text-sm text-gray-500 mt-1">{s.label}</span>
                        </div>
                    ))}
                </div>
            </Reveal>

            {/* ─── FEATURES ─── */}
            <section id="features" className="py-20 lg:py-28 px-5">
                <div className="max-w-6xl mx-auto">
                    <Reveal className="text-center mb-14">
                        <h2 className="text-3xl lg:text-4xl font-bold mb-3">
                            Everything You Need to Run Great Quizzes
                        </h2>
                        <p className="text-gray-500 text-lg">Built for educators, loved by students.</p>
                    </Reveal>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((f, i) => (
                            <Reveal key={f.title} delay={i * 60}>
                                <div className="group p-6 rounded-2xl border border-gray-200 bg-white hover:-translate-y-1 hover:shadow-lg transition-all duration-300 h-full">
                                    <span className="text-3xl block mb-4">{f.icon}</span>
                                    <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                                    <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── HOW IT WORKS ─── */}
            <section className="py-20 lg:py-28 px-5 bg-gray-50">
                <div className="max-w-5xl mx-auto">
                    <Reveal className="text-center mb-14">
                        <h2 className="text-3xl lg:text-4xl font-bold">How It Works</h2>
                    </Reveal>

                    <div className="relative grid md:grid-cols-3 gap-10 md:gap-6">
                        {/* connecting line (desktop only) */}
                        <div className="hidden md:block absolute top-12 left-[20%] right-[20%] border-t-2 border-dashed border-gray-300" />

                        {steps.map((s, i) => (
                            <Reveal key={s.num} delay={i * 100} className="relative text-center">
                                <div className="relative z-10 inline-flex items-center justify-center w-24 h-24 rounded-full bg-white border-2 border-gray-200 shadow-sm mb-5">
                                    <span className="text-3xl">{s.icon}</span>
                                    <span className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shadow">
                                        {s.num}
                                    </span>
                                </div>
                                <h3 className="text-xl font-semibold mb-2">{s.title}</h3>
                                <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">{s.desc}</p>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── ROLE SPLIT CTA ─── */}
            <section className="py-20 lg:py-28 px-5">
                <div className="max-w-5xl mx-auto">
                    <Reveal className="text-center mb-12">
                        <h2 className="text-3xl lg:text-4xl font-bold">Get Started Today</h2>
                    </Reveal>

                    <div className="grid md:grid-cols-2 gap-6">
                        {[
                            {
                                icon: '🧑‍🏫',
                                title: "I'm an Educator",
                                desc: 'Create and manage quizzes, track student progress, and get deep analytics on your class.',
                                cta: 'Create Your First Quiz',
                            },
                            {
                                icon: '🎓',
                                title: "I'm a Student",
                                desc: 'Take quizzes assigned by your teacher, review your answers, and track your growth.',
                                cta: 'Join & Start Learning',
                            },
                        ].map((role, i) => (
                            <Reveal key={role.title} delay={i * 100}>
                                <div className="group p-8 rounded-2xl border border-gray-200 bg-white hover:shadow-lg transition-all duration-300 text-center h-full flex flex-col items-center">
                                    <span className="text-5xl mb-5">{role.icon}</span>
                                    <h3 className="text-xl font-semibold mb-3">{role.title}</h3>
                                    <p className="text-sm text-gray-500 leading-relaxed mb-6 max-w-sm">{role.desc}</p>
                                    <Button fullWidth onClick={() => navigate('/register')} className="mt-auto">
                                        {role.cta}
                                    </Button>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── FOOTER ─── */}
            <footer className="border-t border-gray-200 py-8 px-5">
                <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
                    <span>&copy; 2026 QuizMaster Pro. All rights reserved.</span>
                    <div className="flex items-center gap-4">
                        <a href="#" className="hover:text-gray-600 transition-colors">Privacy Policy</a>
                        <span className="text-gray-300">|</span>
                        <a href="#" className="hover:text-gray-600 transition-colors">Terms of Service</a>
                        <span className="text-gray-300">|</span>
                        <a href="#" className="hover:text-gray-600 transition-colors">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
