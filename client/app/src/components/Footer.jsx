import React from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../img/phase-logo.svg";
import SocialIcon from "./SocialIcon.jsx";
import { Link } from "react-router-dom";

const footerSections = [
  {
    title: "Услуги",
    links: [
      { label: "Запись вокала", to: "/services/recording" },
      { label: "Сведение и мастеринг", to: "/services/mix" },
      { label: "Аранжировки", to: "/services/arrangements" },
      { label: "Песня под ключ", to: "/services/fullsong" },
      { label: "Продвижение", to: "/services/promo" },
      { label: "Плагины", to: "/plugins" },
    ],
  },
  {
    title: "Студия",
    links: [
      { label: "О нас", to: "/about" },
      { label: "Оборудование", to: "/#equipment" },
      { label: "Портфолио", to: "/#portfolio" },
      { label: "Отзывы", to: "/#reviews" },
      { label: "FAQ", to: "/#faq" },
    ],
  },
  {
    title: "Клиенту",
    links: [
      { label: "Бронирование", to: "/booking/recording" },
      { label: "Корзина", to: "/cart" },
      { label: "Профиль", to: "/profile" },
      { label: "Контакты", to: "/contacts" },
    ],
  },
];

const socials = [
  { label: "VK", href: "https://vk.com/phase_records999", icon: "vk" },
  { label: "Telegram", href: "https://t.me/phase_records999", icon: "telegram" },
  { label: "WhatsApp", href: "https://wa.me/79999876543", icon: "whatsapp" },
];

export default function Footer() {
  const navigate = useNavigate();

  return (
    <footer className="w-full border-t border-white/[0.04] bg-[#030303] text-white mt-auto">
      <div className="border-b border-white/[0.04]">
        <div className="max-w-[1400px] mx-auto px-5 md:px-8 py-16 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="space-y-3 max-w-lg">
            <p className="label-eyebrow">Готовы начать?</p>
            <h2 className="heading-section text-2xl sm:text-3xl">
              Запишите свой следующий
              <span className="text-gradient"> хит с нами</span>
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => navigate("/booking/recording")} className="btn-primary">
              Забронировать время
            </button>
            <button onClick={() => navigate("/contacts")} className="btn-ghost">
              Связаться
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-5 md:px-8 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-2 md:col-span-1 lg:col-span-2 space-y-4">
            <button
              type="button"
              className="flex items-center gap-3 group"
              onClick={() => navigate("/")}
              aria-label="Phase Records - home"
            >
              <img
                src={Logo}
                alt=""
                className="h-10 w-10 rounded-full object-contain drop-shadow-[0_0_24px_rgba(232,118,45,0.28)] transition-transform group-hover:-translate-y-0.5"
                aria-hidden="true"
              />
              <p className="text-sm font-semibold tracking-wide" style={{ fontFamily: "var(--font-display)" }}>
                PHASE<span className="text-[var(--color-accent)]"> RECORDS</span>
              </p>
            </button>
            <p className="text-sm text-[var(--color-text-muted)] max-w-xs leading-relaxed">
              Студия звукозаписи во Владивостоке. Запись, сведение, мастеринг и
              полный продакшн-цикл для артистов и брендов.
            </p>
            <div className="flex gap-2 pt-2">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] text-xs text-[var(--color-text-muted)] hover:text-[var(--color-accent)] hover:border-[var(--color-accent)]/30 transition-colors"
                >
                  <SocialIcon name={s.icon} size={13} />
                  {s.label}
                </a>
              ))}
            </div>
          </div>

          {footerSections.map((section) => (
            <div key={section.title}>
              <p className="label-eyebrow mb-4">{section.title}</p>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <button
                      onClick={() => navigate(link.to)}
                      className="text-sm text-[var(--color-text-muted)] hover:text-white transition-colors"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-white/[0.04] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-xs text-[var(--color-text-dim)]">
            © {new Date().getFullYear()} Phase Records. Все права защищены.
          </p>
          <div className="flex gap-4 text-xs text-[var(--color-text-dim)]">
          <Link
    to="/privacy"
    className="text-[var(--color-accent)] underline hover:text-[var(--color-text-muted)] transition-colors"
  >
    политикой обработки персональных данных
  </Link>
            <span>·</span>
            <span>Владивосток, ул. Алеутская, д.12</span>
          </div>
        </div>
      </div>
    <Footer/>
  );
}
