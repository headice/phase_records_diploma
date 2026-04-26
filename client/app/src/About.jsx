import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mic, Sliders, Music, Headphones, Radio, Podcast } from "lucide-react";
import PageShell from "./components/layout/PageShell.jsx";
import PageHero from "./components/ui/PageHero.jsx";
import Reveal from "./components/ui/Reveal.jsx";
import RequestModal from "./components/RequestModal.jsx";
import heroabout from "./img/hero_about_optimized.jpg";
import engineer1 from "./img/staff1.jpg";
import engineer2 from "./img/staff2.png";
import engineer3 from "./img/staff3jpg.jpg";
import "./input.css";

const whatWeDo = [
  { icon: Mic, text: "Запись вокала и инструментов" },
  { icon: Sliders, text: "Сведение и мастеринг треков и EP" },
  { icon: Music, text: "Аранжировки и битмейкинг" },
  { icon: Headphones, text: "Тюнинг, FX, саунд-дизайн" },
  { icon: Radio, text: "Подготовка релиза к DSP" },
  { icon: Podcast, text: "Запись подкастов и озвучек" },
];

const steps = [
  { num: "01", title: "Заявка и бриф", desc: "Вы присылаете демо и референсы, описываете задачу и ожидания. Мы предлагаем формат, стоимость и сроки." },
  { num: "02", title: "Запись в студии", desc: "Работаем над подачей, дублями, бэками и эмоцией. Если нужно — дорабатываем аранжировку." },
  { num: "03", title: "Сведение и мастеринг", desc: "Формируем баланс, пространство и динамику. Делаем мастер для плейлистов." },
  { num: "04", title: "Готовый релиз", desc: "Вы получаете мастер + версии под DSP. Помогаем с обложкой и загрузкой на площадки." },
];

const team = [
  { name: "METRO BOOMIN", realName: "Лиланд Тайлер Уэйн", role: "Битмейкер, продюсер", photo: engineer1 },
  { name: "LESLIE BRATHWAITE", realName: "Лесли Брэтуэйт", role: "Микс-инженер, звукорежиссер", photo: engineer2 },
  { name: "SKRILLEX", realName: "Сонни Мур", role: "Битмейкер, продюсер, звукоинженер", photo: engineer3 },
];

export default function About() {
  const navigate = useNavigate();
  const [requestOpen, setRequestOpen] = useState(false);

  return (
    <PageShell>
      <PageHero
        eyebrow="О студии"
        title="Место, где треки становятся"
        titleAccent="релизами"
        description="Пространство для артистов, продюсеров и брендов. Помогаем собрать цельное звучание — от первой сессии до выхода трека на площадки."
        backgroundImage={heroabout}
      >
        <div className="flex flex-wrap gap-3 pt-3">
          <button onClick={() => setRequestOpen(true)} className="btn-primary">Оставить заявку</button>
          <button onClick={() => navigate("/services")} className="btn-ghost">Узнать об услугах</button>
        </div>
        <div className="flex gap-8 pt-4">
          {[{ v: "2019", l: "основание" }, { v: "100+", l: "релизов" }, { v: "full cycle", l: "от демо до релиза" }].map((s) => (
            <div key={s.l}>
              <p className="text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>{s.v}</p>
              <p className="text-xs text-[var(--color-text-dim)] mt-0.5">{s.l}</p>
            </div>
          ))}
        </div>
      </PageHero>

      <div className="max-w-[1400px] mx-auto px-5 md:px-8 py-20 space-y-24">
        <section className="grid lg:grid-cols-2 gap-12">
          <Reveal>
            <div className="space-y-5">
              <p className="label-eyebrow">О нас</p>
              <h2 className="heading-section text-2xl sm:text-3xl">
                Кто стоит за<span className="text-gradient"> PHASE RECORDS</span>
              </h2>
              <p className="text-[var(--color-text-muted)] leading-relaxed">
                Мы — команда саунд-инженеров и продюсеров, работающих с артистами
                разных жанров — от рэпа и поп-музыки до альтернативы. Помогаем
                находить собственный звук, формировать почерк и довести
                материал до релизного качества.
              </p>
              <div className="card p-5">
                <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                  В процессе записи мы работаем с подачей, эмоциями, бэками,
                  структурой и деталями, которые делают трек живым и конкурентным.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="space-y-5">
              <p className="label-eyebrow">Каждый день</p>
              <h2 className="heading-section text-2xl sm:text-3xl">
                Что мы<span className="text-gradient"> делаем</span>
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {whatWeDo.map((item, i) => (
                  <div key={i} className="card p-4 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[var(--color-accent-dim)] flex items-center justify-center shrink-0">
                      <item.icon size={14} className="text-[var(--color-accent)]" />
                    </div>
                    <p className="text-sm text-[var(--color-text-muted)]">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </section>

        <section>
          <Reveal>
            <div className="text-center mb-12 space-y-3 max-w-2xl mx-auto">
              <p className="label-eyebrow">Процесс</p>
              <h2 className="heading-section text-2xl sm:text-3xl">
                Как проходит работа<span className="text-gradient"> над треком</span>
              </h2>
              <p className="text-sm text-[var(--color-text-muted)]">
                Чёткая и прозрачная структура помогает артистам чувствовать уверенность на каждом этапе.
              </p>
            </div>
          </Reveal>

          <div className="grid items-stretch sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((step, i) => (
              <Reveal key={step.num} delay={i * 0.08} className="h-full" y={0}>
                <div className="card h-full min-h-[224px] p-6 relative group hover:-translate-y-1 transition-transform">
                  <span className="absolute top-3 right-4 text-5xl font-black text-white/[0.03]" style={{ fontFamily: "var(--font-display)" }}>
                    {step.num}
                  </span>
                  <p className="label-eyebrow mb-3">Шаг {step.num}</p>
                  <h3 className="text-base font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">{step.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section>
          <Reveal>
            <div className="mb-12 space-y-3">
              <p className="label-eyebrow">Команда</p>
              <h2 className="heading-section text-2xl sm:text-3xl">
                Наша<span className="text-gradient"> команда</span>
              </h2>
              <p className="text-sm text-[var(--color-text-muted)] max-w-lg">
                За звуком PHASE RECORDS стоят профессионалы, которые сами живут музыкой и понимают,
                как важно сохранить характер артиста.
              </p>
            </div>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {team.map((member, i) => (
              <Reveal key={member.name} delay={i * 0.08}>
                <article className="card overflow-hidden group hover:-translate-y-1 transition-transform">
                  <div className="w-full h-72 sm:h-80 overflow-hidden">
                    <img
                      src={member.photo}
                      alt={member.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="text-sm font-bold uppercase tracking-wider">{member.name}</h3>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">{member.realName}</p>
                    <p className="text-xs text-[var(--color-text-dim)] mt-2">{member.role}</p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        <Reveal>
          <section className="card glow-accent p-8 md:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div className="space-y-3">
              <p className="label-eyebrow">Начать</p>
              <h2 className="heading-section text-2xl sm:text-3xl">
                Готовы услышать свою идею<span className="text-gradient"> в релизном качестве?</span>
              </h2>
              <p className="text-sm text-[var(--color-text-muted)] max-w-md">
                Напишите нам — подберём формат работы и ближайшие свободные слоты.
              </p>
            </div>
            <div className="flex flex-col gap-3 shrink-0">
              <button onClick={() => setRequestOpen(true)} className="btn-primary">Оставить заявку</button>
              <p className="text-xs text-[var(--color-text-dim)]">Можно приложить демо</p>
            </div>
          </section>
        </Reveal>
      </div>

      <RequestModal open={requestOpen} onClose={() => setRequestOpen(false)} preset={{ type: "service", title: "Консультация" }} />
    </PageShell>
  );
}
