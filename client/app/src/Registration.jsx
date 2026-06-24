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

export default function Registration() {
  const { register } = useContext(AuthContext);
  const { addToCart } = useContext(ShopContext);
  const [formData, setFormData] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [agree, setAgree] = useState(false);

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
      setError("Аккаунт создан, но не удалось восстановить предыдущее действие.");
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const username = sanitize(formData.username);
    const email = sanitize(formData.email);

    if (!username || username.length < 2) {
      setError("Имя должно быть от 2 символов.");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Введите корректный email.");
      return;
    }
    if (!formData.password || formData.password.length < 8) {
      setError("Пароль должен быть минимум 8 символов.");
      return;
    }

    setLoading(true);
    const result = await register({
      username,
      email,
      password: formData.password,
    });
    setLoading(false);

    if (!result.success) {
      setError(result.error || "Не удалось создать аккаунт.");
      return;
    }

    completeAuthFlow();
  };

  return (
    <PageShell>
      <section className="pt-28 pb-20 md:pt-36 flex items-center justify-center min-h-[80vh]">
        <div className="max-w-md w-full mx-auto px-5">
          <div className="space-y-3 mb-8">
            <p className="label-eyebrow">Регистрация</p>
            <h1 className="heading-display text-3xl">
              Создайте<span className="text-gradient"> аккаунт</span>
            </h1>
            <p className="text-sm text-[var(--color-text-muted)]">
              Для сохранения бронирований и быстрого возврата к проектам.
            </p>
          </div>

          <div className="card glow-accent p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <label className="block">
                <span className="label-eyebrow block mb-2 text-xs">Никнейм</span>
                <input
                  required
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Имя или псевдоним"
                  className="input-field"
                  autoComplete="username"
                />
              </label>
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
                  placeholder="Минимум 8 символов"
                  className="input-field"
                  autoComplete="new-password"
                />
              </label>

              {error && (
                <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                  {error}
                </p>
              )}
              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-2 mt-4">
  <input
    type="checkbox"
    id="agree"
    checked={agree}
    onChange={(e) => setAgree(e.target.checked)}
  />

 <label htmlFor="agree">
  Я согласен с{" "}
  <Link
    to="/privacy"
    className="text-[var(--color-accent)] underline"
  >
    политикой обработки персональных данных
  </Link>
</label>
</div>
                <button type="submit" disabled={!agree} className="btn-primary w-full !rounded-xl">
                  {loading ? "Создаём..." : "Создать аккаунт"}
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="btn-ghost w-full !rounded-xl !py-2.5 !text-xs"
                >
                  Уже есть аккаунт
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
