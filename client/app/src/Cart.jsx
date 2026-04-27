import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Trash2, CreditCard, ShoppingBag, CheckCircle2, Minus, Plus } from "lucide-react";
import PageShell from "./components/layout/PageShell.jsx";
import { ShopContext } from "./context/ShopContext";
import { AuthContext } from "./context/AuthContext";
import { storeAuthRedirect, storePendingAuthAction } from "./utils/authFlow";
import { getApiErrorMessage } from "./utils/apiErrors";
import "./input.css";

export default function Cart() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartItems, updateCartItemQuantity, removeFromCart, clearCart, checkout, confirmOrderPayment } = useContext(ShopContext);
  const { requireAuth, user } = useContext(AuthContext);
  const [checkedOut, setCheckedOut] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [authWarning, setAuthWarning] = useState("");
  const [paymentLink, setPaymentLink] = useState("");
  const [error, setError] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState(null);
  const [paymentSuccessLoading, setPaymentSuccessLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState(null);
  const processedPaymentRef = useRef("");

  const total = useMemo(
    () => cartItems.reduce((sum, item) => sum + (item.priceValue || 0) * item.quantity, 0),
    [cartItems]
  );

  useEffect(() => {
    if (!location.state?.openPayment || cartItems.length === 0) return;
    setShowPayment(true);
    navigate(location.pathname, { replace: true, state: {} });
  }, [cartItems.length, location.pathname, location.state, navigate]);

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const paymentState = query.get("payment");
    if (paymentState !== "success" && paymentState !== "return") return;
    const orderId = query.get("order_id") || "";
    const paymentKey = `${paymentState}:${orderId || "latest"}`;
    const storedPaymentKey = `phase.processedPayment.${paymentKey}`;
    if (processedPaymentRef.current === paymentKey || sessionStorage.getItem(storedPaymentKey)) {
      navigate(location.pathname, { replace: true, state: location.state || {} });
      return;
    }
    processedPaymentRef.current = paymentKey;
    sessionStorage.setItem(storedPaymentKey, "1");
    let cancelled = false;

    const finalizePayment = async () => {
      setPaymentSuccessLoading(false);
      setError("");
      if (!cancelled) {
        setPaymentSuccess({ orderId });
        navigate(location.pathname, { replace: true, state: location.state || {} });
      }
      try {
        if (orderId) {
          confirmOrderPayment(orderId).catch(() => {});
        }
        if (!cancelled) {
          setPaymentSuccess({ orderId });
        }
      } catch (error) {
        if (!cancelled) {
          setError(
            getApiErrorMessage(
              error,
              "Оплата вернула вас на сайт, но не удалось подтвердить заказ и отправить письмо. Попробуйте обновить страницу или свяжитесь с нами."
            )
          );
        }
      } finally {
        if (!cancelled) {
          setPaymentSuccessLoading(false);
          navigate(location.pathname, { replace: true, state: location.state || {} });
        }
      }
    };

    finalizePayment();

    return () => {
      cancelled = true;
    };
  }, [confirmOrderPayment, location.pathname, location.search, location.state, navigate]);

  const handleCheckout = () => {
    setAuthWarning("");
    if (!requireAuth(() => setAuthWarning("Войдите, чтобы перейти к оплате."))) {
      storeAuthRedirect("/cart");
      storePendingAuthAction({ type: "resume_checkout" });
      navigate("/login");
      return;
    }
    setShowPayment(true);
  };

  const confirmPayment = async () => {
    if (checkoutLoading) return;

    setError("");
    setCheckoutLoading(true);
    try {
      const order = await checkout({
        contact_email: user?.email || "client@example.com",
        contact_phone: user?.phone || "",
      });
      setPaymentLink(order.payment_url || "");
      if (order.payment_url) {
        window.location.assign(order.payment_url);
        return;
      }
      setShowPayment(false);
      setCheckedOut(true);
      setTimeout(() => setCheckedOut(false), 4000);
    } catch (error) {
      setError(
        getApiErrorMessage(
          error,
          "Не удалось создать заказ. Попробуйте позже."
        )
      );
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleQuantityChange = async (item, nextQuantity) => {
    if (updatingItemId || nextQuantity < 1 || nextQuantity === item.quantity) return;

    setError("");
    setUpdatingItemId(item.id);
    try {
      await updateCartItemQuantity(item.id, nextQuantity);
    } catch (error) {
      setError(getApiErrorMessage(error, "Не удалось изменить количество товара."));
    } finally {
      setUpdatingItemId(null);
    }
  };

  return (
    <PageShell>
      <section className="pt-28 pb-20 md:pt-36">
        <div className="max-w-[900px] mx-auto px-5 md:px-8 space-y-8">
          <div className="space-y-2">
            <p className="label-eyebrow">Корзина</p>
            <h1 className="heading-display text-3xl">
              Ваши<span className="text-gradient"> покупки</span>
            </h1>
          </div>

          {authWarning && (
            <p className="text-sm text-[var(--color-accent-light)] bg-[var(--color-accent-dim)] border border-[var(--color-accent)]/20 rounded-xl px-4 py-3">
              {authWarning}
            </p>
          )}
          {error && (
            <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              {error}
            </p>
          )}
          {checkedOut && (
            <p className="text-sm text-green-200 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
              Заказ оформлен! {paymentLink ? `Ссылка: ${paymentLink}` : "Мы пришлем инструкцию."}
            </p>
          )}
          {paymentSuccessLoading && (
            <p className="text-sm text-[var(--color-accent-light)] bg-[var(--color-accent-dim)] border border-[var(--color-accent)]/20 rounded-xl px-4 py-3">
              Подтверждаем оплату. Чек и лицензионные коды отправим на почту автоматически.
            </p>
          )}

          {cartItems.length === 0 && !checkedOut && (
            <div className="card p-10 text-center space-y-4">
              <ShoppingBag size={40} className="mx-auto text-[var(--color-text-dim)]" />
              <p className="text-[var(--color-text-muted)]">Пока пусто. Добавьте услуги или плагины.</p>
              <button onClick={() => navigate("/services")} className="btn-primary">
                В магазин
              </button>
            </div>
          )}

          {cartItems.length > 0 && (
            <>
              <div className="space-y-3">
                {cartItems.map((item) => (
                  <div key={`${item.type}-${item.id}`} className="card p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="label-eyebrow text-[10px]">{item.type}</p>
                      <h3 className="text-sm font-semibold break-words">{item.name}</h3>
                      <p className="text-xs text-[var(--color-text-dim)]">{item.tag}</p>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-4 sm:justify-end sm:shrink-0">
                      <div className="flex items-center overflow-hidden rounded-full border border-white/[0.06] bg-white/[0.02]">
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(item, item.quantity - 1)}
                          disabled={updatingItemId === item.id || item.quantity <= 1}
                          className="h-9 w-9 flex items-center justify-center text-[var(--color-text-muted)] hover:bg-white/[0.05] hover:text-white disabled:opacity-35 disabled:cursor-not-allowed"
                          aria-label="Уменьшить количество"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="min-w-10 px-2 text-center text-sm font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(item, item.quantity + 1)}
                          disabled={updatingItemId === item.id}
                          className="h-9 w-9 flex items-center justify-center text-[var(--color-text-muted)] hover:bg-white/[0.05] hover:text-white disabled:opacity-35 disabled:cursor-not-allowed"
                          aria-label="Увеличить количество"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <div className="min-w-[88px] text-right">
                        <p className="text-sm font-semibold text-[var(--color-accent)]">{item.price}</p>
                        <p className="text-xs text-[var(--color-text-dim)]">
                          {(item.priceValue * item.quantity).toLocaleString("ru-RU")} ₽
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        disabled={updatingItemId === item.id}
                        className="p-2 rounded-lg hover:bg-red-500/10 text-[var(--color-text-dim)] hover:text-red-400 transition disabled:opacity-40 disabled:cursor-not-allowed"
                        aria-label="Удалить"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="card p-5 sm:p-6 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-[var(--color-text-muted)]">Предварительная сумма</p>
                  <p className="text-2xl font-bold text-[var(--color-accent)]" style={{ fontFamily: "var(--font-display)" }}>
                    {total.toLocaleString("ru-RU")} ₽
                  </p>
                </div>
                <div className="grid w-full grid-cols-1 gap-3 sm:w-auto sm:grid-cols-2">
                  <button onClick={clearCart} className="btn-ghost w-full !py-2.5 !px-4">
                    Очистить
                  </button>
                  <button onClick={handleCheckout} className="btn-primary w-full !py-2.5 !px-4">
                    <CreditCard size={14} /> Оформить заказ
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {showPayment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4"
          onClick={(event) => {
            if (event.target === event.currentTarget && !checkoutLoading) setShowPayment(false);
          }}
        >
          <div className="card glow-accent max-w-lg w-full p-6 sm:p-8 space-y-5" style={{ animation: "fadeIn 0.2s ease" }}>
            <div>
              <p className="label-eyebrow mb-1">Оплата через ЮKassa</p>
              <h3 className="heading-section text-xl">Переход к оплате</h3>
              <p className="text-sm text-[var(--color-text-muted)] mt-2">После подтверждения перенаправим в ЮKassa.</p>
            </div>

            <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-[var(--color-text-dim)]">Покупатель</span><span className="font-medium">{user?.username || "—"}</span></div>
              <div className="flex justify-between"><span className="text-[var(--color-text-dim)]">E-mail</span><span className="font-medium">{user?.email || "—"}</span></div>
              <div className="flex justify-between"><span className="text-[var(--color-text-dim)]">Телефон</span><span className="font-medium">{user?.phone || "—"}</span></div>
              <div className="flex justify-between"><span className="text-[var(--color-text-dim)]">Сумма</span><span className="font-semibold text-[var(--color-accent)]">{total.toLocaleString("ru-RU")} ₽</span></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={confirmPayment}
                disabled={checkoutLoading}
                className="btn-primary !rounded-xl disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {checkoutLoading ? "Создаём заказ..." : "Перейти к оплате"}
              </button>
              <button
                onClick={() => setShowPayment(false)}
                disabled={checkoutLoading}
                className="btn-ghost !rounded-xl disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Назад
              </button>
            </div>
          </div>
        </div>
      )}

      {paymentSuccess && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) setPaymentSuccess(null);
          }}
        >
          <div
            className="card glow-accent max-w-lg w-full p-6 sm:p-8 space-y-6"
            style={{ animation: "fadeIn 0.2s ease" }}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center shrink-0">
                <CheckCircle2 size={24} className="text-green-400" />
              </div>
              <div>
                <p className="label-eyebrow">Оплата завершена</p>
                <h3 className="heading-section text-xl mt-1">Платеж прошел успешно</h3>
              </div>
            </div>

            <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-4 space-y-2 text-sm">
              <p className="text-[var(--color-text-muted)]">
                Спасибо! Платёж прошёл успешно.
              </p>
              {paymentSuccess.orderId && (
                <div className="flex justify-between pt-2 border-t border-white/[0.04]">
                  <span className="text-[var(--color-text-dim)]">Номер заказа</span>
                  <span className="font-semibold text-[var(--color-accent)]">
                    #{paymentSuccess.orderId}
                  </span>
                </div>
              )}
              <p className="text-xs text-[var(--color-text-dim)]">
                Чек и лицензионные коды для плагинов будут отправлены на указанный e-mail. Детали заказа можно посмотреть в личном кабинете.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setPaymentSuccess(null);
                  navigate("/profile");
                }}
                className="btn-primary !rounded-xl"
              >
                Открыть профиль
              </button>
              <button onClick={() => setPaymentSuccess(null)} className="btn-ghost !rounded-xl">
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
