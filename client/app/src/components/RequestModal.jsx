import { useContext, useEffect, useState } from "react";
import { X } from "lucide-react";
import { ShopContext } from "../context/ShopContext";

const MAX_NAME_LENGTH = 100;
const MAX_CONTACT_LENGTH = 120;
const MAX_COMMENT_LENGTH = 1000;

const sanitize = (value) => value.replace(/<[^>]*>/g, "").trim();

const initialForm = { name: "", contact: "", itemTitle: "", comment: "" };

export default function RequestModal({ open, onClose, preset }) {
  const { addRequest } = useContext(ShopContext);
  const [form, setForm] = useState(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm((prev) => ({ ...prev, itemTitle: preset?.title || "" }));
      setSubmitted(false);
      setError("");
    }
  }, [open, preset]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      const onEsc = (e) => { if (e.key === "Escape") onClose(); };
      document.addEventListener("keydown", onEsc);
      return () => { document.body.style.overflow = ""; document.removeEventListener("keydown", onEsc); };
    }
  }, [open, onClose]);

  if (!open) return null;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const cleanName = sanitize(form.name);
    const cleanContact = sanitize(form.contact);

    if (!cleanName || cleanName.length < 2) {
      setError("Укажите имя (минимум 2 символа).");
      return;
    }
    if (!cleanContact || cleanContact.length < 3) {
      setError("Укажите контакт для связи.");
      return;
    }

    setSubmitting(true);
    try {
      await addRequest({
        name: cleanName.slice(0, MAX_NAME_LENGTH),
        contact: cleanContact.slice(0, MAX_CONTACT_LENGTH),
        itemTitle: sanitize(form.itemTitle) || preset?.title,
        itemType: preset?.type || "service",
        comment: sanitize(form.comment).slice(0, MAX_COMMENT_LENGTH),
      });
      setSubmitted(true);
    } catch {
      setError("Не удалось отправить. Попробуйте ещё раз.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4"
      style={{ animation: "fadeIn 0.2s ease" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Форма заявки"
    >
      <div className="relative card glow-accent max-w-lg w-full p-6 sm:p-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-[var(--color-text-dim)] hover:text-white hover:bg-white/[0.06] transition-colors"
          aria-label="Закрыть"
        >
          <X size={18} />
        </button>

        <p className="label-eyebrow mb-2">Заявка</p>
        <h3 className="heading-section text-xl mb-2">Оставить запрос</h3>
        <p className="text-sm text-[var(--color-text-muted)] mb-5">
          Заполните контакты — мы вернёмся с уточнениями и предложим свободное время.
        </p>

        {submitted ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto">
              <span className="text-2xl">✓</span>
            </div>
            <p className="text-sm text-green-200">Заявка отправлена! Мы ответим в ближайшее время.</p>
            <button onClick={onClose} className="btn-ghost !py-2 !px-6 !text-xs">Закрыть</button>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            <label className="block">
              <span className="label-eyebrow mb-2 block text-xs">Имя</span>
              <input
                required name="name" value={form.name} onChange={handleChange}
                maxLength={MAX_NAME_LENGTH} placeholder="Ваше имя или псевдоним"
                className="input-field" autoComplete="name"
              />
            </label>

            <label className="block">
              <span className="label-eyebrow mb-2 block text-xs">Контакт</span>
              <input
                required name="contact" value={form.contact} onChange={handleChange}
                maxLength={MAX_CONTACT_LENGTH} placeholder="Телеграм или телефон"
                className="input-field"
              />
            </label>

            <label className="block">
              <span className="label-eyebrow mb-2 block text-xs">Услуга</span>
              <input
                name="itemTitle" value={form.itemTitle} onChange={handleChange}
                placeholder="Что нужно сделать" className="input-field"
              />
            </label>

            <label className="block">
              <span className="label-eyebrow mb-2 block text-xs">Комментарий</span>
              <textarea
                name="comment" value={form.comment} onChange={handleChange}
                maxLength={MAX_COMMENT_LENGTH} rows={3}
                placeholder="Опишите задачу кратко"
                className="input-field resize-none"
              />
            </label>

            {error && (
              <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                {error}
              </p>
            )}

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button type="submit" disabled={submitting} className="btn-primary !rounded-xl">
                {submitting ? "Отправляю..." : "Отправить"}
              </button>
              <button type="button" onClick={onClose} className="btn-ghost !rounded-xl">
                Закрыть
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
