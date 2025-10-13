import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const NotFoundPage = () => {
  const { t } = useTranslation("common");

  return (
    <div className="mx-auto flex h-full max-w-lg flex-col items-center justify-center gap-4 py-16 text-center">
      <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100">
        {t("notFound.title")}
      </h1>
      <p className="text-slate-600 dark:text-slate-300">
        {t("notFound.description")}
      </p>
      <Link
        to="/"
        className="rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white shadow transition hover:bg-indigo-500"
      >
        {t("notFound.back")}
      </Link>
    </div>
  );
};

export default NotFoundPage;
