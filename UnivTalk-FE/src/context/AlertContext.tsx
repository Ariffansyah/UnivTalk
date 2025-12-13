import React, { createContext, useContext, useCallback, useState } from "react";
import { Toast } from "../components/Toast";

type ToastType = "info" | "success" | "error" | "warning";

interface IAlertContext {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  showConfirm: (message: string, title?: string) => Promise<boolean>;
}

const AlertContext = createContext<IAlertContext | undefined>(undefined);

export const useAlert = (): IAlertContext => {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error("useAlert must be used within AlertProvider");
  return ctx;
};

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: ToastType }>>([]);
  const [confirmState, setConfirmState] = useState<{
    message: string;
    resolve?: (v: boolean) => void;
  } | null>(null);

  const removeToast = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = "info", duration = 3500) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setToasts((t) => [{ id, message, type }, ...t]);
    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }
  }, [removeToast]);

  const showConfirm = useCallback((message: string, _title?: string) => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({ message, resolve });
    });
  }, []);

  const handleConfirm = (val: boolean) => {
    if (confirmState?.resolve) confirmState.resolve(val);
    setConfirmState(null);
  };

  return (
    <AlertContext.Provider value={{ showToast, showConfirm }}>
      {children}
      {/* Toast container (top-center) */}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
        <div className="flex flex-col items-center pointer-events-auto">
          {toasts.map((t) => (
            <Toast key={t.id} id={t.id} message={t.message} type={t.type} onClose={removeToast} />
          ))}
        </div>
      </div>

      {/* Confirm modal */}
      {confirmState && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-2">Confirm</h3>
            <p className="text-sm text-gray-700 mb-4">{confirmState.message}</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => handleConfirm(false)}
                className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirm(true)}
                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
};