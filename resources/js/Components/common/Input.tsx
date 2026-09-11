import type { InputHTMLAttributes } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
    label?: string;
    error?: string;
};

export function Input({ label, error, className = '', ...props }: InputProps) {
    return (
        <label className="block w-full text-sm text-slate-700">
            {label && <span className="mb-1 block font-medium">{label}</span>}
            <input
                {...props}
                className={`w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : ''} ${className}`}
            />
            {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
        </label>
    );
}
