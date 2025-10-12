import { Link, NavLink } from "react-router-dom";
import { FiMoon, FiSun } from "react-icons/fi";
import logo from "../logo.svg";

const navLinkBase =
  "rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-indigo-100 hover:text-indigo-700 dark:hover:bg-indigo-500/20 dark:hover:text-indigo-200";

const AppHeader = ({ theme, toggleTheme }) => {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2 text-left">
          <img src={logo} alt="Fortune Wheel" className="h-8 w-8" />
          <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Fortune Wheel
          </span>
        </Link>
        <nav className="flex items-center gap-2">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `${navLinkBase} ${isActive ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/30 dark:text-indigo-100" : "text-slate-600 dark:text-slate-300"}`
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/builder"
            className={({ isActive }) =>
              `${navLinkBase} ${isActive ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/30 dark:text-indigo-100" : "text-slate-600 dark:text-slate-300"}`
            }
          >
            Kreator
          </NavLink>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Przełącz tryb kolorów"
            className="rounded-full border border-slate-200 bg-white p-2 text-slate-700 shadow transition hover:bg-indigo-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            {theme === "dark" ? <FiSun className="h-5 w-5" /> : <FiMoon className="h-5 w-5" />}
          </button>
        </nav>
      </div>
    </header>
  );
};

export default AppHeader;
