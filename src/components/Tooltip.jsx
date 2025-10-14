import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

const GAP = 12;

const resolveAnchor = (anchor) => {
  if (!anchor) {
    return null;
  }
  if (typeof anchor === "function") {
    return anchor();
  }
  return anchor.current ?? null;
};

const computePosition = (placement, anchorRect, tooltipRect) => {
  switch (placement) {
    case "bottom":
      return {
        top: anchorRect.bottom + GAP,
        left: anchorRect.left + anchorRect.width / 2,
        transform: "translate(-50%, 0)",
      };
    case "left":
      return {
        top: anchorRect.top + anchorRect.height / 2,
        left: anchorRect.left - GAP,
        transform: "translate(-100%, -50%)",
      };
    case "right":
      return {
        top: anchorRect.top + anchorRect.height / 2,
        left: anchorRect.right + GAP,
        transform: "translate(0, -50%)",
      };
    case "top":
    default:
      return {
        top: anchorRect.top - GAP,
        left: anchorRect.left + anchorRect.width / 2,
        transform: "translate(-50%, -100%)",
      };
  }
};

const Tooltip = ({
  anchorRef,
  children,
  content,
  open,
  placement = "top",
  autoHide = false,
  hideDelay = 4000,
  hoverPauses = true,
  showCloseButton = false,
  onOpen,
  onClose,
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, transform: "translate(-50%, -100%)" });
  const [isPositioned, setIsPositioned] = useState(false);
  const tooltipRef = useRef(null);
  const hideTimeoutRef = useRef(null);

  const anchorElement = useMemo(() => resolveAnchor(anchorRef), [anchorRef, open]);

  useLayoutEffect(() => {
    if (!open || !anchorElement) {
      setIsPositioned(false);
      return undefined;
    }

    const updatePosition = () => {
      const anchorRect = anchorElement.getBoundingClientRect();
      const tooltipRect = tooltipRef.current?.getBoundingClientRect();
      if (!tooltipRect) {
        return;
      }
      setCoords(computePosition(placement, anchorRect, tooltipRect));
      setIsPositioned(true);
    };

    const frame = window.requestAnimationFrame(() => {
      updatePosition();
      onOpen?.();
    });

    const resizeHandler = () => updatePosition();
    window.addEventListener("resize", resizeHandler);
    window.addEventListener("scroll", resizeHandler, true);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", resizeHandler);
      window.removeEventListener("scroll", resizeHandler, true);
    };
  }, [open, placement, anchorElement, onOpen]);

  useEffect(() => {
    if (!open || !autoHide || isHovering) {
      return undefined;
    }
    hideTimeoutRef.current = window.setTimeout(() => {
      onClose?.();
    }, hideDelay);

    return () => {
      if (hideTimeoutRef.current) {
        window.clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
    };
  }, [open, autoHide, hideDelay, onClose, isHovering]);

  if (!open || !anchorElement) {
    return children ?? null;
  }

  const tooltipContent = (
    <div
      ref={tooltipRef}
      role="tooltip"
      className="pointer-events-auto z-[1000] max-w-xs rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-lg transition-opacity dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      style={{
        position: "fixed",
        top: coords.top,
        left: coords.left,
        transform: coords.transform,
        visibility: isPositioned ? "visible" : "hidden",
      }}
      onMouseEnter={() => {
        if (!hoverPauses) {
          return;
        }
        setIsHovering(true);
        if (hideTimeoutRef.current) {
          window.clearTimeout(hideTimeoutRef.current);
          hideTimeoutRef.current = null;
        }
      }}
      onMouseLeave={() => {
        if (!hoverPauses) {
          return;
        }
        setIsHovering(false);
      }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1">{content}</div>
        {showCloseButton ? (
          <button
            type="button"
            onClick={() => onClose?.()}
            className="mt-0.5 rounded-full border border-slate-200 p-1 text-xs text-slate-500 transition hover:border-slate-300 hover:text-slate-700 dark:border-slate-600 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:text-slate-100"
            aria-label="Close tooltip"
          >
            ×
          </button>
        ) : null}
      </div>
    </div>
  );

  return (
    <>
      {children ?? null}
      {createPortal(tooltipContent, document.body)}
    </>
  );
};

export default Tooltip;
