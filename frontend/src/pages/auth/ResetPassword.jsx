import { Link } from 'react-router-dom';
import { ArrowLeft, Wrench } from 'lucide-react';
import Button from '../../components/common/Button';

export default function ResetPassword() {
    return (
        <main
            id="main-content"
            tabIndex={-1}
            className="min-h-[80vh] flex items-center justify-center px-6 outline-none"
        >
            <div className="w-full max-w-md text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--color-warning-soft)] border-2 border-[var(--color-border)] shadow-[3px_3px_0_var(--color-border)] flex items-center justify-center">
                    <Wrench size={32} className="text-[var(--color-warning)]" aria-hidden="true" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text-primary)] mb-3">
                    Password reset is coming soon
                </h1>
                <p className="text-sm text-[var(--color-text-secondary)] mb-8 leading-relaxed">
                    This page is still being built. If you need to reset your password,
                    contact support, or use the{' '}
                    <Link
                        to="/forgot-password"
                        className="text-[var(--color-primary)] font-semibold hover:underline"
                    >
                        Forgot Password
                    </Link>{' '}
                    flow.
                </p>
                <Link to="/login">
                    <Button variant="outline" icon={<ArrowLeft size={16} />}>
                        Back to sign in
                    </Button>
                </Link>
            </div>
        </main>
    );
}
