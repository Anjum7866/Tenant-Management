type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'secondary' | 'danger';
};

export function Button({ variant = 'primary', className = '', children, ...props }: ButtonProps) {
    const styles = {
        primary: 'bg-slate-900 text-white hover:bg-slate-700',
        secondary: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50',
        danger: 'bg-red-600 text-white hover:bg-red-500',
    };

    return (
        <button
            {...props}
            className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition ${styles[variant]} disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
        >
            {children}
        </button>
    );
}
