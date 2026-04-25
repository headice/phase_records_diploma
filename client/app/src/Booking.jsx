import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CalendarDays, Clock, User, MessageSquare, CheckCircle2 } from "lucide-react";
import PageShell from "./components/layout/PageShell.jsx";
import PageHero from "./components/ui/PageHero.jsx";
import Reveal from "./components/ui/Reveal.jsx";
import { ShopContext } from "./context/ShopContext";
import { AuthContext } from "./context/AuthContext";
import heroMicro from "./img/hero_micro.png";
import {
  clearBookingDraft,
  peekBookingDraft,
  storeAuthRedirect,
  storeBookingDraft,
  storePendingAuthAction,
} from "./utils/authFlow";
import { sanitize } from "./utils/sanitize";
import "./input.css";

const DAYS_TO_SHOW = 10;

const getErrorMsg = (err) => {
  const payload = err?.response?.data;
  if (payload?.detail) return payload.detail;
  if (payload?.errors) {
    const firstError = Object.values(payload.errors).find(
      (value) => Array.isArray(value) && value.length
    );
    if (firstError) return firstError[0];
  }
  return "Не удалось сохранить бронь. Проверьте выбранный слот.";
};

const formatDay = (date) =>
  date.toLocaleDateString("ru-RU", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });

const buildDays = () => {
  const today = new Date();
  const days = [];

  for (let i = 0; i < DAYS_TO_SHOW; i += 1) {
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + i);
    days.push({
      iso: nextDate.toISOString().slice(0, 10),
      label: formatDay(nextDate),
    });
  }

  return days;
};

export default function Booking() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { services, getServiceSlots, bookService, isLoading } = useContext(ShopContext);
  const { user, requireAuth } = useContext(AuthContext);

  const [days] = useState(buildDays);
  const [selectedDate, setSelectedDate] = useState(days[0]?.iso || "");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submittedBooking, setSubmittedBooking] = useState(null);
  const [pendingBooking, setPendingBooking] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [form, setForm] = useState({
    clientName: user?.display_name || user?.username || "",
    clientContact: user?.phone || user?.email || "",
    comment: "",
  });

  const selectedService = useMemo(() => {
    if (!services.length) return null;
    const routeService = serviceId ? services.find((item) => item.id === serviceId) : null;
    return routeService || services.find((item) => item.id === "recording") || services[0];
  }, [serviceId, services]);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      clientName: prev.clientName || user?.display_name || user?.username || "",
      clientContact: prev.clientContact || user?.phone || user?.email || "",
    }));
  }, [user]);

  useEffect(() => {
    const draft = peekBookingDraft();
    if (!draft || !selectedService?.id) return;
    if (draft.serviceId && draft.serviceId !== selectedService.id) return;

    if (draft.selectedDate) setSelectedDate(draft.selectedDate);
    if (draft.selectedSlot) setSelectedSlot(draft.selectedSlot);
    if (draft.form) {
      setForm((prev) => ({
        ...prev,
        clientName: draft.form.clientName || prev.clientName,
        clientContact: draft.form.clientContact || prev.clientContact,
        comment: draft.form.comment || prev.comment,
      }));
    }

    clearBookingDraft();
  }, [selectedService?.id]);

  useEffect(() => {
    if (!selectedService?.id || !selectedDate) {
      setSlots([]);
      return;
    }

    let isAlive = true;
    setSlotsLoading(true);
    setSubmitError("");

    getServiceSlots(selectedService.id, selectedDate)
      .then((items) => {
        if (!isAlive) return;
        setSlots(items);
        const preferred = items.find((item) => item.available);
        setSelectedSlot((current) =>
          items.some((item) => item.label === current && item.available)
            ? current
            : preferred?.label || ""
        );
      })
      .catch((error) => {
        if (!isAlive) return;
        setSlots([]);
        setSelectedSlot("");
        setSubmitError(getErrorMsg(error));
      })
      .finally(() => {
        if (isAlive) setSlotsLoading(false);
      });

    return () => {
      isAlive = false;
    };
  }, [getServiceSlots, selectedDate, selectedService]);

  const availableSlots = useMemo(() => slots.filter((item) => item.available), [slots]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setAuthMessage("");
    setSubmitError("");

    if (!requireAuth(() => setAuthMessage("Войдите, чтобы подтвердить бронь."))) {
      if (selectedService?.id) {
        storeAuthRedirect(`/booking/${selectedService.id}`);
        storePendingAuthAction({
          type: "resume_booking",
          serviceId: selectedService.id,
        });
      }
      storeBookingDraft({
        serviceId: selectedService?.id || serviceId || "recording",
        selectedDate,
        selectedSlot,
        form,
      });
      navigate("/login");
      return;
    }

    if (!selectedService?.backendId || !selectedDate || !selectedSlot) {
      setSubmitError("Выберите день и свободный час.");
      return;
    }

    setPendingBooking({
      serviceTitle: selectedService.title,
      slot: selectedSlot,
      date: selectedDate,
      clientName: form.clientName,
      clientContact: form.clientContact,
      payload: {
        serviceBackendId: selectedService.backendId,
        serviceSlug: selectedService.id,
        clientName: sanitize(form.clientName).slice(0, 100),
        clientContact: sanitize(form.clientContact).slice(0, 120),
        scheduledAt: `${selectedDate}T${selectedSlot}`,
        duration: 1,
        notes: sanitize(form.comment).slice(0, 500),
      },
    });
  };

  const confirmPendingBooking = async () => {
    if (!pendingBooking || bookingLoading) return;

    setSubmitError("");
    setBookingLoading(true);
    try {
      const booking = await bookService(pendingBooking.payload);

      clearBookingDraft();
      setSubmittedBooking({
        ...booking,
        serviceTitle: pendingBooking.serviceTitle,
        slot: pendingBooking.slot,
        date: pendingBooking.date,
        clientName: pendingBooking.clientName,
        clientContact: pendingBooking.clientContact,
      });
      setForm((prev) => ({ ...prev, comment: "" }));
      setPendingBooking(null);

      const freshSlots = await getServiceSlots(
        pendingBooking.payload.serviceSlug,
        pendingBooking.date
      );
      setSlots(freshSlots);
      setSelectedSlot(freshSlots.find((item) => item.available)?.label || "");
    } catch (error) {
      setSubmitError(getErrorMsg(error));
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <PageShell>
      <PageHero
        eyebrow="Онлайн-бронь"
        title="Бронирование"
        titleAccent="записи"
        description="Выберите день и свободный час. После отправки бронь сразу появится в вашем кабинете."
        backgroundImage={heroMicro}
      >
        <div className="grid gap-3 sm:grid-cols-3 pt-4 max-w-xl">
          {["Выбираете день", "Смотрите свободные слоты", "Подтверждаете бронь"].map(
            (step, index) => (
              <div key={step} className="card !bg-white/[0.03] p-3">
                <p className="label-eyebrow text-[10px]">Шаг {index + 1}</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">{step}</p>
              </div>
            )
          )}
        </div>
      </PageHero>

      <div className="max-w-[1400px] mx-auto px-5 md:px-8 py-16">
        {authMessage && (
          <p className="mb-6 text-sm text-[var(--color-accent-light)] bg-[var(--color-accent-dim)] border border-[var(--color-accent)]/20 rounded-xl px-4 py-3">
            {authMessage}
          </p>
        )}
        {submitError && (
          <p className="mb-6 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            {submitError}
          </p>
        )}

        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] items-start">
          <Reveal>
            <div className="card p-6 md:p-8 space-y-6">
              <div>
                <p className="label-eyebrow">Календарь студии</p>
                <h2 className="heading-section text-2xl mt-2">Свободные окна</h2>
              </div>

              <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-4">
                <p className="text-xs text-[var(--color-text-dim)] mb-1">Услуга</p>
                <p className="font-medium">{selectedService?.title || "Загрузка..."}</p>
                <div className="flex gap-4 mt-2 text-xs text-[var(--color-text-muted)]">
                  <span>{selectedService?.duration || "Почасово"}</span>
                  <span className="text-[var(--color-accent)]">
                    {selectedService?.priceText || selectedService?.price}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="label-eyebrow text-xs flex items-center gap-1">
                    <CalendarDays size={12} /> День
                  </span>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(event) => setSelectedDate(event.target.value)}
                    className="input-field !w-auto !py-1.5 !px-3 !text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {days.map((day) => (
                    <button
                      key={day.iso}
                      type="button"
                      onClick={() => setSelectedDate(day.iso)}
                      className={`rounded-xl border p-3 text-left transition ${
                        selectedDate === day.iso
                          ? "border-[var(--color-accent)]/40 bg-[var(--color-accent-dim)]"
                          : "border-white/[0.04] bg-white/[0.02] hover:border-white/[0.08]"
                      }`}
                    >
                      <p className="text-[10px] text-[var(--color-text-dim)]">{day.iso}</p>
                      <p className="text-xs font-medium mt-1">{day.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="label-eyebrow text-xs flex items-center gap-1">
                    <Clock size={12} /> Доступные часы
                  </span>
                  <span className="text-xs text-[var(--color-text-dim)]">
                    {slotsLoading ? "Обновляем..." : `${availableSlots.length} свободно`}
                  </span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {slots.map((slot) => (
                    <button
                      key={slot.label}
                      type="button"
                      disabled={!slot.available}
                      onClick={() => setSelectedSlot(slot.label)}
                      className={`rounded-xl border p-3 text-sm font-medium transition ${
                        selectedSlot === slot.label
                          ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-black"
                          : slot.available
                            ? "border-white/[0.04] bg-white/[0.02] hover:border-white/[0.08]"
                            : "border-white/[0.02] bg-white/[0.01] text-[var(--color-text-dim)] cursor-not-allowed"
                      }`}
                    >
                      {slot.label}
                      <span className="block text-[9px] uppercase mt-0.5">
                        {slot.available ? "свободно" : slot.is_taken ? "занято" : "—"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <form onSubmit={handleSubmit} className="card glow-accent p-6 md:p-8 space-y-5">
              <div>
                <p className="label-eyebrow">Детали</p>
                <h2 className="heading-section text-2xl mt-2">Подтвердить бронь</h2>
              </div>

              <label className="block">
                <span className="label-eyebrow block mb-2 text-xs"><User size={10} className="inline mr-1" />Имя / артист</span>
                <input
                  required
                  name="clientName"
                  value={form.clientName}
                  onChange={handleChange}
                  placeholder="Например, Stereone"
                  className="input-field"
                  maxLength={100}
                  autoComplete="name"
                />
              </label>

              <label className="block">
                <span className="label-eyebrow block mb-2 text-xs">Контакт</span>
                <input
                  required
                  name="clientContact"
                  value={form.clientContact}
                  onChange={handleChange}
                  placeholder="Telegram, WhatsApp или телефон"
                  className="input-field"
                  maxLength={120}
                />
              </label>

              <label className="block">
                <span className="label-eyebrow block mb-2 text-xs"><MessageSquare size={10} className="inline mr-1" />Комментарий</span>
                <textarea
                  name="comment"
                  value={form.comment}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Опишите задачу..."
                  className="input-field resize-none"
                  maxLength={500}
                />
              </label>

              <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-4 space-y-2 text-sm">
                <p className="label-eyebrow text-[10px]">Итог</p>
                {[
                  ["Услуга", selectedService?.title || "—"],
                  ["Дата", selectedDate || "—"],
                  ["Время", selectedSlot || "—"],
                  ["Длительность", "1 час"],
                ].map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-[var(--color-text-dim)]">{key}</span>
                    <span className="font-medium">{value}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-2 border-t border-white/[0.04]">
                  <span className="text-[var(--color-text-dim)]">Стоимость</span>
                  <span className="text-lg font-bold text-[var(--color-accent)]">
                    {selectedService?.priceText || selectedService?.price || "—"}
                  </span>
                </div>
              </div>

              <button type="submit" disabled={isLoading || slotsLoading || bookingLoading || !selectedSlot} className="btn-primary w-full !rounded-xl">
                {slotsLoading ? "Обновляем..." : "Подтвердить бронь"}
              </button>
            </form>
          </Reveal>
        </div>
      </div>

      {pendingBooking && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4"
          onClick={(event) => {
            if (event.target === event.currentTarget && !bookingLoading) setPendingBooking(null);
          }}
        >
          <div className="card glow-accent max-w-lg w-full p-6 sm:p-8 space-y-6" style={{ animation: "fadeIn 0.2s ease" }}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-[var(--color-accent-dim)] border border-[var(--color-accent)]/30 flex items-center justify-center shrink-0">
                <CalendarDays size={24} className="text-[var(--color-accent)]" />
              </div>
              <div>
                <p className="label-eyebrow">Подтверждение брони</p>
                <h3 className="heading-section text-xl mt-1">Забронировать это время?</h3>
                <p className="text-sm text-[var(--color-text-muted)] mt-2">
                  Проверьте детали перед созданием записи. После подтверждения слот появится в личном кабинете.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["Услуга", pendingBooking.serviceTitle],
                ["Когда", `${pendingBooking.date} в ${pendingBooking.slot}`],
                ["Клиент", pendingBooking.clientName],
                ["Контакт", pendingBooking.clientContact],
              ].map(([key, value]) => (
                <div key={key} className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-3">
                  <p className="text-[10px] text-[var(--color-text-dim)] uppercase">{key}</p>
                  <p className="text-sm font-medium mt-1">{value || "—"}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={confirmPendingBooking}
                disabled={bookingLoading}
                className="btn-primary !rounded-xl disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {bookingLoading ? "Бронируем..." : "Да, забронировать"}
              </button>
              <button
                onClick={() => setPendingBooking(null)}
                disabled={bookingLoading}
                className="btn-ghost !rounded-xl disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Нет, изменить
              </button>
            </div>
          </div>
        </div>
      )}

      {submittedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4">
          <div className="card glow-accent max-w-lg w-full p-6 sm:p-8 space-y-6" style={{ animation: "fadeIn 0.2s ease" }}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center shrink-0">
                <CheckCircle2 size={24} className="text-green-400" />
              </div>
              <div>
                <p className="label-eyebrow">Бронь создана</p>
                <h3 className="heading-section text-xl mt-1">Время зафиксировано</h3>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["Услуга", submittedBooking.serviceTitle],
                ["Когда", `${submittedBooking.date} в ${submittedBooking.slot}`],
                ["Клиент", submittedBooking.clientName],
                ["Контакт", submittedBooking.clientContact],
              ].map(([key, value]) => (
                <div key={key} className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-3">
                  <p className="text-[10px] text-[var(--color-text-dim)] uppercase">{key}</p>
                  <p className="text-sm font-medium mt-1">{value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => { setSubmittedBooking(null); navigate("/profile"); }} className="btn-primary !rounded-xl">Открыть профиль</button>
              <button onClick={() => setSubmittedBooking(null)} className="btn-ghost !rounded-xl">Остаться</button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
