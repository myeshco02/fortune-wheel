import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import confetti from "canvas-confetti";
import CopyToClipboardButton from "../components/CopyToClipboardButton";
import { getWheel } from "../firebase";

const SPIN_DURATION = 4500;

const SpinPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [wheel, setWheel] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState(null);
  const [copyError, setCopyError] = useState(null);
  const spinTimeoutRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const loadWheel = async () => {
      setIsLoading(true);
      setHasError(false);

      try {
        const result = await getWheel(id);
        if (!result) {
          navigate("/not-found", { replace: true });
          return;
        }
        if (isMounted) {
          setWheel(result);
        }
      } catch (error) {
        console.error(error);
        if (isMounted) {
          setHasError(true);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadWheel();

    return () => {
      isMounted = false;
    };
  }, [id, navigate]);

  useEffect(
    () => () => {
      if (spinTimeoutRef.current) {
        window.clearTimeout(spinTimeoutRef.current);
      }
    },
    []
  );

  const slices = useMemo(() => wheel?.slices ?? [], [wheel]);

  const sliceAngle = useMemo(() => (slices.length ? 360 / slices.length : 0), [slices.length]);

  const gradientBackground = useMemo(() => {
    if (!slices.length) {
      return "#E2E8F0";
    }

    const startOffset = -90 - sliceAngle / 2;
    const segments = slices
      .map((slice, index) => {
        const from = index * sliceAngle;
        const to = from + sliceAngle;
        return `${slice.color} ${from}deg ${to}deg`;
      })
      .join(", ");

    return `conic-gradient(from ${startOffset}deg, ${segments})`;
  }, [slices, sliceAngle]);

  const shareUrl = useMemo(() => `${window.location.origin}/spin/${id}`, [id]);

  const handleSpin = () => {
    if (!slices.length || isSpinning) {
      return;
    }

    setIsSpinning(true);
    setWinner(null);
    setCopyError(null);

    const localSliceAngle = sliceAngle || 360 / slices.length;
    const chosenIndex = Math.floor(Math.random() * slices.length);
    const normalizedCurrent = ((rotation % 360) + 360) % 360;
    const spins = 5 + Math.floor(Math.random() * 4);
    const halfSlice = localSliceAngle / 2;
    const safetyMargin = Math.min(halfSlice * 0.25, 8);
    const maxOffset = Math.max(halfSlice - safetyMargin, 0);
    const offsetWithinSlice = maxOffset ? (Math.random() - 0.5) * 2 * maxOffset : 0;
    const desiredNormalized =
      ((-chosenIndex * localSliceAngle + offsetWithinSlice) % 360 + 360) % 360;
    const totalAfterSpins = (normalizedCurrent + spins * 360) % 360;
    let adjustment = desiredNormalized - totalAfterSpins;
    if (adjustment <= 0) {
      adjustment += 360;
    }
    const targetRotation = rotation + spins * 360 + adjustment;
    setRotation(targetRotation);

    if (spinTimeoutRef.current) {
      window.clearTimeout(spinTimeoutRef.current);
    }

    spinTimeoutRef.current = window.setTimeout(() => {
      setWinner(slices[chosenIndex]);
      setIsSpinning(false);

      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        decay: 0.9,
      });
    }, SPIN_DURATION);
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 py-12">
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">Zakręć kołem</h1>
        <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Konfiguracja: {id}</p>
      </header>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-100 bg-white py-16 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-500 dark:border-indigo-400/40 dark:border-t-indigo-400" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Wczytywanie koła fortuny...</p>
        </div>
      ) : null}

      {hasError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-600 shadow-sm dark:border-rose-500/40 dark:bg-rose-900/20 dark:text-rose-300">
          Wystąpił błąd podczas pobierania konfiguracji. Odśwież stronę i spróbuj ponownie.
        </div>
      ) : null}

      {!isLoading && !hasError && wheel ? (
        <>
          <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  {wheel.title || "Koło bez nazwy"}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Liczba pól: {slices.length}</p>
              </div>
              <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-3">
                <CopyToClipboardButton value={shareUrl} onError={setCopyError} />
                {copyError ? (
                  <span className="text-xs font-medium text-rose-600 dark:text-rose-400">{copyError}</span>
                ) : null}
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {slices.map((slice) => (
                <div
                  key={slice.id}
                  className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800/60"
                >
                  <span
                    className="h-4 w-4 rounded-full border border-slate-200"
                    style={{ backgroundColor: slice.color }}
                    aria-hidden
                  />
                  <span className="truncate text-sm text-slate-700 dark:text-slate-200">{slice.label}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="relative mx-auto flex h-[360px] w-[360px] max-w-full items-center justify-center">
              <div
                className="relative h-full w-full rounded-full shadow-lg transition-transform duration-[4500ms] ease-out"
                style={{
                  background: gradientBackground,
                  transform: `rotate(${rotation}deg)`,
                }}
              >
                <div className="absolute inset-6 rounded-full border border-white/30 bg-white/10 blur-sm" />
                {slices.map((slice, index) => {
                  if (!sliceAngle) {
                    return null;
                  }
                  const centerAngle = -90 + index * sliceAngle;
                  const radians = (centerAngle * Math.PI) / 180;
                  const radiusPercent = 38;
                  const x = 50 + radiusPercent * Math.cos(radians);
                  const y = 50 + radiusPercent * Math.sin(radians);
                  return (
                    <div
                      key={slice.id}
                      className="absolute flex max-w-[55%] -translate-x-1/2 -translate-y-1/2 items-center justify-center"
                      style={{
                        left: `${x}%`,
                        top: `${y}%`,
                        transform: `translate(-50%, -50%) rotate(${ -centerAngle }deg)`,
                      }}
                    >
                      <span
                        className="inline-block max-w-full truncate rounded-full bg-slate-900/70 px-2 py-1 text-[0.7rem] font-semibold text-white shadow-[0_2px_12px_rgba(15,23,42,0.55)] backdrop-blur"
                        style={{ textShadow: "0 1px 4px rgba(15, 23, 42, 0.75)" }}
                      >
                        {slice.label}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-5 flex flex-col items-center">
                <div className="h-0 w-0 rotate-180 border-l-[16px] border-r-[16px] border-b-[32px] border-l-transparent border-r-transparent border-b-rose-500 drop-shadow-lg" />
              </div>
              <div className="absolute inset-0 -z-10 animate-pulse rounded-full bg-gradient-to-br from-indigo-100 via-slate-50 to-amber-50 opacity-50" />
            </div>

            <div className="mt-6 flex flex-col items-center gap-4">
              <button
                type="button"
                onClick={handleSpin}
                disabled={isSpinning || slices.length < 2}
                className="rounded-xl bg-emerald-500 px-8 py-3 text-base font-semibold text-white shadow-lg transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-300 dark:bg-emerald-500 dark:hover:bg-emerald-400"
              >
                {isSpinning ? "Losuję..." : "Zakręć kołem"}
              </button>

              {winner ? (
                <div className="w-full max-w-md rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-center shadow-sm dark:border-emerald-500/40 dark:bg-emerald-900/20">
                  <p className="text-sm font-medium text-emerald-600 dark:text-emerald-300">Wylosowano:</p>
                  <p className="truncate text-2xl font-bold text-emerald-700 dark:text-emerald-200">{winner.label}</p>
                </div>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Poczekaj na koniec losowania!
                </p>
              )}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
};

export default SpinPage;
