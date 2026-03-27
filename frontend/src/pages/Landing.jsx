import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BookOpen,
    ArrowRight,
    CheckCircle2,
    Download,
    HelpCircle,
    Bookmark,
    MessageSquare,
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import Button from '../components/common/Button';
import { SparkleIcon, Squiggle, FloatingBadge } from '../components/common/Decorations';

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
const quizKinds = [
    {
        icon: HelpCircle,
        title: 'Multiple Choice',
        desc: 'Classic MCQs with smart scoring and randomized options.',
        color: 'bg-[var(--color-primary)]',
        tileBg: 'bg-[var(--color-block-blue)]',
        tileText: 'text-[var(--color-info)]',
    },
    {
        icon: Bookmark,
        title: 'Fill in the Blank',
        desc: 'Short answers with auto-checking and flexible grading.',
        color: 'bg-[var(--color-success)]',
        tileBg: 'bg-[var(--color-block-green)]',
        tileText: 'text-[var(--color-success)]',
    },
    {
        icon: MessageSquare,
        title: 'Matching',
        desc: 'Pair items quickly with clean drag-and-drop UX.',
        color: 'bg-[var(--color-warning)]',
        tileBg: 'bg-[var(--color-block-amber)]',
        tileText: 'text-[var(--color-warning)]',
    },
    {
        icon: BookOpen,
        title: 'True/False',
        desc: 'Fast checks for core concepts and knowledge recall.',
        color: 'bg-[var(--color-accent-purple)]',
        tileBg: 'bg-[var(--color-block-purple)]',
        tileText: 'text-[var(--color-accent-purple)]',
    },
];

const pricingPlans = [
    {
        name: 'Regular',
        price: '$0',
        badge: 'Trial',
        badgeClass: 'bg-[var(--color-success-soft)] text-[var(--color-success)]',
        features: ['Unlimited quizzes', 'Basic analytics', 'Community support'],
    },
    {
        name: 'Premium',
        price: '$19',
        features: ['Advanced analytics', 'Anti-cheat suite', 'Priority support'],
    },
    {
        name: 'Business',
        price: '$49',
        features: ['Team workspaces', 'Custom branding', 'Dedicated success'],
    },
];

const faqTabs = ['General', 'Quizzes', 'Templates', 'Account'];
const faqItems = [
    {
        question: 'How fast can I build a quiz?',
        answer: 'Most quizzes take under 10 minutes using templates and smart question helpers.',
    },
    {
        question: 'Can I share quizzes with a class code?',
        answer: 'Yes. Generate access codes and control attempts, timing, and retakes.',
    },
    {
        question: 'Do you support auto-grading?',
        answer: 'Auto-grading is available for MCQ, true/false, and fill-in-the-blank types.',
    },
];

/* ───────── component ───────── */
export default function Landing() {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuthStore();
    const [scrolled, setScrolled] = useState(false);
    const [activeFaqTab, setActiveFaqTab] = useState(faqTabs[0]);
    const [openFaq, setOpenFaq] = useState(0);

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
        <div className="min-h-screen bg-[var(--color-bg-page)] text-[var(--color-text-primary)]">
            {/* ─── NAVBAR ─── */}
            <nav
                className={`fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-5 lg:px-10 transition-all duration-300 ${scrolled ? 'bg-[color:var(--color-bg-card)]/90 backdrop-blur-lg border-b-2 border-[var(--color-border)]' : 'bg-transparent'
                    }`}
            >
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[var(--color-primary)] border-2 border-[var(--color-border)] flex items-center justify-center shadow-[2px_2px_0_var(--color-border)]">
                        <BookOpen size={18} className="text-[var(--color-text-inverse)]" />
                    </div>
                    <span className="text-lg font-extrabold tracking-tight">
                        QuizMaster
                    </span>
                </div>
                <div className="hidden md:flex items-center gap-6 text-sm font-medium text-[var(--color-text-primary)]">
                    {['Pricing', 'FAQ', 'Support', 'Contacts'].map((item) => (
                        <a key={item} href="#" className="hover:text-[var(--color-primary)] transition-colors">
                            {item}
                        </a>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                        Download <Download size={14} />
                    </Button>
                    <Button size="sm" onClick={() => navigate('/register')}>
                        Get Started
                    </Button>
                </div>
            </nav>

            {/* ─── HERO ─── */}
            <section className="relative pt-28 pb-20 px-5">
                <div className="max-w-6xl mx-auto grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
                    <div>
                        <Reveal>
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight">
                                Best <span className="bg-[var(--color-primary)] text-[var(--color-text-inverse)] px-3 py-1 rounded-lg">AI Platform</span>
                                <br /> To Convert Documents To Quiz Instantly
                            </h1>
                        </Reveal>
                        <Reveal delay={120}>
                            <p className="text-lg text-[var(--color-text-secondary)] mt-6 max-w-xl">
                                Build interactive quizzes in minutes with smart templates, instant grading, and
                                playful student experiences.
                            </p>
                        </Reveal>
                        <Reveal delay={200}>
                            <div className="flex flex-wrap items-center gap-3 mt-8">
                                <Button size="lg" onClick={() => navigate('/register')}>
                                    Get Started <ArrowRight size={16} />
                                </Button>
                                <Button variant="outline" size="lg" onClick={scrollToFeatures}>
                                    Download <Download size={16} />
                                </Button>
                            </div>
                        </Reveal>
                        <Reveal delay={260}>
                            <div className="mt-6 text-sm text-[var(--color-text-muted)] flex items-center gap-2">
                                <span className="inline-flex w-2.5 h-2.5 rounded-full bg-[var(--color-success)]" />
                                Have any question?
                            </div>
                        </Reveal>
                    </div>

                    <div className="relative">
                        <SparkleIcon className="absolute -top-6 -left-6" />
                        <SparkleIcon className="absolute -bottom-6 -right-6" color="var(--color-primary)" />
                        <div className="relative bg-[var(--color-bg-card)] border-2 border-[var(--color-border)] rounded-[24px] shadow-[6px_6px_0_var(--color-border)] p-6">
                            <div className="h-64 rounded-[18px] bg-gradient-to-br from-[var(--color-primary-grad-1)] via-[var(--color-primary-grad-2)] to-[var(--color-primary-grad-3)] border-2 border-[var(--color-border)]" />
                            <span className="absolute -left-6 top-16 rotate-[-12deg] text-xs font-bold text-[var(--color-text-primary)] bg-[var(--color-bg-card)] border-2 border-[var(--color-border)] px-2 py-1 rounded-full shadow-[2px_2px_0_var(--color-border)]">
                                QuizMaster
                            </span>
                            <span className="absolute -right-6 bottom-16 rotate-[12deg] text-xs font-bold text-[var(--color-text-primary)] bg-[var(--color-bg-card)] border-2 border-[var(--color-border)] px-2 py-1 rounded-full shadow-[2px_2px_0_var(--color-border)]">
                                QuizMaster
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── KIND OF QUIZZES ─── */}
            <section id="features" className="py-16 px-5">
                <div className="max-w-6xl mx-auto">
                    <Reveal className="text-center mb-12">
                        <div className="inline-flex items-center gap-2">
                            <h2 className="text-3xl sm:text-4xl font-extrabold">Kind of Quizzes</h2>
                            <span className="text-2xl">〰️</span>
                        </div>
                    </Reveal>
                    <div className="grid sm:grid-cols-2 gap-6">
                        {quizKinds.map((item, i) => {
                            const Icon = item.icon;
                            return (
                                <Reveal key={item.title} delay={i * 80}>
                                    <div className={`border-2 border-[var(--color-border)] rounded-[22px] p-7 min-h-[220px] flex flex-col justify-between transition-all duration-150 ${item.tileBg}`}>
                                        <div className="flex items-center justify-between">
                                            <div className={`w-12 h-12 ${item.color} rounded-xl flex items-center justify-center text-[var(--color-text-inverse)] border-2 border-[var(--color-border)] shadow-[2px_2px_0_var(--color-border)]`}>
                                            <Icon size={20} />
                                            </div>
                                            <span className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wide">
                                                {String(i + 1).padStart(2, '0')}
                                            </span>
                                        </div>
                                        <div className="mt-6">
                                            <h3 className={`text-2xl sm:text-3xl font-extrabold leading-tight ${item.tileText}`}>{item.title}</h3>
                                            <p className="text-sm text-[var(--color-text-secondary)] mt-3">{item.desc}</p>
                                        </div>
                                    </div>
                                </Reveal>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ─── WE HELP YOU ─── */}
            <section className="py-16 px-5">
                <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 items-center">
                    <div className="relative">
                        <SparkleIcon className="absolute -top-4 -left-4" />
                        <div className="bg-[var(--color-bg-card)] border-2 border-[var(--color-border)] rounded-[24px] shadow-[6px_6px_0_var(--color-border)] p-6">
                            <div className="h-64 rounded-[18px] bg-gradient-to-br from-[var(--color-primary-grad-1)] to-[var(--color-primary-grad-3)] border-2 border-[var(--color-border)]" />
                            <FloatingBadge className="absolute top-4 right-4" text="Free+" />
                        </div>
                    </div>
                    <div>
                        <Reveal>
                            <h2 className="text-3xl sm:text-4xl font-extrabold">
                                We help you build quizzes that students actually love.
                            </h2>
                        </Reveal>
                        <Reveal delay={120}>
                            <p className="text-[var(--color-text-secondary)] mt-4">
                                Create, assign, and analyze with friendly visuals and powerful automation.
                            </p>
                        </Reveal>
                        <Reveal delay={200}>
                            <Button size="lg" className="mt-6" onClick={() => navigate('/register')}>
                                Get Started <ArrowRight size={16} />
                            </Button>
                        </Reveal>
                    </div>
                </div>
            </section>

            {/* ─── BEST TOOL ─── */}
            <section className="py-16 px-5">
                <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 items-center">
                    <div>
                        <Reveal>
                            <div className="mb-4">
                                <Squiggle />
                            </div>
                            <h2 className="text-3xl sm:text-4xl font-extrabold">We suggest you best tool to make Quiz</h2>
                        </Reveal>
                        <Reveal delay={120}>
                            <p className="text-[var(--color-text-secondary)] mt-4">
                                From idea to launch in minutes. Built-in grading, analytics, and sharing.
                            </p>
                        </Reveal>
                        <Reveal delay={200}>
                            <Button size="lg" className="mt-6" onClick={() => navigate('/register')}>
                                Get Started <ArrowRight size={16} />
                            </Button>
                        </Reveal>
                    </div>
                    <div className="relative">
                        <SparkleIcon className="absolute -top-5 -right-5" color="var(--color-accent-yellow)" />
                        <div className="bg-[var(--color-bg-card)] border-2 border-[var(--color-border)] rounded-[24px] shadow-[6px_6px_0_var(--color-border)] p-6">
                            <div className="h-64 rounded-[18px] bg-gradient-to-br from-[var(--color-warm-grad-1)] via-[var(--color-warm-grad-2)] to-[var(--color-warm-grad-3)] border-2 border-[var(--color-border)]" />
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── PRICING ─── */}
            <section className="py-16 px-5">
                <div className="max-w-6xl mx-auto">
                    <Reveal className="text-center mb-12">
                        <div className="inline-flex items-center gap-3">
                            <h2 className="text-3xl sm:text-4xl font-extrabold">Pricing</h2>
                            <span className="text-2xl">〰️</span>
                        </div>
                    </Reveal>
                    <div className="grid md:grid-cols-3 gap-6">
                        {pricingPlans.map((plan, i) => (
                            <Reveal key={plan.name} delay={i * 100}>
                                <div className="bg-[var(--color-bg-card)] border-2 border-[var(--color-border)] rounded-[22px] shadow-[5px_5px_0_var(--color-border)] p-6 flex flex-col h-full">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xl font-extrabold">{plan.name}</h3>
                                        {plan.badge && (
                                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${plan.badgeClass}`}>
                                                {plan.badge}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-3xl font-extrabold mt-4">
                                        {plan.price}
                                        <span className="text-sm text-[var(--color-text-muted)]">/mo</span>
                                    </div>
                                    <div className="mt-6 space-y-3">
                                        {plan.features.map((item) => (
                                            <div key={item} className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                                                <CheckCircle2 size={16} className="text-[var(--color-primary)]" />
                                                {item}
                                            </div>
                                        ))}
                                    </div>
                                    <Button fullWidth className="mt-6">Get Started</Button>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── FAQ ─── */}
            <section className="py-16 px-5">
                <div className="max-w-6xl mx-auto">
                    <div className="bg-[var(--color-bg-card)] border-2 border-[var(--color-border)] rounded-[24px] shadow-[6px_6px_0_var(--color-border)] p-8 relative overflow-hidden">
                        <div className="text-center">
                            <h2 className="text-3xl sm:text-4xl font-extrabold">Frequently asked questions</h2>
                        </div>
                        <div className="flex flex-wrap justify-center gap-2 mt-6">
                            {faqTabs.map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveFaqTab(tab)}
                                    className={`px-4 py-2 rounded-full text-sm font-semibold border-2 border-[var(--color-border)] shadow-[2px_2px_0_var(--color-border)] transition-all ${activeFaqTab === tab
                                            ? 'bg-[var(--color-primary)] text-[var(--color-text-inverse)]'
                                            : 'bg-[var(--color-bg-card)] text-[var(--color-text-primary)] hover:bg-[var(--color-primary-soft)]'
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                        <div className="mt-8 space-y-4">
                            {faqItems.map((item, index) => {
                                const open = openFaq === index;
                                return (
                                    <div
                                        key={item.question}
                                        className="border-2 border-[var(--color-border)] rounded-[18px] p-5 bg-[var(--color-bg-card)] shadow-[3px_3px_0_var(--color-border)]"
                                    >
                                        <button
                                            className="w-full flex items-center justify-between text-left"
                                            onClick={() => setOpenFaq(open ? null : index)}
                                        >
                                            <div className="flex items-center gap-4">
                                                <span className={`text-lg font-extrabold ${open ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-primary)]'}`}>
                                                    0{index + 1}
                                                </span>
                                                <span className="font-semibold text-[var(--color-text-primary)]">{item.question}</span>
                                            </div>
                                            <span className="text-[var(--color-text-primary)] text-lg">{open ? '−' : '+'}</span>
                                        </button>
                                        {open && (
                                            <p className="mt-3 text-sm text-[var(--color-text-secondary)] max-w-2xl">
                                                {item.answer}
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <div className="absolute -top-6 -right-6">
                            <SparkleIcon color="var(--color-accent-yellow)" />
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── CTA ─── */}
            <section className="py-16 px-5">
                <div className="max-w-6xl mx-auto">
                    <div className="relative bg-[var(--color-block-black)] text-[var(--color-text-inverse)] rounded-[26px] border-2 border-[var(--color-border)] shadow-[6px_6px_0_var(--color-border)] px-6 py-12 text-center">
                        <SparkleIcon className="absolute -top-4 -left-4" color="var(--color-accent-yellow)" />
                        <SparkleIcon className="absolute -bottom-4 -right-4" color="var(--color-accent-yellow)" />
                        <h2 className="text-3xl sm:text-4xl font-extrabold">Lets Make First Quiz</h2>
                        <p className="text-[color:var(--color-text-inverse)]/90 mt-3">Generate a quiz instantly from your notes.</p>
                        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                            <input
                                placeholder="Paste a topic or document link"
                                className="w-full sm:w-96 h-12 px-4 rounded-full text-[var(--color-text-primary)] border-2 border-[var(--color-border)] focus:outline-none bg-[var(--color-block-white)]"
                            />
                            <Button variant="secondary">Generate</Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── FOOTER ─── */}
            <footer className="bg-[var(--color-bg-subtle)] border-t-2 border-[var(--color-border)] px-5 py-10">
                <div className="max-w-6xl mx-auto grid md:grid-cols-[1.2fr_1fr_1fr_1fr] gap-8 text-sm text-[var(--color-text-secondary)]">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-xl bg-[var(--color-primary)] border-2 border-[var(--color-border)] flex items-center justify-center shadow-[2px_2px_0_var(--color-border)]">
                                <BookOpen size={14} className="text-[var(--color-text-inverse)]" />
                            </div>
                            <span className="font-extrabold text-[var(--color-text-primary)]">QuizMaster</span>
                        </div>
                        <p>Build quizzes that feel fun, fast, and beautifully brutalist.</p>
                    </div>
                    <div>
                        <h4 className="font-extrabold text-[var(--color-text-primary)] mb-3">Product</h4>
                        <div className="space-y-2">
                            <a href="#">Features</a>
                            <a href="#">Pricing</a>
                            <a href="#">Templates</a>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-extrabold text-[var(--color-text-primary)] mb-3">Company</h4>
                        <div className="space-y-2">
                            <a href="#">About</a>
                            <a href="#">Support</a>
                            <a href="#">Contact</a>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-extrabold text-[var(--color-text-primary)] mb-3">JOIN OUR COMMUNITY</h4>
                        <div className="flex items-center gap-2">
                            <input
                                placeholder="Email address"
                                className="flex-1 h-11 px-3 rounded-full border-2 border-[var(--color-border)] bg-[var(--color-bg-card)]"
                            />
                            <Button size="sm">Join</Button>
                        </div>
                    </div>
                </div>
                <div className="text-center text-xs text-[var(--color-text-muted)] mt-8">
                    © 2026 QuizMaster Pro. All rights reserved.
                </div>
            </footer>
        </div>
    );
}
