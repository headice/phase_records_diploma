import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, ShoppingCart as CartIcon, ArrowRight, LogOut, ReceiptText, Save, UserRound } from "lucide-react";
import PageShell from "./components/layout/PageShell.jsx";
import { ShopContext } from "./context/ShopContext";
import { AuthContext } from "./context/AuthContext";
import "./input.css";

const formatDateTime = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function Profile() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout, updateProfile } = useContext(AuthContext);
  const { bookings, cartItems, orders } = useContext(ShopContext);
  const [profileForm, setProfileForm] = useState({
    display_name: "",
    email: "",
    phone: "",
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");

  const total = useMemo(() => cartItems.reduce((s, i) => s + (parseInt(String(i.price).replace(/\D/g, ""), 10) || 0) * i.quantity, 0), [cartItems]);
  const username = user?.display_name || user?.username || "Гость";

  useEffect(() => {
    setProfileForm({
      display_name: user?.display_name || "",
      email: user?.email || "",
      phone: user?.phone || "",
    });
  }, [user]);

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfileForm((current) => ({ ...current, [name]: value }));
    setProfileError("");
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    if (profileSaving) return;

    const payload = {
      display_name: profileForm.display_name.trim(),
      email: profileForm.email.trim(),
      phone: profileForm.phone.trim(),
    };

    if (!payload.email) {
      setProfileError("Укажите почту, чтобы получать чеки и уведомления.");
      return;
    }

    setProfileSaving(true);
    setProfileError("");
    const result = await updateProfile(payload);
    setProfileSaving(false);

    if (!result.success) {
      setProfileError(result.error || "Не удалось сохранить профиль.");
    }
  };

  if (!isAuthenticated) {
    return (
      <PageShell>
        <section className="pt-28 pb-20 flex items-center justify-center min-h-[70vh]">
          <div className="max-w-sm text-center space-y-5 card glow-accent p-8">
            <p className="label-eyebrow">Профиль</p>
            <h1 className="heading-section text-2xl">Нужен вход</h1>
            <p className="text-sm text-[var(--color-text-muted)]">Войдите, чтобы увидеть бронирования и корзину.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => navigate("/login")} className="btn-primary">Войти</button>
              <button onClick={() => navigate("/register")} className="btn-ghost">Регистрация</button>
            </div>
          </div>
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <section className="pt-28 pb-20 md:pt-36">
        <div className="max-w-[1200px] mx-auto px-5 md:px-8 space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <p className="label-eyebrow">Профиль</p>
              <h1 className="heading-display text-3xl">Добро пожаловать, <span className="text-gradient">{username}</span></h1>
            </div>
            <div className="flex gap-3">
              <button onClick={() => navigate("/booking/recording")} className="btn-primary !py-2.5">Новая заявка <ArrowRight size={14} /></button>
              <button onClick={() => { logout(); navigate("/"); }} className="btn-ghost !py-2.5"><LogOut size={14} /> Выйти</button>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit} className="card p-6 space-y-5" noValidate>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-2">
                <UserRound size={16} className="text-[var(--color-accent)]" />
                <p className="label-eyebrow">Данные клиента</p>
              </div>
              <button
                type="submit"
                disabled={profileSaving}
                className="btn-primary !py-2.5 !px-5 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Save size={14} /> {profileSaving ? "Сохраняем..." : "Сохранить"}
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="space-y-2 text-sm">
                <span className="text-[var(--color-text-muted)]">Имя</span>
                <input
                  type="text"
                  name="display_name"
                  value={profileForm.display_name}
                  onChange={handleProfileChange}
                  className="input-field"
                  autoComplete="name"
                  placeholder="Как к вам обращаться"
                  maxLength={150}
                />
              </label>
              <label className="space-y-2 text-sm">
                <span className="text-[var(--color-text-muted)]">Почта</span>
                <input
                  type="email"
                  name="email"
                  value={profileForm.email}
                  onChange={handleProfileChange}
                  className="input-field"
                  autoComplete="email"
                  placeholder="mail@example.com"
                  required
                />
              </label>
              <label className="space-y-2 text-sm">
                <span className="text-[var(--color-text-muted)]">Телефон</span>
                <input
                  type="tel"
                  name="phone"
                  value={profileForm.phone}
                  onChange={handleProfileChange}
                  className="input-field"
                  autoComplete="tel"
                  placeholder="+7 999 000-00-00"
                  maxLength={32}
                />
              </label>
            </div>

            {profileError && (
              <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                {profileError}
              </p>
            )}
          </form>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarDays size={16} className="text-[var(--color-accent)]" />
                  <p className="label-eyebrow">Бронирования</p>
                </div>
                <button onClick={() => navigate("/booking")} className="text-xs text-[var(--color-accent)] hover:underline">Новая бронь</button>
              </div>
              {bookings.length === 0 ? (
                <p className="text-sm text-[var(--color-text-dim)]">Заявки появятся здесь после бронирования.</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-hide">
                  {bookings.map((b) => (
                    <div key={b.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium text-[var(--color-accent)]">{b.serviceTitle || b.serviceId}</span>
                        <span className="text-xs text-[var(--color-text-dim)]">{b.statusLabel || b.status}</span>
                      </div>
                      <p className="text-[var(--color-text-muted)]">{b.date} в {b.time} · {b.duration} ч</p>
                      {b.notes && <p className="text-xs text-[var(--color-text-dim)]">{b.notes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CartIcon size={16} className="text-[var(--color-accent)]" />
                  <p className="label-eyebrow">Корзина</p>
                </div>
                <button onClick={() => navigate("/plugins")} className="text-xs text-[var(--color-accent)] hover:underline">В магазин</button>
              </div>
              {cartItems.length === 0 ? (
                <p className="text-sm text-[var(--color-text-dim)]">Корзина пуста. Добавьте плагины из магазина.</p>
              ) : (
                <>
                  <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-hide">
                    {cartItems.map((item) => (
                      <div key={`${item.type}-${item.id}`} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] flex justify-between text-sm">
                        <div>
                          <p className="label-eyebrow text-[10px]">{item.type}</p>
                          <p className="font-medium">{item.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-[var(--color-accent)]">{item.price}</p>
                          <p className="text-xs text-[var(--color-text-dim)]">×{item.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
                    <span className="text-sm text-[var(--color-text-muted)]">Итого</span>
                    <span className="text-lg font-bold text-[var(--color-accent)]">{total.toLocaleString("ru-RU")} ₽</span>
                  </div>
                  <button onClick={() => navigate("/cart")} className="btn-primary w-full">Перейти в корзину</button>
                </>
              )}
            </div>

            <div className="card p-6 space-y-5 lg:col-span-2">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <ReceiptText size={16} className="text-[var(--color-accent)]" />
                  <p className="label-eyebrow">История заказов</p>
                </div>
                <button onClick={() => navigate("/cart")} className="text-xs text-[var(--color-accent)] hover:underline">
                  Открыть корзину
                </button>
              </div>

              {orders.length === 0 ? (
                <p className="text-sm text-[var(--color-text-dim)]">
                  После оплаты здесь появятся чеки, состав заказа и лицензии для купленных плагинов.
                </p>
              ) : (
                <div className="space-y-4 max-h-[32rem] overflow-y-auto scrollbar-hide">
                  {orders.map((order) => (
                    <div key={order.id} className="rounded-2xl bg-white/[0.02] border border-white/[0.05] p-4 space-y-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold">Заказ #{order.id}</p>
                          <p className="text-xs text-[var(--color-text-dim)]">{formatDateTime(order.createdAt)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="rounded-full border border-[var(--color-accent)]/20 bg-[var(--color-accent-dim)] px-3 py-1 text-xs text-[var(--color-accent-light)]">
                            {order.statusLabel}
                          </span>
                          <span className="text-sm font-semibold text-[var(--color-accent)]">{order.totalLabel}</span>
                        </div>
                      </div>

                      <div className="grid gap-2">
                        {order.items.map((item, index) => (
                          <div key={`${order.id}-${item.type}-${item.productId}-${index}`} className="rounded-xl bg-black/20 border border-white/[0.04] p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="label-eyebrow text-[10px]">{item.typeLabel}</p>
                                <p className="text-sm font-medium">{item.title}</p>
                              </div>
                              <div className="text-right text-xs text-[var(--color-text-dim)]">
                                <p>{item.quantity} шт.</p>
                                <p>{item.priceLabel}</p>
                              </div>
                            </div>
                            {item.licenseCodes.length > 0 && (
                              <div className="mt-3 rounded-lg bg-green-500/10 border border-green-500/20 p-3">
                                <p className="text-[10px] uppercase tracking-[0.12em] text-green-300">Лицензии</p>
                                <div className="mt-2 grid gap-1">
                                  {item.licenseCodes.map((code) => (
                                    <code key={code} className="text-xs text-green-100 break-all">{code}</code>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {order.status === "pending_payment" && order.paymentUrl && (
                        <button
                          onClick={() => window.location.assign(order.paymentUrl)}
                          className="btn-primary !rounded-xl !py-2.5"
                        >
                          Продолжить оплату
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
