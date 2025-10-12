import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import backgroundImage from "../background-fortune.webp";

const HomePage = () => {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState(null);

  const extractIdFromInput = (value) => {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    try {
      const url = new URL(trimmed);
      const pathSegments = url.pathname.split("/").filter(Boolean);
      const spinIndex = pathSegments.findIndex((segment) => segment === "spin");
      if (spinIndex !== -1 && pathSegments[spinIndex + 1]) {
        return pathSegments[spinIndex + 1];
      }
      return trimmed;
    } catch {
      return trimmed;
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const extractedId = extractIdFromInput(inputValue);
    if (!extractedId) {
      setError("Podaj poprawny link lub ID konfiguracji.");
      return;
    }
    setError(null);
    navigate(`/spin/${extractedId}`);
  };

  return (
    <div
      className="relative isolate flex min-h-[calc(100vh-12rem)] w-full items-center justify-center overflow-hidden rounded-3xl border border-slate-200 text-center shadow-xl dark:border-slate-800"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-white/82 backdrop-blur-[2px] dark:bg-slate-950/75" aria-hidden />
      <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center gap-8 px-6 py-20">
        <div
          className="space-y-4 text-white"
          style={{
            textShadow: "0 10px 24px rgba(0,0,0,0.9), 0 0 10px rgba(0,0,0,0.65)",
          }}
        >
          <h1 className="text-4xl font-bold">Witaj w najlepszym Kole Fortuny!</h1>
          <p className="text-base md:text-lg">
            Stwórz własne koło fortuny, zapisz konfigurację i podziel się nią z innymi.
          </p>
        </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          to="/builder"
          className="rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white shadow transition hover:bg-indigo-500"
        >
          Utwórz koło
        </Link>
      </div>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xl space-y-3 rounded-2xl border border-slate-100 bg-white p-6 text-left shadow-sm dark:border-slate-700 dark:bg-slate-800"
      >
        <label htmlFor="wheel-link" className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          Wklej link lub ID istniejącego koła:
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id="wheel-link"
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            placeholder="https://twoja-strona/spin/abc123"
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-base shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            autoComplete="off"
          />
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-slate-700 dark:bg-indigo-600 dark:hover:bg-indigo-500"
          >
            Otwórz koło
          </button>
        </div>
        {error ? <p className="text-sm text-rose-500">{error}</p> : null}
      </form>
      </div>
    </div>
  );
};

export default HomePage;
