import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import AppFooter from "./components/AppFooter";
import AppHeader from "./components/AppHeader";
import HomePage from "./pages/HomePage";
import BuilderPage from "./pages/BuilderPage";
import SpinPage from "./pages/SpinPage";
import NotFoundPage from "./pages/NotFoundPage";

const getSystemTheme = () => {
  if (typeof window === "undefined" || !window.matchMedia) {
    return "light";
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const getInitialTheme = () => {
  if (typeof window === "undefined") {
    return { mode: "system", applied: "light" };
  }

  const storedMode = localStorage.getItem("themeMode");
  if (storedMode === "dark" || storedMode === "light") {
    return { mode: storedMode, applied: storedMode };
  }
  const storedApplied = localStorage.getItem("theme");
  const systemTheme = getSystemTheme();
  return { mode: "system", applied: storedApplied || systemTheme };
};

const applyThemeMode = (mode) => {
  const validMode = mode === "dark" || mode === "light" ? mode : "system";
  const applied = validMode === "system" ? getSystemTheme() : validMode;
  return { mode: validMode, applied };
};

function App() {
  const [themeState, setThemeState] = useState(getInitialTheme);

  useEffect(() => {
    document.title = "Koło fortuny";
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event) =>
      setThemeState((current) => {
        if (current.mode !== "system") {
          return current;
        }
        const applied = event.matches ? "dark" : "light";
        document.documentElement.classList.toggle("dark", applied === "dark");
        localStorage.setItem("theme", applied);
        return { mode: "system", applied };
      });

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (themeState.applied === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", themeState.applied);
    localStorage.setItem("themeMode", themeState.mode);
  }, [themeState]);

  const setThemeMode = (mode) => setThemeState(applyThemeMode(mode));

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <AppHeader themeMode={themeState.mode} onSelectThemeMode={setThemeMode} />
      <main className="flex-1 px-4 py-8">
        <div className="mx-auto w-full max-w-5xl space-y-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/builder" element={<BuilderPage />} />
            <Route path="/spin/:id" element={<SpinPage />} />
            <Route path="/not-found" element={<NotFoundPage />} />
            <Route path="*" element={<Navigate to="/not-found" replace />} />
          </Routes>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}

export default App;
