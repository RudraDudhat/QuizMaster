import { ReactLenis } from 'lenis/react';
import { useEffect, useState } from 'react';

/**
 * Wraps the app in Lenis-powered smooth scroll.
 *
 * Notes:
 *  - Respects `prefers-reduced-motion` — for those users we render children
 *    plain, no Lenis at all (the dependency is loaded either way).
 *  - The quiz-taking page uses internal scroll containers (the question
 *    pane / navigator panel), so the page-level smooth scroll doesn't
 *    interfere with timer-sensitive flows. Modals use `position: fixed`
 *    and are likewise unaffected.
 *  - Lenis is opt-in to anchor-scroll via `data-lenis-prevent` on a node
 *    if a section should bypass the smooth behaviour.
 */
export default function SmoothScroll({ children }) {
    const [reduced, setReduced] = useState(() =>
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    );

    useEffect(() => {
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        const onChange = (e) => setReduced(e.matches);
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);

    if (reduced) return children;

    return (
        <ReactLenis
            root
            options={{
                // Tight, responsive feel. Long durations make the page feel
                // laggy on a productivity app where users tab between
                // sections constantly.
                duration: 0.9,
                smoothWheel: true,
                wheelMultiplier: 1,
                touchMultiplier: 1.2,
                // Standard ease — slight ease-out
                easing: (t) => 1 - Math.pow(1 - t, 3),
            }}
        >
            {children}
        </ReactLenis>
    );
}
