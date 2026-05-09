import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, SearchX } from 'lucide-react';
import useAuthStore from '../store/authStore';
import Button from '../components/common/Button';

export default function NotFound() {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuthStore();

    const homePath =
        !isAuthenticated
            ? '/'
            : user?.role === 'STUDENT'
                ? '/student/dashboard'
                : '/admin/dashboard';

    return (
        <main
            id="main-content"
            tabIndex={-1}
            className="min-h-[80vh] flex items-center justify-center px-6 outline-none"
        >
            <div className="w-full max-w-md text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--color-bg-subtle)] border-2 border-[var(--color-border)] shadow-[3px_3px_0_var(--color-border)] flex items-center justify-center">
                    <SearchX size={36} className="text-[var(--color-text-secondary)]" aria-hidden="true" />
                </div>
                <p className="text-sm font-bold tracking-widest text-[var(--color-primary)] uppercase mb-2">
                    404
                </p>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--color-text-primary)] mb-3">
                    Page not found
                </h1>
                <p className="text-sm text-[var(--color-text-secondary)] mb-8 leading-relaxed">
                    The page you're looking for doesn't exist or may have moved. Check the
                    URL, or head back home.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button variant="outline" icon={<ArrowLeft size={16} />} onClick={() => navigate(-1)}>
                        Go back
                    </Button>
                    <Link to={homePath}>
                        <Button icon={<Home size={16} />} fullWidth>
                            Take me home
                        </Button>
                    </Link>
                </div>
            </div>
        </main>
    );
}
