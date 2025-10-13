import { useMemo, useState } from "react";
import { FiPlus } from "react-icons/fi";
import CopyToClipboardButton from "../components/CopyToClipboardButton";
import { createWheel } from "../firebase";

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
    setTitle("");
    setSlices(createInitialSlices());
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

      const id = await createWheel({
        title,
        slices: sanitizedSlices,
      });

      const shareUrl = `${window.location.origin}/spin/${id}`;
      setShareInfo({ id, shareUrl });
      setIsDirty(false);
    } catch (error) {
      console.error(error);
      setSaveError("Nie udało się zapisać koła. Spróbuj ponownie.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 py-12">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">Kreator koła</h1>
        <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Każde zapisane koło tworzy nową konfigurację.</p>
        
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
                      className="self-start rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-500 transition hover:border-rose-300 hover:text-rose-500 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300 dark:border-slate-700 dark:text-slate-300"
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
          disabled={!isDirty}
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
              disabled={hasValidationErrors || isSaving}
              className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSaving ? "Zapisywanie..." : "Zapisz konfigurację"}
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
            Udostępnij link znajomym – po odwiedzeniu strony będą mogli od razu zakręcić kołem.
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
          </div>
        </section>
      ) : null}
    </div>
  );
};

export default BuilderPage;
