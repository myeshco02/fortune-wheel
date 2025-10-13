import { FiGithub } from "react-icons/fi";

const AppFooter = () => (
  <footer
    data-app-footer
    className="border-t border-slate-200 bg-white/80 py-6 text-sm text-slate-500 backdrop-blur dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-400"
  >
    <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 sm:flex-row">
      <p>© {new Date().getFullYear()} Mieszko Iwaniec. Wszystkie prawa zastrzeżone.</p>
      <a
        href="https://github.com/myeshco02"
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-indigo-500 dark:hover:text-indigo-300"
      >
        <FiGithub className="h-4 w-4" />
        myeshco02
      </a>
    </div>
  </footer>
);

export default AppFooter;
