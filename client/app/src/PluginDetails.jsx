import { useContext, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import PageShell from "./components/layout/PageShell.jsx";
import Reveal from "./components/ui/Reveal.jsx";
import { ShopContext } from "./context/ShopContext";
import { AuthContext } from "./context/AuthContext";
import { storeAuthRedirect, storePendingAuthAction } from "./utils/authFlow";
import "./input.css";

export default function PluginDetails() {
  const { pluginId } = useParams();
  const { plugins, addToCart } = useContext(ShopContext);
  const { requireAuth } = useContext(AuthContext);
  const navigate = useNavigate();
  const [authMsg, setAuthMsg] = useState("");

  const plugin = plugins.find((item) => item.id === pluginId);

  const handleAddToCart = async () => {
    if (!plugin) return;
    setAuthMsg("");

    if (!requireAuth(() => setAuthMsg("Войдите, чтобы купить."))) {
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

  if (!plugin) {
    return (
      <PageShell>
        <section className="pt-28 pb-20 flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <h1 className="heading-section text-2xl">Плагин не найден</h1>
            <button onClick={() => navigate("/plugins")} className="btn-primary">
              Вернуться
            </button>
          </div>
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <section className="pt-28 pb-20 md:pt-36">
        <div className="max-w-[1200px] mx-auto px-5 md:px-8 space-y-10">
          <button
            onClick={() => navigate("/plugins")}
            className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-white transition-colors"
          >
            <ArrowLeft size={16} /> Все плагины
          </button>

          <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
            <Reveal>
              <div className="space-y-4">
                <p className="label-eyebrow">Плагин</p>
                <h1 className="heading-display text-[clamp(1.75rem,4vw,2.75rem)]">
                  {plugin.name}
                </h1>
                <p className="text-[var(--color-text-muted)] leading-relaxed max-w-2xl">
                  {plugin.description}
                </p>
                <p className="label-eyebrow text-xs">{plugin.categoryLabel}</p>
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
                  <span className="text-[var(--color-text-dim)]">Цена</span>
                  <span className="text-lg font-bold text-[var(--color-accent)]">
                    {plugin.price}
                  </span>
                </div>
                {plugin.oldPrice && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--color-text-dim)]">Старая цена</span>
                    <span className="line-through text-[var(--color-text-dim)]">
                      {plugin.oldPrice}
                    </span>
                  </div>
                )}
                <button onClick={handleAddToCart} className="btn-primary w-full !rounded-xl">
                  <ShoppingCart size={14} /> Добавить в корзину
                </button>
                <button
                  onClick={() => navigate("/plugins")}
                  className="btn-ghost w-full !rounded-xl"
                >
                  Вернуться к списку
                </button>
              </div>
            </Reveal>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Reveal>
              <div className="rounded-2xl overflow-hidden border border-white/[0.04] h-64 lg:h-80 bg-black/50 flex items-center justify-center">
                <img src={plugin.image} alt={plugin.name} className="w-full h-full object-cover" decoding="async" />
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="card p-6 md:p-8 space-y-4">
                <p className="label-eyebrow">Возможности</p>
                <ul className="space-y-3">
                  {plugin.features.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-3 text-sm text-[var(--color-text-muted)]"
                    >
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-[var(--color-text-dim)] pt-2">
                  После покупки получите письмо с ключом активации.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
