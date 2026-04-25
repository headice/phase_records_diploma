import React, { useContext, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageShell from "./components/layout/PageShell.jsx";
import { AuthContext } from "./context/AuthContext";
import { sanitize, isValidEmail } from "./utils/sanitize";
import "./input.css";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { uid, token } = useParams();
  const isConfirmMode = Boolean(uid && token);
  const { requestPasswordReset, confirmPasswordReset } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [passwords, setPasswords] = useState({ password: "", repeat: "" });
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRequestSubmit = async (event) => {
    event.preventDefault();
    const cleanEmail = sanitize(email);

    if (!isValidEmail(cleanEmail)) {
      setError("Введите корректный email.");
      setStatus("");
      return;
    }

    setLoading(true);
    setError("");
    const result = await requestPasswordReset(cleanEmail);
    setLoading(false);

    if (!result.success) {
      setError(result.error || "Не удалось отправить письмо восстановления.");
      setStatus("");
      return;
    }

    setStatus("Если почта есть в системе, мы отправим ссылку для восстановления.");
  };

  const handleConfirmSubmit = async (event) => {
    event.preventDefault();
    const nextPassword = passwords.password;

    if (!nextPassword || nextPassword.length < 8) {
      setError("Пароль должен быть минимум 8 символов.");
      setStatus("");
      return;
    }

    if (nextPassword !== passwords.repeat) {
      setError("Пароли не совпадают.");
      setStatus("");
      return;
    }

    setLoading(true);
    setError("");
    const result = await confirmPasswordReset({ uid, token, newPassword: nextPassword });
    setLoading(false);

    if (!result.success) {
      setError(result.error || "Не удалось обновить пароль.");
      setStatus("");
      return;
    }

    setPasswords({ password: "", repeat: "" });
    setStatus("Пароль обновлён. Теперь можно войти.");
  };

  return (
    <PageShell>
      <section className="pt-28 pb-20 md:pt-36 flex items-center justify-center min-h-[80vh]">
        <div className="max-w-md w-full mx-auto px-5">
          <div className="space-y-3 mb-8">
            <p className="label-eyebrow">Восстановление</p>
            <h1 className="heading-display text-3xl">
              {isConfirmMode ? "Задайте" : "Верните"}
              <span className="text-gradient"> доступ</span>
            </h1>
            <p className="text-sm text-[var(--color-text-muted)]">
              {isConfirmMode
                ? "Введите новый пароль для аккаунта."
                : "Укажите почту, на которую зарегистрирован аккаунт."}
            </p>
          </div>

          <div className="card glow-accent p-6 sm:p-8">
            <form
              onSubmit={isConfirmMode ? handleConfirmSubmit : handleRequestSubmit}
              className="space-y-4"
              noValidate
            >
              {isConfirmMode ? (
                <>
                  <label className="block">
                    <span className="label-eyebrow block mb-2 text-xs">Новый пароль</span>
                    <input
                      required
                      type="password"
                      value={passwords.password}
                      onChange={(event) => {
                        setPasswords((prev) => ({ ...prev, password: event.target.value }));
                        setError("");
                      }}
                      placeholder="Минимум 8 символов"
                      className="input-field"
                      autoComplete="new-password"
                    />
                  </label>
                  <label className="block">
                    <span className="label-eyebrow block mb-2 text-xs">Повторите пароль</span>
                    <input
                      required
                      type="password"
                      value={passwords.repeat}
                      onChange={(event) => {
                        setPasswords((prev) => ({ ...prev, repeat: event.target.value }));
                        setError("");
                      }}
                      placeholder="Ещё раз новый пароль"
                      className="input-field"
                      autoComplete="new-password"
                    />
                  </label>
                </>
              ) : (
                <label className="block">
                  <span className="label-eyebrow block mb-2 text-xs">Email</span>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setError("");
                    }}
                    placeholder="you@example.com"
                    className="input-field"
                    autoComplete="email"
                  />
                </label>
              )}

              {error && (
                <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                  {error}
                </p>
              )}
              {status && (
                <p className="text-sm text-green-200 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
                  {status}
                </p>
              )}

              <div className="space-y-3 pt-2">
                <button type="submit" disabled={loading} className="btn-primary w-full !rounded-xl">
                  {loading
                    ? "Сохраняем..."
                    : isConfirmMode
                      ? "Обновить пароль"
                      : "Отправить ссылку"}
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="btn-ghost w-full !rounded-xl !py-2.5 !text-xs"
                >
                  Вернуться ко входу
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
