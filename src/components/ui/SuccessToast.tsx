"use client";

type SuccessToastProps = {
  message: string;
  onClose: () => void;
};

export default function SuccessToast({ message, onClose }: SuccessToastProps) {
  if (!message) return null;

  return (
    <div className="fixed top-5 right-5 z-50 w-full max-w-md animate-[fadeIn_0.2s_ease-out]">
      <div className="rounded-2xl border border-green-200 bg-white px-4 py-4 shadow-[0_16px_40px_rgba(22,163,74,0.18)]">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-lg text-green-700">
            ✓
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[0.82rem] font-semibold uppercase tracking-[0.08em] text-green-600">
              Operación completada
            </p>
            <p className="mt-1 text-[0.92rem] font-medium text-navy">
              {message}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-text-light transition-colors hover:bg-surface hover:text-navy"
            aria-label="Cerrar notificación"
            title="Cerrar"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
