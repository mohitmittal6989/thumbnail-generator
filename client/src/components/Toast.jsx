import { useEffect } from "react";

const toastStyles = {
  success: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
  error: "border-rose-400/30 bg-rose-500/10 text-rose-200",
  info: "border-cyan-400/30 bg-cyan-500/10 text-cyan-200"
};

const Toast = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast.message) {
      return undefined;
    }

    const timer = setTimeout(() => {
      onClose();
    }, 2800);

    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast.message) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className={`rounded-2xl border px-4 py-3 shadow-glow ${toastStyles[toast.type] || toastStyles.info}`}>
        {toast.message}
      </div>
    </div>
  );
};

export default Toast;