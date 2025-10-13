import { useCallback, useEffect, useMemo, useState } from "react";
import { FiPlus } from "react-icons/fi";
import { useNavigate, useSearchParams } from "react-router-dom";
import CopyToClipboardButton from "../components/CopyToClipboardButton";
import { createWheel, getWheelForEditing, updateWheel } from "../firebase";

const MIN_SLICES = 2;
const MAX_SLICES = 16;
const MAX_LABEL_LENGTH = 60;

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

const createSlice = (index) => ({
  id: generateSliceId(),
  label: `Pole ${index + 1}`,
  color: COLOR_PALETTE[index % COLOR_PALETTE.length],
});

const createInitialSlices = () => Array.from({ length: MIN_SLICES }, (_, index) => createSlice(index));

const BuilderPage = () => {
  const [title, setTitle] = useState("");
  const [slices, setSlices] = useState(createInitialSlices);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [shareInfo, setShareInfo] = useState(null);
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [editContext, setEditContext] = useState(null);
  const [loadedWheel, setLoadedWheel] = useState(null);

  const [searchParams] = useSearchParams();
  const editWheelIdParam = searchParams.get("wheelId");
  const editKeyParam = searchParams.get("editKey");

  const navigate = useNavigate();

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
      setLoadError(null);
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
      } catch (error) {
        console.error(error);
        if (!isMounted) {
          return;
        }
        if (error.code === "INVALID_EDIT_KEY") {
          setLoadError("Klucz edycji jest nieprawidłowy. Sprawdź i spróbuj ponownie.");
        } else if (error.code === "NOT_FOUND") {
          setLoadError("Nie znaleziono koła o podanym ID.");
        } else {
          setLoadError("Nie udało się wczytać koła do edycji. Spróbuj ponownie.");
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
    }

    return () => {
      isMounted = false;
    };
  }, [editWheelIdParam, editKeyParam, updateBuilderUrl]);

  const sliceErrors = useMemo(
    () =>
      slices.map((slice) => {
        if (!slice.label.trim()) {
          return "Pole musi mieć nazwę.";
        }
        if (slice.label.length > MAX_LABEL_LENGTH) {
          return `Maksymalnie ${MAX_LABEL_LENGTH} znaków.`;
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
    setSaveError(null);
  };

  const handleSave = async () => {
    if (hasValidationErrors || isSaving) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);

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
    } catch (error) {
      console.error(error);
      if (error.code === "INVALID_EDIT_KEY") {
        setSaveError("Klucz edycji jest nieprawidłowy. Odśwież link i spróbuj ponownie.");
      } else if (error.code === "NOT_FOUND") {
        setSaveError("Nie znaleziono koła do zapisania. Upewnij się, że posługujesz się właściwym linkiem.");
      } else {
        setSaveError("Nie udało się zapisać koła. Spróbuj ponownie.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 py-12">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">Kreator koła</h1>
        <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
          {isEditMode ? "Edytujesz istniejącą konfigurację. Pamiętaj, że zapis wymaga poprawnego klucza edycji." : "Każde zapisane koło tworzy nową konfigurację."}
        </p>
        {isLoadingExisting ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Wczytywanie konfiguracji...</p>
        ) : null}
        {loadError ? (
          <p className="text-sm text-rose-500">{loadError}</p>
        ) : null}
      </header>

      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 dark:bg-slate-800 dark:ring-slate-700">
        <div className="space-y-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="wheel-title" className="text-sm font-medium text-slate-700">
              Nazwa koła (opcjonalnie)
            </label>
            <input
              id="wheel-title"
              value={title}
              onChange={handleTitleChange}
              placeholder="Nazwa, np. Impreza firmowa"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-base shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>

          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Pola koła</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Liczba pól: {slices.length} / {MAX_SLICES}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {slices.map((slice, index) => {
                const error = sliceErrors[index];
                return (
                  <div
                    key={slice.id}
                    className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4 shadow-sm sm:flex-row sm:items-center dark:border-slate-700 dark:bg-slate-800/60"
                  >
                    <div className="flex items-center gap-3 sm:w-32">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-semibold text-slate-500 shadow">
                        {index + 1}
                      </span>
                      <input
                        type="color"
                        value={slice.color}
                        onChange={(event) => handleColorChange(slice.id, event.target.value)}
                        className="h-10 w-10 cursor-pointer rounded-md border border-slate-200 bg-white p-1 shadow-inner dark:border-slate-600"
                        aria-label={`Wybierz kolor dla pola ${index + 1}`}
                      />
                    </div>

                    <div className="flex-1 space-y-1">
                      <input
                        value={slice.label}
                        onChange={(event) => handleLabelChange(slice.id, event.target.value)}
                        placeholder={`Nazwa pola ${index + 1}`}
                        className={`w-full rounded-lg border px-3 py-2 text-base shadow-sm transition focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:bg-slate-900 dark:text-slate-100 ${
                          error ? "border-rose-400 focus:border-rose-400" : "border-slate-200 focus:border-indigo-500 dark:border-slate-700"
                        }`}
                      />
                      <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                        <span>{slice.label.length}/{MAX_LABEL_LENGTH}</span>
                        {error ? <span className="text-rose-500">{error}</span> : null}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveSlice(slice.id)}
                      disabled={slices.length <= MIN_SLICES}
                      className="self-start rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-500 transition hover:border-rose-300 hover:text-rose-500 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300 dark:border-slate-700 dark:text-slate-300 dark:hover:border-rose-400 dark:hover:text-rose-600 dark:disabled:border-slate-700 dark:disabled:text-slate-500"
                    >
                      Usuń
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-start pt-2">
              <button
                type="button"
                onClick={handleAddSlice}
                disabled={slices.length >= MAX_SLICES}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500 text-white shadow transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <FiPlus className="h-6 w-6" aria-hidden />
                <span className="sr-only">Dodaj pole</span>
              </button>
              <span className="ml-3 text-sm text-slate-500 dark:text-slate-400">
                Dodaj nowe pole (max {MAX_SLICES}).
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
          Zacznij od nowa
        </button>
        <div className="flex flex-col gap-2 text-right text-sm text-slate-500 dark:text-slate-400 sm:items-end">
          {hasValidationErrors ? (
            <span className="text-rose-500">Upewnij się, że każde pole ma nazwę i zachowujesz minimalną liczbę pól.</span>
          ) : (
            <span>Gotowe do zapisania.</span>
          )}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={hasValidationErrors || isSaving || isLoadingExisting}
              className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSaving ? "Zapisywanie..." : isEditMode ? "Zapisz zmiany" : "Zapisz konfigurację"}
            </button>
          </div>
        </div>
      </footer>

      {saveError ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600 dark:border-rose-500/40 dark:bg-rose-900/20 dark:text-rose-300">
          {saveError}
        </div>
      ) : null}

      {shareInfo ? (
        <section className="rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Konfiguracja zapisana!</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {shareInfo.mode === "create"
              ? "Udostępnij link znajomym i koniecznie zachowaj klucz edycji. Będzie potrzebny przy każdej zmianie koła."
              : "Zmiany zostały zapisane. Klucz edycji pozostaje taki sam – użyj go, aby ponownie otworzyć ten kreator."}
          </p>
          <div className="mt-4 space-y-3">
            <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:bg-slate-900/60 dark:text-slate-300">
              <span className="font-medium text-slate-700 dark:text-slate-200">ID koła:</span> {shareInfo.id}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                value={shareInfo.shareUrl}
                readOnly
                className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 shadow-sm focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              />
              <div className="flex items-center gap-2">
                <CopyToClipboardButton value={shareInfo.shareUrl} onError={(msg) => setSaveError(msg)} />
                <a
                  href={shareInfo.shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-indigo-200 px-4 text-sm font-medium text-indigo-600 transition hover:border-indigo-300 hover:text-indigo-700 dark:border-slate-600 dark:text-indigo-300 dark:hover:border-indigo-400 dark:hover:text-indigo-200"
                >
                  Otwórz w nowej karcie
                </a>
              </div>
            </div>
            {shareInfo.editKey ? (
              <div className="flex flex-col gap-3 rounded-lg border border-indigo-100 bg-indigo-50/40 p-4 text-sm text-slate-700 dark:border-indigo-500/40 dark:bg-indigo-500/10 dark:text-slate-200 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <span className="font-medium text-indigo-700 dark:text-indigo-300">Klucz edycji:</span>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Zachowaj go w bezpiecznym miejscu. Tylko osoby posiadające ten klucz mogą modyfikować koło.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <code className="rounded bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow dark:bg-slate-900 dark:text-slate-200">
                    {shareInfo.editKey}
                  </code>
                  <CopyToClipboardButton
                    value={shareInfo.editKey}
                    ariaLabel="Kopiuj klucz edycji"
                    successText="Klucz skopiowany"
                    onError={(msg) => setSaveError(msg)}
                  />
                </div>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
};

export default BuilderPage;
