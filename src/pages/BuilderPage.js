import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DndContext, KeyboardSensor, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, useSortable, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FiMove, FiPlus } from "react-icons/fi";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import CopyToClipboardButton from "../components/CopyToClipboardButton";
import Tooltip from "../components/Tooltip";
import { createWheel, getWheelForEditing, updateWheel } from "../firebase";

const MIN_SLICES = 2;
const MAX_SLICES = 16;
const MAX_LABEL_LENGTH = 60;
const ENTER_TIP_SESSION_KEY = "builder-enter-tip-shown";

const COLOR_PALETTE = [
  "#6366F1",
  "#F59E0B",
  "#EC4899",
  "#22C55E",
  "#14B8A6",
  "#F97316",
  "#8B5CF6",
  "#0EA5E9",
];

const generateSliceId = () => {
  const cryptoApi = typeof crypto !== "undefined" ? crypto : undefined;
  if (cryptoApi && typeof cryptoApi.randomUUID === "function") {
    return cryptoApi.randomUUID();
  }
  return `slice-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const createSlice = (index, t) => ({
  id: generateSliceId(),
  label: t ? t("builder.defaultSlice", { index: index + 1 }) : `Slice ${index + 1}`,
  color: COLOR_PALETTE[index % COLOR_PALETTE.length],
});

const createInitialSlices = (t) => Array.from({ length: MIN_SLICES }, (_, index) => createSlice(index, t));

const BuilderPage = () => {
  const { t } = useTranslation("common");
  const [title, setTitle] = useState("");
  const [slices, setSlices] = useState(() => createInitialSlices(t));
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveErrorKey, setSaveErrorKey] = useState(null);
  const [shareInfo, setShareInfo] = useState(null);
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);
  const [loadErrorKey, setLoadErrorKey] = useState(null);
  const [editContext, setEditContext] = useState(null);
  const [loadedWheel, setLoadedWheel] = useState(null);
  const inputRefs = useRef([]);
  const [activeTipIndex, setActiveTipIndex] = useState(null);
  const [supportsKeyboard, setSupportsKeyboard] = useState(false);
  const [hasShownEnterTip, setHasShownEnterTip] = useState(() => {
    if (typeof window === "undefined") {
      return true;
    }
    try {
      return sessionStorage.getItem(ENTER_TIP_SESSION_KEY) === "true";
    } catch {
      return true;
    }
  });

  const [searchParams] = useSearchParams();
  const editWheelIdParam = searchParams.get("wheelId");
  const editKeyParam = searchParams.get("editKey");

  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      setHasShownEnterTip(sessionStorage.getItem(ENTER_TIP_SESSION_KEY) === "true");
    } catch {
      setHasShownEnterTip(true);
    }
    const pointerFine = window.matchMedia?.("(pointer:fine)")?.matches ?? false;
    const maxTouchPoints = typeof navigator !== "undefined" ? navigator.maxTouchPoints ?? 0 : 0;
    setSupportsKeyboard(pointerFine || maxTouchPoints === 0);
  }, []);

  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, slices.length);
  }, [slices.length]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const updateBuilderUrl = useCallback(
    (wheelId, editKey) => {
      if (typeof window === "undefined") {
        return;
      }

      const currentPath = window.location.pathname;
      const currentSearch = window.location.search;

      if (!wheelId || !editKey) {
        if (currentSearch) {
          navigate(currentPath, { replace: true });
        }
        return;
      }

      const params = new URLSearchParams({ wheelId, editKey });
      const newSearch = `?${params.toString()}`;

      if (currentSearch === newSearch) {
        return;
      }

      navigate(`${currentPath}${newSearch}`, { replace: true });
    },
    [navigate]
  );

  const isEditMode = Boolean(editContext);

  useEffect(() => {
    let isMounted = true;

    const loadExistingWheel = async (wheelId, editKey) => {
      setIsLoadingExisting(true);
      setLoadErrorKey(null);
      try {
        const result = await getWheelForEditing(wheelId, editKey);
        if (!isMounted) {
          return;
        }

        const nextTitle = result.title || "";
        const nextSlices = Array.isArray(result.slices) && result.slices.length > 0 ? result.slices : createInitialSlices();

        setTitle(nextTitle);
        setSlices(nextSlices);
        setLoadedWheel({ id: result.id, title: nextTitle, slices: nextSlices });
        setEditContext({ wheelId: result.id, editKey });
        updateBuilderUrl(result.id, editKey);
        setIsDirty(false);
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        setShareInfo({
          id: result.id,
          shareUrl: origin ? `${origin}/spin/${result.id}` : "",
          editUrl: origin
            ? `${origin}/builder?wheelId=${result.id}&editKey=${encodeURIComponent(editKey)}`
            : "",
          editKey,
          mode: "edit",
        });
        setLoadErrorKey(null);
      } catch (error) {
        console.error(error);
        if (!isMounted) {
          return;
        }
        if (error.code === "INVALID_EDIT_KEY") {
          setLoadErrorKey("invalidKey");
        } else if (error.code === "NOT_FOUND") {
          setLoadErrorKey("notFound");
        } else {
          setLoadErrorKey("generic");
        }
        setEditContext(null);
        setLoadedWheel(null);
        setTitle("");
        setSlices(createInitialSlices());
        setShareInfo(null);
      } finally {
        if (isMounted) {
          setIsLoadingExisting(false);
        }
      }
    };

    if (editWheelIdParam && editKeyParam) {
      loadExistingWheel(editWheelIdParam, editKeyParam);
    } else {
      setEditContext(null);
      setLoadedWheel(null);
      setShareInfo(null);
      if (typeof window !== "undefined") {
        updateBuilderUrl(null, null);
      }
      setLoadErrorKey(null);
    }

    return () => {
      isMounted = false;
    };
  }, [editWheelIdParam, editKeyParam, updateBuilderUrl]);

  const sliceErrors = useMemo(
    () =>
      slices.map((slice) => {
        if (!slice.label.trim()) {
          return "empty";
        }
        if (slice.label.length > MAX_LABEL_LENGTH) {
          return "tooLong";
        }
        return null;
      }),
    [slices]
  );

  const hasValidationErrors = sliceErrors.some(Boolean) || slices.length < MIN_SLICES;

  const handleTitleChange = (event) => {
    setIsDirty(true);
    setShareInfo(null);
    setTitle(event.target.value.slice(0, 60));
  };

  const handleLabelChange = (sliceId, value) => {
    setIsDirty(true);
    setShareInfo(null);
    setSlices((current) =>
      current.map((slice) =>
        slice.id === sliceId ? { ...slice, label: value.slice(0, MAX_LABEL_LENGTH) } : slice
      )
    );
  };

  const focusSliceField = (index) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const field = inputRefs.current[index];
        if (field) {
          field.focus();
          if (typeof field.select === "function") {
            field.select();
          }
        }
      });
    });
  };

  const handleLabelFocus = (index) => {
    if (!supportsKeyboard) {
      setActiveTipIndex(null);
      return;
    }
    if (!hasShownEnterTip) {
      setActiveTipIndex(index);
      setHasShownEnterTip(true);
      try {
        sessionStorage.setItem(ENTER_TIP_SESSION_KEY, "true");
      } catch {
        /* ignore storage errors */
      }
    }
  };

  const handleLabelBlur = (index) => {
    if (activeTipIndex === index) {
      setActiveTipIndex(null);
    }
  };

  const handleLabelKeyDown = (index) => (event) => {
    if (
      event.key !== "Enter" ||
      event.shiftKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey
    ) {
      return;
    }
    event.preventDefault();
    setActiveTipIndex(null);
    if (index < slices.length - 1) {
      focusSliceField(index + 1);
      return;
    }
    if (slices.length >= MAX_SLICES) {
      return;
    }
    const nextIndex = slices.length;
    handleAddSlice();
    focusSliceField(nextIndex);
  };

  const handleColorChange = (sliceId, value) => {
    setIsDirty(true);
    setShareInfo(null);
    setSlices((current) => current.map((slice) => (slice.id === sliceId ? { ...slice, color: value } : slice)));
  };

  const handleAddSlice = () => {
    if (slices.length >= MAX_SLICES) {
      return;
    }
    setIsDirty(true);
    setShareInfo(null);
    setSlices((current) => [...current, createSlice(current.length)]);
  };

  const handleRemoveSlice = (sliceId) => {
    if (slices.length <= MIN_SLICES) {
      return;
    }
    setIsDirty(true);
    setShareInfo(null);
    setSlices((current) => current.filter((slice) => slice.id !== sliceId));
  };

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) {
      return;
    }
    setSlices((current) => {
      const oldIndex = current.findIndex((item) => item.id === active.id);
      const newIndex = current.findIndex((item) => item.id === over.id);
      if (oldIndex === -1 || newIndex === -1) {
        return current;
      }
      const nextRefs = arrayMove([...inputRefs.current], oldIndex, newIndex);
      inputRefs.current = nextRefs;
      const reordered = arrayMove(current, oldIndex, newIndex);
      return reordered;
    });
    setActiveTipIndex(null);
    setShareInfo(null);
    setIsDirty(true);
  };

  const handleReset = () => {
    if (isEditMode && loadedWheel) {
      setTitle(loadedWheel.title || "");
      setSlices(loadedWheel.slices?.length ? loadedWheel.slices : createInitialSlices());
    } else {
      setTitle("");
      setSlices(createInitialSlices());
    }
    setIsDirty(false);
    setShareInfo(null);
    setSaveErrorKey(null);
  };

  const handleSave = async () => {
    if (hasValidationErrors || isSaving) {
      return;
    }

    setIsSaving(true);
    setSaveErrorKey(null);

    try {
      const sanitizedSlices = slices.map((slice) => ({
        ...slice,
        label: slice.label.trim(),
      }));
      let wheelId = editContext?.wheelId;
      let editKey = editContext?.editKey;

      if (isEditMode) {
        await updateWheel({
          wheelId,
          editKey,
          title,
          slices: sanitizedSlices,
        });
      } else {
        const result = await createWheel({
          title,
          slices: sanitizedSlices,
        });
        wheelId = result.id;
        editKey = result.editKey;
        setEditContext({ wheelId, editKey });
        updateBuilderUrl(result.id, result.editKey);
      }

      setLoadedWheel({ id: wheelId, title: title?.trim() || null, slices: sanitizedSlices });

      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const shareUrl = origin ? `${origin}/spin/${wheelId}` : "";
      const editUrl = origin
        ? `${origin}/builder?wheelId=${wheelId}&editKey=${encodeURIComponent(editKey)}`
        : "";

      setShareInfo({
        id: wheelId,
        shareUrl,
        editUrl,
        editKey,
        mode: isEditMode ? "edit" : "create",
      });
      setIsDirty(false);
      setSaveErrorKey(null);
    } catch (error) {
      console.error(error);
      if (error.code === "INVALID_EDIT_KEY") {
        setSaveErrorKey("invalidKey");
      } else if (error.code === "NOT_FOUND") {
        setSaveErrorKey("notFound");
      } else {
        setSaveErrorKey("generic");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 py-12">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">{t("builder.title")}</h1>
        <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
          {t(`builder.subtitle.${isEditMode ? "edit" : "create"}`)}
        </p>
        {isLoadingExisting ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">{t("builder.loading")}</p>
        ) : null}
        {loadErrorKey ? <p className="text-sm text-rose-500">{t(`builder.loadError.${loadErrorKey}`)}</p> : null}
      </header>

      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 dark:bg-slate-800 dark:ring-slate-700">
        <div className="space-y-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="wheel-title" className="text-sm font-medium text-slate-700">
              {t("builder.titleLabel")}
            </label>
            <input
              id="wheel-title"
              value={title}
              onChange={handleTitleChange}
              placeholder={t("builder.titlePlaceholder")}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-base shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>

          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t("builder.slicesHeading")}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t("builder.sliceCount", { count: slices.length, max: MAX_SLICES })}
              </p>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={slices.map((slice) => slice.id)} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col gap-3">
                  {slices.map((slice, index) => (
                    <SortableSlice
                      key={slice.id}
                      slice={slice}
                      index={index}
                      error={sliceErrors[index]}
                      registerInputRef={(element) => {
                        inputRefs.current[index] = element || null;
                      }}
                      activeTipIndex={activeTipIndex}
                      supportsKeyboard={supportsKeyboard}
                      onTooltipClose={() => setActiveTipIndex((prev) => (prev === index ? null : prev))}
                      onColorChange={handleColorChange}
                      onLabelChange={handleLabelChange}
                      onLabelFocus={handleLabelFocus}
                      onLabelBlur={handleLabelBlur}
                      onLabelKeyDown={handleLabelKeyDown}
                      onRemove={handleRemoveSlice}
                      totalSlices={slices.length}
                      minSlices={MIN_SLICES}
                      maxLabelLength={MAX_LABEL_LENGTH}
                      t={t}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            <div className="flex items-center justify-start pt-2">
              <button
                type="button"
                onClick={handleAddSlice}
                disabled={slices.length >= MAX_SLICES}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500 text-white shadow transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <FiPlus className="h-6 w-6" aria-hidden />
                <span className="sr-only">{t("builder.addSlice", { max: MAX_SLICES })}</span>
              </button>
              <span className="ml-3 text-sm text-slate-500 dark:text-slate-400">
                {t("builder.addSlice", { max: MAX_SLICES })}
              </span>
            </div>
          </div>
        </div>
      </section>

      <footer className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={handleReset}
          disabled={!isDirty || isLoadingExisting}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-800 disabled:cursor-not-allowed disabled:text-slate-300 dark:border-slate-700 dark:text-slate-300 dark:hover:text-slate-100"
        >
          {t("builder.reset")}
        </button>
        <div className="flex flex-col gap-2 text-right text-sm text-slate-500 dark:text-slate-400 sm:items-end">
          {hasValidationErrors ? (
            <span className="text-rose-500">{t("builder.validationError")}</span>
          ) : (
            <span>{t("builder.ready")}</span>
          )}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={hasValidationErrors || isSaving || isLoadingExisting}
              className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSaving
                ? t("builder.save.saving")
                : t(`builder.save.${isEditMode ? "edit" : "create"}`)}
            </button>
          </div>
        </div>
      </footer>

      {saveErrorKey ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600 dark:border-rose-500/40 dark:bg-rose-900/20 dark:text-rose-300">
          {t(`builder.saveError.${saveErrorKey}`)}
        </div>
      ) : null}

      {shareInfo ? (
        <section className="rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t("builder.success.title")}</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {t(`builder.success.${shareInfo.mode === "create" ? "create" : "edit"}`)}
              </p>
            </div>
            {shareInfo.shareUrl ? (
              <a
                href={shareInfo.shareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-lg border border-indigo-200 px-5 text-sm font-medium text-indigo-600 transition hover:border-indigo-300 hover:text-indigo-700 dark:border-slate-600 dark:text-indigo-300 dark:hover:border-indigo-400 dark:hover:text-indigo-200"
              >
                {t("builder.openInNewTab")}
              </a>
            ) : null}
          </div>
          <div className="mt-6 space-y-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t("builder.success.wheelId")}
              </span>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  value={shareInfo.id}
                  readOnly
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm focus:outline-none dark:border-slate-600 dark:bg-slate-950 dark:text-slate-200"
                />
                <div className="flex w-full justify-end sm:w-auto">
                  <CopyToClipboardButton
                    value={shareInfo.id}
                    successText={t("builder.success.wheelIdCopied")}
                    ariaLabel={t("builder.success.clipboardAria.wheelId")}
                    onError={(msg) => setSaveErrorKey(msg ? "clipboard" : null)}
                  />
                </div>
              </div>
            </div>
            {shareInfo.shareUrl ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {t("builder.success.shareLink")}
                </span>
                <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <input
                    value={shareInfo.shareUrl}
                    readOnly
                    className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none dark:border-slate-600 dark:bg-slate-950 dark:text-slate-200"
                  />
                  <div className="flex w-full justify-end sm:w-auto">
                    <CopyToClipboardButton
                      value={shareInfo.shareUrl}
                      successText={t("builder.success.shareLinkCopied")}
                      ariaLabel={t("builder.success.clipboardAria.share")}
                      onError={(msg) => setSaveErrorKey(msg ? "clipboard" : null)}
                    />
                  </div>
                </div>
              </div>
            ) : null}
            {shareInfo.editKey ? (
              <div className="flex flex-col gap-3 rounded-lg border border-indigo-100 bg-indigo-50/40 p-4 text-sm text-slate-700 dark:border-indigo-500/40 dark:bg-indigo-500/10 dark:text-slate-200">
                <div className="space-y-1">
                  <span className="font-medium text-indigo-700 dark:text-indigo-300">{t("builder.success.editKey")}</span>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t("builder.success.editKeyHint")}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <code className="break-all rounded bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow dark:bg-slate-900 dark:text-slate-200">
                    {shareInfo.editKey}
                  </code>
                  <div className="ml-auto flex justify-end gap-3 sm:ml-0">
                    <CopyToClipboardButton
                      value={shareInfo.editKey}
                      ariaLabel={t("builder.success.clipboardAria.editKey")}
                      successText={t("builder.success.editKeyCopied")}
                      onError={(msg) => setSaveErrorKey(msg ? "clipboard" : null)}
                    />
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
};

const SortableSlice = ({
  slice,
  index,
  error,
  registerInputRef,
  activeTipIndex,
  supportsKeyboard,
  onTooltipClose,
  onColorChange,
  onLabelChange,
  onLabelFocus,
  onLabelBlur,
  onLabelKeyDown,
  onRemove,
  totalSlices,
  minSlices,
  maxLabelLength,
  t,
}) => {
  const inputRef = useRef(null);
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slice.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? "none" : transition,
  };

  const dragHandleVisibility = supportsKeyboard
    ? "opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
    : "opacity-100";

  const registerRef = (element) => {
    inputRef.current = element;
    registerInputRef(element);
  };

  return (
    <div className="group relative" style={style} ref={setNodeRef} {...attributes}>
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...listeners}
        className={`drag-handle absolute left-[-2.25rem] top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-1 text-slate-500 shadow transition hover:bg-indigo-100 hover:text-indigo-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 dark:bg-slate-900/90 dark:text-slate-300 dark:hover:bg-indigo-500/20 dark:hover:text-indigo-200 ${dragHandleVisibility}`}
        aria-label={t("builder.reorderHandle", { index: index + 1 })}
      >
        <FiMove className="h-4 w-4" aria-hidden />
      </button>
      <div
        className={`flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4 shadow-sm transition sm:flex-row sm:items-center dark:border-slate-700 dark:bg-slate-800/60 ${
          isDragging ? "ring-2 ring-indigo-200 bg-white dark:bg-slate-800" : ""
        }`}
      >
      <div className="flex items-center gap-3 sm:w-32">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-semibold text-slate-500 shadow">
          {index + 1}
        </span>
        <input
          type="color"
          value={slice.color}
          onChange={(event) => onColorChange(slice.id, event.target.value)}
          className="h-10 w-10 cursor-pointer rounded-md border border-slate-200 bg-white p-1 shadow-inner dark:border-slate-600"
          aria-label={t("builder.colorLabel", { index: index + 1 })}
        />
      </div>

      <div className="flex-1 space-y-1">
        <input
          ref={registerRef}
          value={slice.label}
          onChange={(event) => onLabelChange(slice.id, event.target.value)}
          onFocus={() => onLabelFocus(index)}
          onBlur={() => onLabelBlur(index)}
          onKeyDown={onLabelKeyDown(index)}
          placeholder={t("builder.slicePlaceholder", { index: index + 1 })}
          className={`w-full rounded-lg border px-3 py-2 text-base shadow-sm transition focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:bg-slate-900 dark:text-slate-100 ${
            error ? "border-rose-400 focus:border-rose-400" : "border-slate-200 focus:border-indigo-500 dark:border-slate-700"
          }`}
        />
        <Tooltip
          anchorRef={inputRef}
          open={supportsKeyboard && activeTipIndex === index}
          placement="top"
          autoHide
          hideDelay={5000}
          hoverPauses
          onClose={onTooltipClose}
          content={
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow-sm">
                  ⏎
                  <span>Enter</span>
                </span>
                <span className="text-xs text-slate-600 dark:text-slate-300">
                  {t("builder.shortcuts.enterHint")}
                </span>
              </div>
              <button
                type="button"
                onClick={onTooltipClose}
                className="inline-flex items-center justify-center rounded-md bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-slate-300 dark:focus-visible:outline-slate-400"
              >
                {t("builder.shortcuts.enterHintButton")}
              </button>
            </div>
          }
        />
        <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
          <span>
            {slice.label.length}/{maxLabelLength}
          </span>
          {error ? (
            <span className="text-rose-500">{t(`builder.sliceError.${error}`, { max: maxLabelLength })}</span>
          ) : null}
        </div>
      </div>

      <div className="ml-auto flex justify-end">
        <button
          type="button"
          onClick={() => onRemove(slice.id)}
          disabled={totalSlices <= minSlices}
          className="self-start rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-500 transition hover:border-rose-300 hover:text-rose-500 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300 dark:border-slate-700 dark:text-slate-300 dark:hover:border-rose-400 dark:hover:text-rose-600 dark:disabled:border-slate-700 dark:disabled:text-slate-500"
        >
          {t("builder.remove")}
        </button>
      </div>
      </div>
    </div>
  );
};

export default BuilderPage;
