import { Component } from 'react';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { error: null };
    }

    static getDerivedStateFromError(error) {
        return { error };
    }

    componentDidCatch(error, info) {
        if (import.meta.env.DEV) {
            console.error('ErrorBoundary caught:', error, info);
        }
    }

    handleReset = () => {
        this.setState({ error: null });
    };

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (!this.state.error) return this.props.children;

        if (this.props.fallback) {
            return this.props.fallback({
                error: this.state.error,
                reset: this.handleReset,
            });
        }

        return (
            <div className="min-h-[60vh] flex items-center justify-center p-6">
                <div className="max-w-md w-full text-center">
                    <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                        Something went wrong
                    </h1>
                    <p className="text-sm text-gray-500 mb-6">
                        An unexpected error occurred. Try again, or reload the page.
                    </p>
                    {import.meta.env.DEV && (
                        <pre className="text-xs text-left bg-gray-100 p-3 rounded mb-6 overflow-auto max-h-40">
                            {this.state.error?.message}
                        </pre>
                    )}
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={this.handleReset}
                            className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 hover:bg-gray-50"
                        >
                            Try again
                        </button>
                        <button
                            onClick={this.handleReload}
                            className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-white hover:opacity-90"
                        >
                            Reload page
                        </button>
                    </div>
                </div>
            </div>
        );
    }
}

export default ErrorBoundary;
