import React, { useContext, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Mic,
  Sliders,
  Music,
  Headphones,
  Rocket,
  ArrowRight,
  ShoppingCart,
} from "lucide-react";
import PageShell from "./components/layout/PageShell.jsx";
import PageHero from "./components/ui/PageHero.jsx";
import Reveal from "./components/ui/Reveal.jsx";
import { ShopContext } from "./context/ShopContext";
import { AuthContext } from "./context/AuthContext";
import waveHero from "./img/wave_hero.png";
import servicesHero from "./img/services_hero.png";
import { storeAuthRedirect, storePendingAuthAction } from "./utils/authFlow";
import "./input.css";

const svcIcons = {
  recording: Mic,
  mix: Sliders,
  arrangements: Music,
  fullsong: Headphones,
  promo: Rocket,
};

export default function Shop() {
  const { services, plugins, addToCart } = useContext(ShopContext);
  const { requireAuth } = useContext(AuthContext);
  const [authNotice, setAuthNotice] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const isPluginsRoute = location.pathname === "/plugins";

  const handleServiceBooking = async (serviceId) => {
    setAuthNotice("");

    if (
      !requireAuth(() =>
        setAuthNotice("Войдите, чтобы оформить покупку или бронь.")
      )
    ) {
      if (serviceId === "recording") {
        storeAuthRedirect(`/booking/${serviceId}`);
        storePendingAuthAction({ type: "open_booking", serviceId });
      } else {
        const svc = services.find((item) => item.id === serviceId);
        if (svc) {
          storeAuthRedirect("/cart");
          storePendingAuthAction({
            type: "add_to_cart",
            item: {
              id: svc.id,
              backendId: svc.backendId,
              name: svc.title,
              price: svc.price,
              type: "service",
              tag: svc.subtitle,
            },
          });
        }
      }
      navigate("/login");
      return;
    }

    if (serviceId === "recording") {
      navigate(`/booking/${serviceId}`);
      return;
    }

    const svc = services.find((item) => item.id === serviceId);
    if (!svc) return;

    await addToCart({
      id: svc.id,
      backendId: svc.backendId,
      name: svc.title,
      price: svc.price,
      type: "service",
      tag: svc.subtitle,
    });
    navigate("/cart");
  };

  const handlePluginCart = async (plugin) => {
    setAuthNotice("");

    if (
      !requireAuth(() =>
        setAuthNotice("Авторизуйтесь, чтобы добавить плагины в корзину.")
      )
    ) {
      storeAuthRedirect("/cart");
      storePendingAuthAction({
        type: "add_to_cart",
        item: {
          id: plugin.id,
          backendId: plugin.backendId,
          name: plugin.name,
          price: plugin.price,
          type: "plugin",
          tag: plugin.categoryLabel,
        },
      });
      navigate("/login");
      return;
    }

    await addToCart({
      id: plugin.id,
      backendId: plugin.backendId,
      name: plugin.name,
      price: plugin.price,
      type: "plugin",
      tag: plugin.categoryLabel,
    });
    navigate("/cart");
  };

  return (
    <PageShell>
      <PageHero
        eyebrow={isPluginsRoute ? "Phase Plugins" : "Phase Services"}
        title={
          isPluginsRoute ? "Плагины и наборы," : "Услуги студии,"
        }
        titleAccent={
          isPluginsRoute
            ? "которые мы используем сами"
            : "с которых начинается релиз"
        }
        description={
          isPluginsRoute
            ? "Подборка плагинов и бандлов для наших сессий: синты, обработка и инструменты для микса."
            : "Запись, сведение, продакшн и сессии по времени. Онлайн-бронь работает 24/7."
        }
        backgroundImage={isPluginsRoute ? waveHero : servicesHero}
      >
        {authNotice && (
          <p className="text-sm text-[var(--color-accent-light)] bg-[var(--color-accent-dim)] border border-[var(--color-accent)]/20 rounded-xl px-4 py-3 max-w-md">
            {authNotice}
          </p>
        )}
        <div className="flex flex-wrap gap-3 pt-3">
          <button
            onClick={() => navigate(isPluginsRoute ? "/cart" : "/booking/recording")}
            className="btn-primary"
          >
            {isPluginsRoute ? "Открыть корзину" : "Выбрать слот"}{" "}
            <ArrowRight size={14} />
          </button>
          <button
            onClick={() => navigate(isPluginsRoute ? "/services" : "/plugins")}
            className="btn-ghost"
          >
            {isPluginsRoute ? "Смотреть услуги" : "Смотреть плагины"}
          </button>
        </div>
      </PageHero>

      <div className="max-w-[1400px] mx-auto px-5 md:px-8 py-20 space-y-24 content-auto">
        {!isPluginsRoute && (
        <section id="services-catalog">
          <Reveal>
            <div className="mb-10 space-y-3">
              <p className="label-eyebrow">Услуги студии</p>
              <h2 className="heading-section text-2xl sm:text-3xl">
                Запись, сведение,
                <span className="text-gradient"> продакшн</span>
              </h2>
            </div>
          </Reveal>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {services.map((svc, i) => {
              const Icon = svcIcons[svc.id] || Music;
              return (
                <Reveal key={svc.id} delay={i * 0.06} className="h-full">
                  <div className="card h-full min-h-[230px] p-5 flex flex-col gap-4 group hover:-translate-y-1 transition-transform">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-[var(--color-accent-dim)] flex items-center justify-center">
                        <Icon size={16} className="text-[var(--color-accent)]" />
                      </div>
                      <span className="text-sm font-semibold text-[var(--color-accent)]">
                        {svc.price}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold mb-1">{svc.title}</h3>
                      <p className="text-xs text-[var(--color-text-muted)] leading-relaxed line-clamp-2">
                        {svc.shortDescription}
                      </p>
                    </div>
                    <div className="mt-auto pt-3 flex gap-2">
                      <button
                        onClick={() => navigate(`/services/${svc.id}`)}
                        className="btn-ghost !py-2 !px-4 !text-[11px]"
                      >
                        Подробнее
                      </button>
                      <button
                        onClick={() => handleServiceBooking(svc.id)}
                        className="btn-primary !py-2 !px-4 !text-[11px]"
                      >
                        {svc.id === "recording" ? "Забронировать" : "Купить"}
                      </button>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </section>
        )}

        {isPluginsRoute && (
        <section id="plugins-catalog">
          <Reveal>
            <div className="mb-10 space-y-3">
              <p className="label-eyebrow">Плагины и инструменты</p>
              <h2 className="heading-section text-2xl sm:text-3xl">
                Софт, с которым мы
                <span className="text-gradient"> работаем сами</span>
              </h2>
            </div>
          </Reveal>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {plugins.map((plugin, i) => (
              <Reveal key={plugin.id} delay={i * 0.06} className="h-full">
                <div className="card h-full overflow-hidden flex flex-col group hover:-translate-y-1 transition-transform">
                  <button
                    type="button"
                    onClick={() => navigate(`/plugins/${plugin.id}`)}
                    className="relative h-36 overflow-hidden"
                  >
                    <img
                      src={plugin.image}
                      alt={plugin.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                      decoding="async"
                    />
                    {plugin.discount && (
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[var(--color-accent)] text-black text-[10px] font-bold uppercase">
                        {plugin.discount}
                      </span>
                    )}
                  </button>
                  <div className="flex-1 min-h-[190px] flex flex-col p-4 gap-2">
                    <p className="label-eyebrow text-[10px]">{plugin.categoryLabel}</p>
                    <h3 className="text-sm font-bold uppercase tracking-wide">
                      {plugin.name}
                    </h3>
                    <p className="text-xs text-[var(--color-text-muted)] leading-relaxed line-clamp-2">
                      {plugin.description}
                    </p>
                    <div className="mt-auto pt-3 flex items-center justify-between">
                      <div>
                        <span className="text-base font-semibold text-[var(--color-accent)]">
                          {plugin.price}
                        </span>
                        {plugin.oldPrice && (
                          <span className="text-xs text-[var(--color-text-dim)] line-through ml-2">
                            {plugin.oldPrice}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handlePluginCart(plugin)}
                        className="p-2 rounded-lg bg-[var(--color-accent)] hover:brightness-110 transition"
                        aria-label="В корзину"
                      >
                        <ShoppingCart size={14} className="text-black" />
                      </button>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
        )}
      </div>
    </PageShell>
  );
}
