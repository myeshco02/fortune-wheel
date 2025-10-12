import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import AppFooter from "./components/AppFooter";
import AppHeader from "./components/AppHeader";
import HomePage from "./pages/HomePage";
import BuilderPage from "./pages/BuilderPage";
import SpinPage from "./pages/SpinPage";
import NotFoundPage from "./pages/NotFoundPage";

function App() {
  const [theme, setTheme] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("theme") || "light" : "light"
  );

  useEffect(() => {
    document.title = "Koło fortuny";
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((current) => (current === "dark" ? "light" : "dark"));

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <AppHeader theme={theme} toggleTheme={toggleTheme} />
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
