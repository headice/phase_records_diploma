import React, { useContext, useState } from "react";
import { Mail, MapPin, ArrowUpRight } from "lucide-react";
import PageShell from "./components/layout/PageShell.jsx";
import PageHero from "./components/ui/PageHero.jsx";
import Reveal from "./components/ui/Reveal.jsx";
import SocialIcon from "./components/SocialIcon.jsx";
import { ShopContext } from "./context/ShopContext";
import { sanitize, isValidContact, canSubmit } from "./utils/sanitize";
import heroContacts from "./img/hero_contatcs_optimized.jpg";
import "./input.css";

const contactChannels = [
  { socialIcon: "vk", label: "VK", value: "vk.com/phase_records999", href: "https://vk.com/phase_records999", note: "Новости, релизы и быстрые сообщения" },
  { socialIcon: "telegram", label: "Telegram", value: "@phase_records999", href: "https://t.me/phase_records999", note: "Быстрее всего отвечаем здесь" },
  { socialIcon: "whatsapp", label: "WhatsApp", value: "+7 (999) 987-65-43", href: "https://wa.me/79999876543", note: "Пн–Вс, 12:00 — 00:00 (MSK+7)" },
  { icon: Mail, label: "E-mail", value: "i_am_headice@mail.ru", href: "mailto:i_am_headice@mail.ru", note: "Для коммерческих предложений" },
  { icon: MapPin, label: "Студия", value: "Владивосток, ул. Алеутская, д.12", href: null, note: "Точный адрес — после брони" },
];

const mapSrc =
  "https://www.openstreetmap.org/export/embed.html?bbox=131.876%2C43.113%2C131.892%2C43.121&layer=mapnik&marker=43.117%2C131.884";

export default function Contacts() {
  const { addRequest } = useContext(ShopContext);
  const [form, setForm] = useState({ name: "", contact: "", message: "" });
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setStatus(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);

    const cleanName = sanitize(form.name);
    const cleanContact = sanitize(form.contact);
    const cleanMessage = sanitize(form.message);

    if (!cleanName || cleanName.length < 2) {
      setStatus({ type: "error", text: "Укажите имя (минимум 2 символа)." });
      return;
    }
    if (!isValidContact(cleanContact)) {
      setStatus({ type: "error", text: "Укажите контакт для связи (минимум 3 символа)." });
      return;
    }
    if (!canSubmit("contact_form", 10000)) {
      setStatus({ type: "error", text: "Подождите немного перед повторной отправкой." });
      return;
    }

    setSubmitting(true);
    try {
      await addRequest({
        name: cleanName.slice(0, 100),
        phone: cleanContact.slice(0, 120),
        message: cleanMessage.slice(0, 1000),
        source: "contact_form",
      });
      setStatus({ type: "success", text: "Заявка отправлена! Мы вернёмся с ответом." });
      setForm({ name: "", contact: "", message: "" });
    } catch {
      setStatus({ type: "error", text: "Не удалось отправить. Попробуйте ещё раз." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell>
      <PageHero
        eyebrow="Контакты студии"
        title="Как с нами"
        titleAccent="связаться?"
        description="Вопросы по релизам, коммерции и сотрудничеству — выберите удобный способ связи."
        backgroundImage={heroContacts}
      >
        <div className="flex flex-wrap gap-3 pt-3">
          <a href="https://t.me/phase_records999" target="_blank" rel="noopener noreferrer" className="btn-primary">
            <SocialIcon name="telegram" size={16} /> Telegram
          </a>
          <a href="https://vk.com/phase_records999" target="_blank" rel="noopener noreferrer" className="btn-ghost">
            <SocialIcon name="vk" size={16} /> VK
          </a>
          <a href="https://wa.me/79999876543" target="_blank" rel="noopener noreferrer" className="btn-ghost">
            <SocialIcon name="whatsapp" size={16} /> WhatsApp
          </a>
        </div>
      </PageHero>

      <div className="max-w-[1400px] mx-auto px-5 md:px-8 py-20 content-auto">
        <div className="grid gap-12 lg:gap-16 lg:grid-cols-[1.1fr_1fr] items-start">
          <div className="space-y-10">
            <Reveal>
              <div className="space-y-3">
                <p className="label-eyebrow">Каналы связи</p>
                <h2 className="heading-section text-2xl">Как удобнее выйти на контакт</h2>
                <p className="text-sm text-[var(--color-text-muted)] max-w-md leading-relaxed">
                  Можно сразу прислать демо или референсы — так быстрее станет понятно, что нужно по звуку.
                </p>
              </div>
            </Reveal>

            <div className="grid gap-4 sm:grid-cols-2">
              {contactChannels.map((ch, i) => (
                <Reveal key={ch.label} delay={i * 0.06}>
                  <div className="card p-5 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[var(--color-accent-dim)] flex items-center justify-center">
                        {ch.socialIcon ? (
                          <SocialIcon name={ch.socialIcon} size={17} className="text-[var(--color-accent)]" />
                        ) : (
                          <ch.icon size={16} className="text-[var(--color-accent)]" />
                        )}
                      </div>
                      <p className="text-xs text-[var(--color-text-dim)] uppercase tracking-wider">{ch.label}</p>
                    </div>
                    {ch.href ? (
                      <a href={ch.href} target={ch.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer"
                        className="block text-sm font-medium hover:text-[var(--color-accent)] transition-colors">
                        {ch.value}
                      </a>
                    ) : (
                      <p className="text-sm font-medium">{ch.value}</p>
                    )}
                    <p className="text-xs text-[var(--color-text-dim)]">{ch.note}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          <Reveal delay={0.15}>
            <div id="contact-form" className="card glow-accent p-6 sm:p-8">
              <p className="label-eyebrow mb-2">Краткая заявка</p>
              <p className="text-sm text-[var(--color-text-muted)] mb-6 leading-relaxed">
                Оставьте контакты и пару строк о задаче — вернёмся с форматом и ближайшими свободными слотами.
              </p>

              <form className="space-y-5" onSubmit={handleSubmit} noValidate>
                <label className="block">
                  <span className="label-eyebrow block mb-2 text-xs">Имя / артист</span>
                  <input
                    type="text" name="name" value={form.name} onChange={handleChange}
                    placeholder="Как к вам обращаться" maxLength={100}
                    className="input-field" autoComplete="name"
                  />
                </label>

                <label className="block">
                  <span className="label-eyebrow block mb-2 text-xs">Контакт</span>
                  <input
                    type="text" name="contact" value={form.contact} onChange={handleChange}
                    placeholder="Телеграм, телефон или e-mail" maxLength={120}
                    className="input-field"
                  />
                </label>

                <label className="block">
                  <span className="label-eyebrow block mb-2 text-xs">Кратко о задаче</span>
                  <textarea
                    rows={4} name="message" value={form.message} onChange={handleChange}
                    placeholder="Запись, сведение, мастеринг, полный цикл..." maxLength={1000}
                    className="input-field resize-none"
                  />
                </label>

                <button type="submit" disabled={submitting} className="btn-primary w-full sm:w-auto">
                  {submitting ? "Отправляю..." : "Отправить"}
                </button>

                {status && (
                  <p className={`text-sm mt-2 px-4 py-3 rounded-xl border ${
                    status.type === "success"
                      ? "text-green-200 bg-green-500/10 border-green-500/20"
                      : "text-red-300 bg-red-500/10 border-red-500/20"
                  }`}>
                    {status.text}
                  </p>
                )}

                <p className="text-xs text-[var(--color-text-dim)] pt-1">
                  Мы не передаём ваши данные третьим лицам.
                </p>
              </form>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.2}>
          <section className="mt-16 overflow-hidden rounded-3xl border border-white/[0.06] bg-[var(--color-bg-card)]">
            <div className="grid gap-0 lg:grid-cols-[0.85fr_1.15fr]">
              <div className="p-6 md:p-8 space-y-4">
                <p className="label-eyebrow">Карта</p>
                <h2 className="heading-section text-2xl">Где нас найти</h2>
                <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                  Студия находится во Владивостоке, район Алеутской. Точный подъезд и время встречи подтверждаем после бронирования.
                </p>
                <a
                  href="https://www.openstreetmap.org/?mlat=43.117&mlon=131.884#map=16/43.117/131.884"
                  target="_blank"
                  rel="noreferrer"
                  className="btn-ghost !rounded-xl !py-2.5 !px-4"
                >
                  Открыть карту <ArrowUpRight size={14} />
                </a>
              </div>
              <iframe
                title="Phase Records на карте"
                src={mapSrc}
                className="h-[320px] w-full border-0 grayscale invert-[0.92] hue-rotate-180 contrast-90 lg:h-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </section>
        </Reveal>
      </div>
    </PageShell>
  );
}
