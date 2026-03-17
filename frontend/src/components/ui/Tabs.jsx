import { motion } from 'framer-motion';

export default function Tabs({ tabs = [], activeTab, onChange, variant = 'underline' }) {
    if (variant === 'pill') {
        return (
            <div className="inline-flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => onChange(tab.key)}
                        className={`relative px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${activeTab === tab.key
                                ? 'text-primary'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        {activeTab === tab.key && (
                            <motion.div
                                layoutId="pill-bg"
                                className="absolute inset-0 bg-white rounded-md shadow-sm"
                                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            />
                        )}
                        <span className="relative z-10 flex items-center gap-2">
                            {tab.icon}
                            {tab.label}
                            {tab.count != null && (
                                <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full font-semibold">
                                    {tab.count}
                                </span>
                            )}
                        </span>
                    </button>
                ))}
            </div>
        );
    }

    return (
        <div className="flex items-center gap-0 border-b border-gray-200">
            {tabs.map((tab) => (
                <button
                    key={tab.key}
                    onClick={() => onChange(tab.key)}
                    className={`relative px-4 py-3 text-sm font-medium transition-colors ${activeTab === tab.key
                            ? 'text-primary'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <span className="flex items-center gap-2">
                        {tab.icon}
                        {tab.label}
                        {tab.count != null && (
                            <span
                                className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${activeTab === tab.key
                                        ? 'bg-primary-light text-primary'
                                        : 'bg-gray-100 text-gray-500'
                                    }`}
                            >
                                {tab.count}
                            </span>
                        )}
                    </span>
                    {activeTab === tab.key && (
                        <motion.div
                            layoutId="tab-underline"
                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                    )}
                </button>
            ))}
        </div>
    );
}
