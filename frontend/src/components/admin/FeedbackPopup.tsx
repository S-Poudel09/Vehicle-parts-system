type FeedbackPopupProps = {
  open: boolean;
  title: string;
  message: string;
  variant?: "success" | "error";
  onClose: () => void;
};

export default function FeedbackPopup({
  open,
  title,
  message,
  variant = "success",
  onClose,
}: FeedbackPopupProps) {
  if (!open) return null;

  const isError = variant === "error";

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/45 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <h3 className={`text-lg font-semibold ${isError ? "text-red-700" : "text-emerald-700"}`}>
          {title}
        </h3>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
        <div className="mt-6 flex justify-end">
          <button type="button" onClick={onClose} className="btn-primary-sm">
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
