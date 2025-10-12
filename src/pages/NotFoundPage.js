import { Link } from "react-router-dom";

const NotFoundPage = () => (
  <div className="mx-auto flex h-full max-w-lg flex-col items-center justify-center gap-4 py-16 text-center">
    <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100">Nie znaleziono konfiguracji</h1>
    <p className="text-slate-600 dark:text-slate-300">
      Wygląda na to, że wskazane koło fortuny nie istnieje lub wygasło.
    </p>
    <Link
      to="/"
      className="rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white shadow transition hover:bg-indigo-500"
    >
      Wróć na stronę główną
    </Link>
  </div>
);

export default NotFoundPage;
