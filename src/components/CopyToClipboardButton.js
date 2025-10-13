import { useEffect, useRef, useState } from "react";
import { FiCheck, FiClipboard } from "react-icons/fi";
import { useNotification } from "./NotificationProvider";

const CopyToClipboardButton = ({
  value,
  onError,
  successText = "Skopiowano do schowka",
  ariaLabel = "Kopiuj link",
  className = "",
}) => {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef(null);
  const { showNotification } = useNotification();

  useEffect(
    () => () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    },
    []
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      onError?.(null);
      showNotification(successText);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error(error);
      onError?.("Nie udało się skopiować linku do schowka.");
    }
  };

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={ariaLabel}
        title={ariaLabel}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-indigo-200 text-indigo-600 transition hover:border-indigo-300 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 dark:border-slate-600 dark:text-indigo-300 dark:hover:border-indigo-400 dark:hover:text-indigo-200"
      >
        <FiClipboard className={`absolute h-5 w-5 transition-opacity duration-200 ${copied ? "opacity-0" : "opacity-100"}`} />
        <FiCheck className={`absolute h-5 w-5 text-emerald-500 transition-opacity duration-200 ${copied ? "opacity-100" : "opacity-0"}`} />
      </button>
    </div>
  );
};
export default CopyToClipboardButton;
