import { ArrowLeft, Home, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageShell from "./components/layout/PageShell.jsx";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <PageShell>
      <section className="relative overflow-hidden min-h-[80vh] flex items-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(232,118,45,0.12),transparent_42%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_24%)]" />

        <div className="relative z-10 max-w-[1400px] mx-auto w-full px-5 md:px-8 py-28 md:py-36">
          <div className="max-w-4xl">
            <p className="label-eyebrow mb-5">404 / Page Not Found</p>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] items-start">
              <div className="space-y-6">
                <div className="space-y-4">
                  <p className="heading-display text-[clamp(5rem,16vw,10rem)] leading-none text-[var(--color-accent)]/18">
                    404
                  </p>
                  <h1 className="heading-display text-[clamp(2.2rem,5vw,4.5rem)]">
                    Похоже, этот
                    <span className="text-gradient"> трек потерялся</span>
                  </h1>
                  <p className="max-w-2xl text-base md:text-lg text-[var(--color-text-muted)] leading-relaxed">
                    Страница могла быть перемещена, удалена или ссылка просто ведет не туда.
                    Возвращайтесь в рабочие разделы сайта и продолжим оттуда.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="btn-primary"
                  >
                    На главную
                    <Home size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="btn-ghost"
                  >
                    Назад
                    <ArrowLeft size={16} />
                  </button>
                </div>
              </div>

              <aside className="card p-6 md:p-7 space-y-5">
                <div className="flex items-center gap-3 text-[var(--color-accent)]">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-accent-dim)]">
                    <Search size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Быстрые переходы</p>
                    <p className="text-xs text-[var(--color-text-dim)]">Самые полезные разделы сайта</p>
                  </div>
                </div>

                <div className="grid gap-3">
                  {[
                    { label: "Услуги", path: "/services" },
                    { label: "Плагины", path: "/plugins" },
                    { label: "Бронирование", path: "/booking" },
                    { label: "Контакты", path: "/contacts" },
                  ].map((item) => (
                    <button
                      key={item.path}
                      type="button"
                      onClick={() => navigate(item.path)}
                      className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-left text-sm text-[var(--color-text-muted)] transition hover:border-[var(--color-accent)]/30 hover:text-white"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </aside>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
