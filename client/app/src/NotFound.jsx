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
          <div className="mx-auto max-w-3xl text-center">
            <div className="space-y-5">
              <p className="heading-display text-[clamp(5rem,16vw,10rem)] leading-none text-[var(--color-accent)]/18">
                404
              </p>
              <h1 className="heading-display text-[clamp(2.2rem,5vw,4.5rem)]">
                Похоже, этот
                <span className="text-gradient"> трек потерялся</span>
              </h1>
              <p className="mx-auto max-w-2xl text-base md:text-lg text-[var(--color-text-muted)] leading-relaxed">
                Страница могла быть перемещена, удалена или ссылка просто ведет не туда.
                Возвращайтесь на главную и продолжим оттуда.
              </p>
            </div>

            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="btn-primary"
              >
                На главную
              </button>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
