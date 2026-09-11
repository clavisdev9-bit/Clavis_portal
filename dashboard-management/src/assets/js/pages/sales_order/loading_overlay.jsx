window.LoadingOverlay = function LoadingOverlay({ loading, children }) {
    return (
        <div className="relative">
            <div
                className={`absolute inset-0 z-10 flex items-center justify-center bg-white/60 dark:bg-slate-900/60 transition-opacity duration-200 ${
                    loading ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                }`}
            >
                <svg
                    className="animate-spin h-8 w-8 text-blue-600"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                >
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                    ></circle>
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    ></path>
                </svg>
            </div>
            <div className={`transition-all duration-200 ${loading ? "blur-sm pointer-events-none" : ""}`}>
                {children}
            </div>
        </div>
    );
};
