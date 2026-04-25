import { useContext, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Clock, CreditCard } from "lucide-react";
import PageShell from "./components/layout/PageShell.jsx";
import Reveal from "./components/ui/Reveal.jsx";
import { ShopContext } from "./context/ShopContext";
import { AuthContext } from "./context/AuthContext";
import { storeAuthRedirect, storePendingAuthAction } from "./utils/authFlow";
import "./input.css";

export default function ServiceDetails() {
  const { serviceId } = useParams();
  const { services, addToCart } = useContext(ShopContext);
  const { requireAuth } = useContext(AuthContext);
  const navigate = useNavigate();
  const [added, setAdded] = useState(false);
  const [authMsg, setAuthMsg] = useState("");

  const service = services.find((item) => item.id === serviceId);
  const isRecording = service?.id === "recording";

  if (!service) {
    return (
      <PageShell>
        <section className="pt-28 pb-20 flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <h1 className="heading-section text-2xl">Услуга не найдена</h1>
            <button onClick={() => navigate("/services")} className="btn-primary">
              Вернуться
            </button>
          </div>
        </section>
      </PageShell>
    );
  }

  const handleAction = async () => {
    setAuthMsg("");

    if (!requireAuth(() => setAuthMsg("Войдите, чтобы оформить услугу."))) {
      if (isRecording) {
        storeAuthRedirect(`/booking/${service.id}`);
        storePendingAuthAction({ type: "open_booking", serviceId: service.id });
      } else {
        storeAuthRedirect("/cart");
        storePendingAuthAction({
          type: "add_to_cart",
          item: {
            id: service.id,
            backendId: service.backendId,
            name: service.title,
            price: service.price,
            type: "service",
            tag: service.subtitle,
          },
        });
      }
      navigate("/login");
      return;
    }

    if (isRecording) {
      navigate(`/booking/${service.id}`);
      return;
    }

    await addToCart({
      id: service.id,
      backendId: service.backendId,
      name: service.title,
      price: service.price,
      type: "service",
      tag: service.subtitle,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 3000);
  };

  return (
    <PageShell>
      <section className="pt-28 pb-20 md:pt-36">
        <div className="max-w-[1200px] mx-auto px-5 md:px-8 space-y-10">
          <button
            onClick={() => navigate("/services")}
            className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-white transition-colors"
          >
            <ArrowLeft size={16} /> Все услуги
          </button>

          <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
            <Reveal>
              <div className="space-y-5">
                <p className="label-eyebrow">Услуга студии</p>
                <h1 className="heading-display text-[clamp(1.75rem,4vw,2.75rem)]">
                  {service.title}
                </h1>
                <p className="text-[var(--color-text-muted)] leading-relaxed max-w-2xl">
                  {service.fullDescription}
                </p>
                {!isRecording && (
                  <p className="text-xs text-[var(--color-accent-light)] bg-[var(--color-accent-dim)] border border-[var(--color-accent)]/20 rounded-xl px-4 py-3 max-w-lg">
                    Онлайн-бронь доступна для записи вокала. По этой услуге
                    оставьте заявку или добавьте услугу в корзину, а время
                    согласуем отдельно.
                  </p>
                )}
                {authMsg && (
                  <p className="text-sm text-[var(--color-accent-light)] bg-[var(--color-accent-dim)] border border-[var(--color-accent)]/20 rounded-xl px-4 py-3">
                    {authMsg}
                  </p>
                )}
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="card glow-accent p-6 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--color-text-dim)] flex items-center gap-1">
                    <Clock size={14} /> Сроки
                  </span>
                  <span className="font-medium">{service.duration}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--color-text-dim)] flex items-center gap-1">
                    <CreditCard size={14} /> Стоимость
                  </span>
                  <span className="font-semibold text-[var(--color-accent)]">
                    {service.price}
                  </span>
                </div>
                <button onClick={handleAction} className="btn-primary w-full !rounded-xl">
                  {isRecording ? "Забронировать" : added ? "✓ В корзине" : "Купить"}
                </button>
                <button
                  onClick={() => navigate("/services")}
                  className="btn-ghost w-full !rounded-xl"
                >
                  Вернуться к списку
                </button>
              </div>
            </Reveal>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Reveal>
              <div className="rounded-2xl overflow-hidden border border-white/[0.04] h-64 lg:h-80">
                <img src={service.image} alt={service.title} className="w-full h-full object-cover" />
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="card p-6 md:p-8 space-y-4">
                <p className="label-eyebrow">Что входит</p>
                <ul className="space-y-3">
                  {service.includes.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-3 text-sm text-[var(--color-text-muted)]"
                    >
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
