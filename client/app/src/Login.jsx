import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageShell from "./components/layout/PageShell.jsx";
import { AuthContext } from "./context/AuthContext";
import { ShopContext } from "./context/ShopContext";
import {
  clearAuthFlowState,
  clearPendingAuthAction,
  peekAuthRedirect,
  peekPendingAuthAction,
} from "./utils/authFlow";
import { sanitize, isValidEmail } from "./utils/sanitize";
import "./input.css";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const { addToCart } = useContext(ShopContext);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const completeAuthFlow = async () => {
    const pendingAction = peekPendingAuthAction();
    const redirectPath = peekAuthRedirect() || "/profile";

    try {
      if (pendingAction?.type === "add_to_cart" && pendingAction.item) {
        await addToCart(pendingAction.item);
        clearAuthFlowState();
        navigate("/cart");
        return;
      }

      if (pendingAction?.type === "resume_checkout") {
        clearAuthFlowState();
        navigate("/cart", { state: { openPayment: true } });
        return;
      }

      if (
        pendingAction?.type === "open_booking" ||
        pendingAction?.type === "resume_booking"
      ) {
        clearAuthFlowState();
        navigate(redirectPath);
        return;
      }

      clearPendingAuthAction();
      clearAuthFlowState();
      navigate(redirectPath);
    } catch {
      clearAuthFlowState();
      setError("Вход выполнен, но не удалось восстановить предыдущее действие.");
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const email = sanitize(formData.email);
    if (!isValidEmail(email)) {
      setError("Введите корректный email.");
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      setError("Пароль должен быть минимум 6 символов.");
      return;
    }

    setLoading(true);
    const result = await login({ email, password: formData.password });
    setLoading(false);

    if (!result.success) {
      setError(result.error || "Не удалось войти.");
      return;
    }

    completeAuthFlow();
  };

  return (
    <PageShell>
      <section className="pt-28 pb-20 md:pt-36 flex items-center justify-center min-h-[80vh]">
        <div className="max-w-md w-full mx-auto px-5">
          <div className="space-y-3 mb-8">
            <p className="label-eyebrow">Вход</p>
            <h1 className="heading-display text-3xl">
              Войдите<span className="text-gradient"> в аккаунт</span>
            </h1>
            <p className="text-sm text-[var(--color-text-muted)]">
              Чтобы продолжить бронирования, покупки и работу с профилем.
            </p>
          </div>

          <div className="card glow-accent p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <label className="block">
                <span className="label-eyebrow block mb-2 text-xs">Email</span>
                <input
                  required
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="input-field"
                  autoComplete="email"
                />
              </label>
              <label className="block">
                <span className="label-eyebrow block mb-2 text-xs">Пароль</span>
                <input
                  required
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Минимум 6 символов"
                  className="input-field"
                  autoComplete="current-password"
                />
              </label>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="text-xs text-[var(--color-accent)] hover:underline"
                >
                  Забыли пароль?
                </button>
              </div>

              {error && (
                <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                  {error}
                </p>
              )}
              <div className="space-y-3 pt-2">
                <button type="submit" disabled={loading} className="btn-primary w-full !rounded-xl">
                  {loading ? "Входим..." : "Войти"}
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/register")}
                  className="btn-ghost w-full !rounded-xl !py-2.5 !text-xs"
                >
                  Регистрация
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
