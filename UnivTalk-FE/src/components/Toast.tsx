import React from "react";

type ToastType = "info" | "success" | "error" | "warning";

interface ToastProps {
  id: string;
  type?: ToastType;
  message: string;
  onClose: (id: string) => void;
}

const typeColors: Record<ToastType, string> = {
  info: "bg-gray-800 text-white",
  success: "bg-green-500 text-white",
  error: "bg-red-500 text-white",
  warning: "bg-yellow-500 text-black",
};

export const Toast: React.FC<ToastProps> = ({ id, type = "info", message, onClose }) => {
  return (
    <div
      className={`max-w-sm w-full rounded-lg shadow-lg p-4 mb-3 flex items-start justify-between gap-3 ${typeColors[type]}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex-1 text-sm leading-tight">
        {message}
      </div>
      <button
        onClick={() => onClose(id)}
        className="ml-3 p-1 rounded-full bg-white/20 hover:bg-white/30 text-sm"
        aria-label="Close"
      >
        ✕
      </button>
    </div>
  );
};