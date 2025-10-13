import { createContext, useContext, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const NotificationContext = createContext({
  showNotification: () => {},
});

const NotificationOverlay = ({ message, offset }) => {
  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className={`pointer-events-none fixed inset-x-0 flex justify-center px-4 transition-all duration-300 ${
        message ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
      aria-live="polite"
      aria-atomic="true"
      style={{ bottom: offset }}
    >
      {message ? (
        <div className="max-w-sm rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm font-medium text-emerald-700 shadow-lg dark:border-emerald-500/40 dark:bg-slate-900/95 dark:text-emerald-300">
          {message}
        </div>
      ) : (
        <span className="sr-only">Notification hidden</span>
      )}
    </div>,
    document.body
  );
};

export const NotificationProvider = ({ children }) => {
  const [message, setMessage] = useState(null);
  const timeoutRef = useRef(null);
  const [bottomOffset, setBottomOffset] = useState(32);
  const footerObserverRef = useRef(null);

  useEffect(
    () => () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (footerObserverRef.current) {
        footerObserverRef.current.disconnect?.();
        footerObserverRef.current = null;
      }
    },
    []
  );

  useEffect(() => {
    if (typeof document === "undefined") {
      return undefined;
    }

    const footer = document.querySelector("[data-app-footer]");
    if (!footer) {
      setBottomOffset(32);
      return undefined;
    }

    const BASE_OFFSET = 24;
    const updateOffset = () => {
      const rect = footer.getBoundingClientRect();
      const height = rect?.height ?? 0;
      setBottomOffset(height + BASE_OFFSET);
    };

    updateOffset();

    const handleResize = () => updateOffset();
    window.addEventListener("resize", handleResize);

    if (typeof ResizeObserver === "function") {
      const observer = new ResizeObserver(updateOffset);
      observer.observe(footer);
      footerObserverRef.current = observer;
      return () => {
        window.removeEventListener("resize", handleResize);
        observer.disconnect();
        footerObserverRef.current = null;
      };
    }

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const showNotification = useCallback((text) => {
    if (!text) {
      return;
    }
    setMessage(text);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => setMessage(null), 2500);
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <NotificationOverlay message={message} offset={bottomOffset} />
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
