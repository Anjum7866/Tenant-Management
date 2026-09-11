import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

type ModalProps = {
    isOpen: boolean;
    title: string;
    onClose: () => void;
    children: ReactNode;
};

export function Modal({ isOpen, title, onClose, children }: ModalProps) {
    if (!isOpen) {
        return null;
    }

    return createPortal(
        (
        <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-slate-950/75 p-4 backdrop-blur-[2px] sm:items-center">
            <div role="dialog" aria-modal="true" aria-labelledby="modal-title" className="relative z-[101] my-4 flex max-h-[calc(100vh-2rem)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.35)] sm:my-8 sm:max-h-[calc(100vh-4rem)]">
                <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-6 py-5 sm:px-8">
                    <h2 id="modal-title" className="text-xl font-semibold text-slate-800">{title}</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                    >
                        ✕
                    </button>
                </div>
                <div className="overflow-y-auto px-6 py-6 sm:px-8">{children}</div>
            </div>
        </div>
        ),
        document.body,
    );
}
