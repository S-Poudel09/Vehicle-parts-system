import { useState, type FormEvent, type ReactNode } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import ConfirmPopup from "./ConfirmPopup";

type AdminFormModalProps = {
  open: boolean;
  title: string;
  subtitle?: string;
  isDirty?: boolean;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode | ((helpers: { requestClose: () => void }) => ReactNode);
  onSubmit?: (e: FormEvent) => void;
  submitLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  submitDisabled?: boolean;
  maxWidthClass?: string;
};

export default function AdminFormModal({
  open,
  title,
  subtitle,
  isDirty = false,
  onClose,
  children,
  footer,
  onSubmit,
  submitLabel = "Save",
  cancelLabel = "Cancel",
  loading = false,
  submitDisabled = false,
  maxWidthClass = "max-w-lg",
}: AdminFormModalProps) {
  const [discardOpen, setDiscardOpen] = useState(false);

  if (!open) return null;

  const requestClose = () => {
    if (loading) return;
    if (isDirty) {
      setDiscardOpen(true);
      return;
    }
    onClose();
  };

  const confirmDiscard = () => {
    setDiscardOpen(false);
    onClose();
  };

  const body = (
    <>
      <div className="space-y-4">{children}</div>
      {(footer || onSubmit) && (
        <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
          {typeof footer === "function"
            ? footer({ requestClose })
            : footer ?? (
            <>
              <button
                type="button"
                className="btn-secondary"
                disabled={loading}
                onClick={requestClose}
              >
                {cancelLabel}
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading || submitDisabled}
              >
                {loading ? "Saving…" : submitLabel}
              </button>
            </>
          )}
        </div>
      )}
    </>
  );

  return (
    <>
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/45 p-4">
        <div
          className={`max-h-[90vh] w-full ${maxWidthClass} overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-form-modal-title"
        >
          <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
            <div>
              <h3
                id="admin-form-modal-title"
                className="text-lg font-semibold text-slate-900"
              >
                {title}
              </h3>
              {subtitle && (
                <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>
              )}
            </div>
            <button
              type="button"
              onClick={requestClose}
              disabled={loading}
              className="btn-secondary !p-2"
              aria-label="Close"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6">
            {onSubmit ? (
              <form onSubmit={onSubmit}>{body}</form>
            ) : (
              body
            )}
          </div>
        </div>
      </div>

      <ConfirmPopup
        open={discardOpen}
        title="Discard unsaved changes?"
        message="You have unsaved changes. Closing will lose what you entered."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        onConfirm={confirmDiscard}
        onClose={() => setDiscardOpen(false)}
      />
    </>
  );
}
