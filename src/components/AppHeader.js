import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, NavLink, useLocation } from "react-router-dom";
import { FiMoon, FiSun, FiGlobe, FiMenu, FiMonitor, FiX } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import logo from "../logo.svg";

const navLinkBase =
  "rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-indigo-100 hover:text-indigo-700 dark:hover:bg-indigo-500/20 dark:hover:text-indigo-200";
const mobileNavLinkBase =
  "block w-full rounded-lg px-3 py-3 text-base font-medium transition";

const AppHeader = ({ themeMode, onSelectThemeMode }) => {
  const { t, i18n } = useTranslation("common");
  const currentLang = i18n.language?.split("-")[0] || "pl";
  const normalizedLang = currentLang === "en" ? "en" : "pl";
  const availableLanguages = [
    { code: "pl", label: t("lang.pl") },
    { code: "en", label: t("lang.en") },
  ];
  const themeOptions = [
    { mode: "light", label: t("header.lightMode"), icon: FiSun },
    { mode: "dark", label: t("header.darkMode"), icon: FiMoon },
    { mode: "system", label: t("header.systemMode"), icon: FiMonitor },
  ];
  const themeIconMap = {
    light: FiSun,
    dark: FiMoon,
    system: FiMonitor,
  };
  const ActiveThemeIcon = themeIconMap[themeMode] || FiSun;
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [isMobileMenuMounted, setIsMobileMenuMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const languageButtonRef = useRef(null);
  const languageMenuRef = useRef(null);
  const themeButtonRef = useRef(null);
  const themeMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    if (!isLanguageMenuOpen) {
      return undefined;
    }

    const handleClickOutside = (event) => {
      if (
        languageMenuRef.current &&
        !languageMenuRef.current.contains(event.target) &&
        languageButtonRef.current &&
        !languageButtonRef.current.contains(event.target)
      ) {
        setIsLanguageMenuOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsLanguageMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isLanguageMenuOpen]);

  const toggleLanguageMenu = () => {
    setIsLanguageMenuOpen((current) => {
      if (!current) {
        setIsThemeMenuOpen(false);
      }
      return !current;
    });
  };

  const handleLanguageSelect = (code) => {
    setIsLanguageMenuOpen(false);
    if (code !== normalizedLang) {
      i18n.changeLanguage(code);
    }
  };

  useEffect(() => {
    if (!isThemeMenuOpen) {
      return undefined;
    }

    const handleClickOutside = (event) => {
      if (
        themeMenuRef.current &&
        !themeMenuRef.current.contains(event.target) &&
        themeButtonRef.current &&
        !themeButtonRef.current.contains(event.target)
      ) {
        setIsThemeMenuOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsThemeMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isThemeMenuOpen]);

  const toggleThemeMenu = () => {
    setIsThemeMenuOpen((current) => {
      if (!current) {
        setIsLanguageMenuOpen(false);
      }
      return !current;
    });
  };

  const handleThemeSelect = (mode) => {
    setIsThemeMenuOpen(false);
    onSelectThemeMode(mode);
  };

  useEffect(() => {
    if (!isMobileMenuMounted) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobileMenuMounted]);

  useEffect(() => {
    if (!isMobileMenuOpen && isMobileMenuMounted) {
      const timeout = setTimeout(() => {
        setIsMobileMenuMounted(false);
      }, 250);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [isMobileMenuOpen, isMobileMenuMounted]);

  useEffect(() => {
    if (isMobileMenuMounted) {
      setIsLanguageMenuOpen(false);
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = previousOverflow;
      };
    }
    return undefined;
  }, [isMobileMenuMounted]);

  useEffect(() => {
    if (isMobileMenuMounted) {
      setIsMobileMenuOpen(false);
    }
    setIsLanguageMenuOpen(false);
    setIsThemeMenuOpen(false);
  }, [location.pathname, isMobileMenuMounted]);

  const openMobileMenu = () => {
    setIsLanguageMenuOpen(false);
    setIsThemeMenuOpen(false);
    setIsMobileMenuMounted(true);
    if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(() => setIsMobileMenuOpen(true));
    } else {
      setIsMobileMenuOpen(true);
    }
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2 text-left">
          <img src={logo} alt={t("app.title")} className="h-8 w-8" />
          <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {t("app.title")}
          </span>
        </Link>
        <nav className="hidden items-center gap-2 lg:flex">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `${navLinkBase} ${isActive ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/30 dark:text-indigo-100" : "text-slate-600 dark:text-slate-300"}`
            }
          >
            {t("navigation.home")}
          </NavLink>
          <NavLink
            to="/builder"
            className={({ isActive }) =>
              `${navLinkBase} ${isActive ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/30 dark:text-indigo-100" : "text-slate-600 dark:text-slate-300"}`
            }
          >
            {t("navigation.builder")}
          </NavLink>
          <div className="relative">
            <button
              type="button"
              ref={languageButtonRef}
              onClick={toggleLanguageMenu}
              aria-haspopup="listbox"
              aria-expanded={isLanguageMenuOpen}
              aria-label={t("header.toggleLanguage")}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow transition hover:bg-indigo-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <FiGlobe className="h-4 w-4" aria-hidden />
              {t(`lang.${normalizedLang}`)}
            </button>
            {isLanguageMenuOpen ? (
              <div
                ref={languageMenuRef}
                className="absolute right-0 mt-2 w-40 rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800"
                role="listbox"
                tabIndex={-1}
              >
                {availableLanguages.map((language) => {
                  const isActive = language.code === normalizedLang;
                  return (
                    <button
                      key={language.code}
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      onClick={() => handleLanguageSelect(language.code)}
                      className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition hover:bg-indigo-50 dark:hover:bg-indigo-500/20 ${
                        isActive
                          ? "font-semibold text-indigo-600 dark:text-indigo-300"
                          : "text-slate-600 dark:text-slate-200"
                      }`}
                    >
                      <span>{language.label}</span>
                      {isActive ? <span aria-hidden>•</span> : null}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
          <div className="relative">
            <button
              type="button"
              ref={themeButtonRef}
              onClick={toggleThemeMenu}
              aria-haspopup="listbox"
              aria-expanded={isThemeMenuOpen}
              aria-label={t("header.toggleTheme")}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow transition hover:bg-indigo-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <ActiveThemeIcon className="h-4 w-4" aria-hidden />
              {t(`header.${themeMode === "system" ? "systemMode" : themeMode === "dark" ? "darkMode" : "lightMode"}`)}
            </button>
            {isThemeMenuOpen ? (
              <div
                ref={themeMenuRef}
                className="absolute right-0 mt-2 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800"
                role="listbox"
                tabIndex={-1}
              >
                {themeOptions.map((option) => {
                  const OptionIcon = option.icon;
                  const isActive = option.mode === themeMode;
                  return (
                    <button
                      key={option.mode}
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      onClick={() => handleThemeSelect(option.mode)}
                      className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition hover:bg-indigo-50 dark:hover:bg-indigo-500/20 ${
                        isActive
                          ? "font-semibold text-indigo-600 dark:text-indigo-300"
                          : "text-slate-600 dark:text-slate-200"
                      }`}
                    >
                      <span className="inline-flex items-center gap-2">
                        <OptionIcon className="h-4 w-4" aria-hidden />
                        {option.label}
                      </span>
                      {isActive ? <span aria-hidden>•</span> : null}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        </nav>
        <div className="flex items-center gap-2 lg:hidden">
          <button
            type="button"
            onClick={openMobileMenu}
            aria-label={t("header.openMenu")}
            aria-controls="mobile-navigation"
            aria-expanded={isMobileMenuOpen}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white p-2 text-slate-700 shadow transition hover:bg-indigo-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <FiMenu className="h-5 w-5" />
          </button>
        </div>
      </div>
      {isMobileMenuMounted
        ? createPortal(
            <div className="fixed inset-0 z-[999] lg:hidden" role="dialog" aria-modal="true">
              <div
                className={`absolute inset-0 bg-slate-900/60 transition-opacity duration-300 ${
                  isMobileMenuOpen ? "opacity-100" : "opacity-0"
                }`}
                onClick={closeMobileMenu}
                aria-hidden="true"
              />
              <aside
                ref={mobileMenuRef}
                id="mobile-navigation"
                className={`absolute right-0 top-0 flex h-full w-72 max-w-full transform flex-col border-l border-slate-200 bg-white shadow-xl transition-transform duration-300 ease-out dark:border-slate-800 dark:bg-slate-950 ${
                  isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
                }`}
              >
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 dark:border-slate-700">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t("header.menuTitle")}</span>
                  <button
                    type="button"
                    onClick={closeMobileMenu}
                    aria-label={t("header.closeMenu")}
                    className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 shadow transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    <FiX className="h-5 w-5" />
                  </button>
                </div>
                <nav className="flex flex-col gap-2 px-4 py-4">
                  <NavLink
                    to="/"
                    className={({ isActive }) =>
                      `${mobileNavLinkBase} ${
                        isActive
                          ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/30 dark:text-indigo-100"
                          : "text-slate-600 dark:text-slate-300"
                      }`
                    }
                    onClick={closeMobileMenu}
                  >
                    {t("navigation.home")}
                  </NavLink>
                  <NavLink
                    to="/builder"
                    className={({ isActive }) =>
                      `${mobileNavLinkBase} ${
                        isActive
                          ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/30 dark:text-indigo-100"
                          : "text-slate-600 dark:text-slate-300"
                      }`
                    }
                    onClick={closeMobileMenu}
                  >
                    {t("navigation.builder")}
                  </NavLink>
                </nav>
                <div className="mt-auto space-y-4 border-t border-slate-200 px-4 py-4 dark:border-slate-700">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {t("header.languageLabel")}
                    </span>
                    <div className="mt-3 space-y-2">
                      {availableLanguages.map((language) => {
                        const isActive = language.code === normalizedLang;
                        return (
                          <button
                            key={language.code}
                            type="button"
                            onClick={() => handleLanguageSelect(language.code)}
                            className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition ${
                              isActive
                                ? "border-indigo-300 text-indigo-600 dark:border-indigo-400/60 dark:text-indigo-200"
                                : "border-slate-200 text-slate-600 hover:border-indigo-200 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-200 dark:hover:border-indigo-400"
                            }`}
                          >
                            <span>{language.label}</span>
                            {isActive ? <span aria-hidden>•</span> : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {t("header.themeLabel")}
                </span>
                <div className="mt-3 space-y-2">
                  {themeOptions.map((option) => {
                    const OptionIcon = option.icon;
                    const isActive = option.mode === themeMode;
                    return (
                      <button
                        key={option.mode}
                        type="button"
                        onClick={() => onSelectThemeMode(option.mode)}
                        className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition ${
                          isActive
                            ? "border-indigo-300 text-indigo-600 dark:border-indigo-400/60 dark:text-indigo-200"
                            : "border-slate-200 text-slate-600 hover:border-indigo-200 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-200 dark:hover:border-indigo-400"
                        }`}
                      >
                        <span className="inline-flex items-center gap-2">
                          <OptionIcon className="h-4 w-4" aria-hidden />
                          {option.label}
                        </span>
                        {isActive ? <span aria-hidden>•</span> : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </aside>
        </div>,
        document.body
          )
        : null}
    </header>
  );
};

export default AppHeader;
