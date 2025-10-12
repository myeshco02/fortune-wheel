import { useEffect, useRef, useState } from "react";
import { FiCheck, FiClipboard } from "react-icons/fi";

const CopyToClipboardButton = ({
  value,
  onError,
  successText = "Skopiowano do schowka",
  ariaLabel = "Kopiuj link",
  className = "",
  successClassName = "text-xs font-medium text-emerald-600 dark:text-emerald-400",
}) => {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(
    () => () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    },
    []
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      onError?.(null);
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error(error);
      onError?.("Nie udało się skopiować linku do schowka.");
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={handleCopy}
        title={copied ? successText : ariaLabel}
        aria-label={copied ? successText : ariaLabel}
        className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition hover:border-indigo-300 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 dark:hover:border-indigo-400 dark:hover:text-indigo-200 ${
          copied
            ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500 dark:bg-emerald-900/30 dark:text-emerald-300"
            : "border-indigo-200 text-indigo-600 dark:border-slate-600 dark:text-indigo-300"
        }`}
      >
        {copied ? <FiCheck className="h-5 w-5" /> : <FiClipboard className="h-5 w-5" />}
      </button>
      {copied ? <span className={successClassName}>{successText}</span> : null}
    </div>
  );
};
export default CopyToClipboardButton;
