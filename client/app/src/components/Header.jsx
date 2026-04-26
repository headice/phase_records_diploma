import React, { useContext, useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Menu, ShoppingCart, User, X, ChevronRight } from "lucide-react";
import Logo from "../img/phase-logo.svg";
import { AuthContext } from "../context/AuthContext";
import { ShopContext } from "../context/ShopContext";

const navItems = [
  { label: "Главная", path: "/" },
  { label: "О студии", path: "/about" },
  { label: "Услуги", path: "/services" },
  { label: "Плагины", path: "/plugins" },
  { label: "Бронирование", path: "/booking/recording" },
  { label: "Контакты", path: "/contacts" },
];

export default function Header() {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useContext(AuthContext);
  const { cartItems } = useContext(ShopContext);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const cartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),
    [cartItems]
  );
  const cartCountLabel = cartCount > 99 ? "99+" : String(cartCount);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const guardedNavigate = (path) => {
    if (path === "/profile" && !isAuthenticated) {
      navigate("/login");
    } else {
      navigate(path);
    }
    setMobileOpen(false);
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 z-50 w-full transition-all duration-500 ${
          scrolled
            ? "bg-[#050505]/95 md:bg-[#050505]/90 md:backdrop-blur-xl border-b border-white/[0.04]"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-5 py-4 md:px-8">
          <button
            type="button"
            className="flex items-center gap-3 group"
            onClick={() => navigate("/")}
            aria-label="Phase Records — на главную"
          >
            <img
              src={Logo}
              alt=""
              className="h-10 w-10 rounded-full object-contain drop-shadow-[0_0_24px_rgba(232,118,45,0.28)] transition-transform group-hover:-translate-y-0.5"
              aria-hidden="true"
            />
            <div className="hidden sm:block">
              <p className="text-sm font-semibold tracking-wide" style={{ fontFamily: "var(--font-display)" }}>
                PHASE<span className="text-[var(--color-accent)]"> RECORDS</span>
              </p>
            </div>
          </button>

          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                    isActive
                      ? "text-[var(--color-accent)] bg-[var(--color-accent-dim)]"
                      : "text-[var(--color-text-muted)] hover:text-white hover:bg-white/[0.04]"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate("/cart")}
              className="relative p-2.5 rounded-lg text-[var(--color-text-muted)] hover:text-white hover:bg-white/[0.04] transition-colors"
              aria-label={cartCount ? `Корзина, ${cartCount} позиций` : "Корзина"}
            >
              <ShoppingCart size={18} />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 min-w-[18px] h-[18px] rounded-full bg-[var(--color-accent)] px-1 text-center text-[10px] font-bold leading-[18px] text-black shadow-[0_0_18px_rgba(232,118,45,0.55)]">
                  {cartCountLabel}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => guardedNavigate("/profile")}
              className="p-2.5 rounded-lg text-[var(--color-text-muted)] hover:text-white hover:bg-white/[0.04] transition-colors"
              aria-label="Профиль"
            >
              <User size={18} />
            </button>

            {isAuthenticated ? (
              <button
                type="button"
                onClick={logout}
                className="ml-1 px-4 py-2 rounded-lg text-xs font-medium text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors"
              >
                Выйти
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="ml-1 btn-primary !py-2 !px-5 !text-xs"
              >
                Войти
              </button>
            )}
          </div>

          <button
            type="button"
            className="p-2 rounded-lg text-white lg:hidden hover:bg-white/[0.06] transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-[60] bg-[#050505]/98 md:backdrop-blur-2xl lg:hidden"
          style={{ animation: "fadeIn 0.2s ease" }}
        >
          <div className="flex items-center justify-between px-5 py-4">
            <button onClick={() => { navigate("/"); setMobileOpen(false); }} className="flex items-center gap-3">
              <img
                src={Logo}
                alt=""
                className="h-10 w-10 rounded-full object-contain drop-shadow-[0_0_24px_rgba(232,118,45,0.28)]"
              />
              <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)" }}>
                PHASE<span className="text-[var(--color-accent)]"> RECORDS</span>
              </p>
            </button>
            <button
              type="button"
              className="p-2 rounded-lg text-white hover:bg-white/[0.06]"
              onClick={() => setMobileOpen(false)}
              aria-label="Закрыть меню"
            >
              <X size={22} />
            </button>
          </div>

          <nav className="px-5 pt-6 space-y-1">
            {navItems.map((item, i) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between py-4 px-4 rounded-xl text-lg font-medium transition-colors ${
                    isActive
                      ? "text-[var(--color-accent)] bg-[var(--color-accent-dim)]"
                      : "text-white hover:bg-white/[0.04]"
                  }`
                }
                style={{ animation: `slideUp 0.3s ease ${i * 0.04}s both` }}
              >
                <span>{item.label}</span>
                <ChevronRight size={16} className="opacity-30" />
              </NavLink>
            ))}

            <div className="pt-4 space-y-1">
              <button
                onClick={() => guardedNavigate("/cart")}
                className="flex items-center justify-between w-full py-4 px-4 rounded-xl text-lg font-medium text-white hover:bg-white/[0.04]"
              >
                <span>Корзина</span>
                <span className="relative inline-flex">
                  <ShoppingCart size={18} className="opacity-40" />
                  {cartCount > 0 && (
                    <span className="absolute -right-2.5 -top-2.5 min-w-[18px] h-[18px] rounded-full bg-[var(--color-accent)] px-1 text-center text-[10px] font-bold leading-[18px] text-black shadow-[0_0_18px_rgba(232,118,45,0.55)]">
                      {cartCountLabel}
                    </span>
                  )}
                </span>
              </button>
              <button
                onClick={() => guardedNavigate("/profile")}
                className="flex items-center justify-between w-full py-4 px-4 rounded-xl text-lg font-medium text-white hover:bg-white/[0.04]"
              >
                <span>Профиль</span>
                <User size={18} className="opacity-40" />
              </button>
            </div>

            <div className="pt-6 px-4">
              {isAuthenticated ? (
                <button
                  onClick={() => { logout(); setMobileOpen(false); }}
                  className="btn-ghost w-full"
                >
                  Выйти
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => guardedNavigate("/login")} className="btn-primary">Войти</button>
                  <button onClick={() => guardedNavigate("/register")} className="btn-ghost">Регистрация</button>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
