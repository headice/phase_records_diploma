import React, { useContext, useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import {
  Mic, Sliders, Music, Rocket, Clock, Headphones, Play, Pause,
  ChevronDown, ArrowRight, Star, Quote, Volume2, SkipBack, SkipForward
} from "lucide-react";
import "./input.css";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import RequestModal from "./components/RequestModal.jsx";
import { ShopContext } from "./context/ShopContext";
import { AuthContext } from "./context/AuthContext";
import useLiteMotion from "./hooks/useLiteMotion";
import heroImg from "./img/hero_home_optimized.jpg";
import studioImg from "./img/studio_info_display_optimized.jpg";
import vultures2 from "./img/vultures_2.jpg";
import nightsLikeThis from "./img/nights-like-this.jpg";
import sensational from "./img/sensational.jpg";
import allHopeIsGone from "./img/All_Hope_Is_Gone.png";
import boy from "./img/2hollis_boy_album_cover.jpg";
import iAmMusic from "./img/i_am_music.png";
import longLiveAsap from "./img/long_live_asap.jpg";
import heroesVillains from "./img/heroes_and_villians.jpg";
import studioInfo from "./img/pc_studio_info_display_optimized.jpg";
import dawInfo from "./img/dawvst_info_display.jpg";

function Reveal({ children, className = "", delay = 0 }) {
  const ref = useRef(null);
  const liteMotion = useLiteMotion();
  const inView = useInView(ref, { once: true, margin: "-60px" });
  if (liteMotion) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const releases = [
  { id: 1, title: "VULTURES 2", artist: "¥$, Kanye West & Ty Dolla $ign", cover: vultures2, year: "2024", url: "https://www.youtube.com/watch?v=e6fCgEmZLLE" },
  { id: 2, title: "NIGHTS LIKE THIS", artist: "The Kid LAROI", cover: nightsLikeThis, year: "2023", url: "https://www.youtube.com/watch?v=dFr4NU9C0HE" },
  { id: 3, title: "Sensational", artist: "WizTheMc", cover: sensational, year: "2025", url: "https://www.youtube.com/watch?v=7QUkEd5PBH0" },
  { id: 4, title: "All Hope Is Gone", artist: "Slipknot", cover: allHopeIsGone, year: "2008", url: "https://www.youtube.com/watch?v=5abamRO41fE&list=PLvXUqfNLb-tlw1pyu8GYsjIzMe6HYtDSa&index=4" },
  { id: 5, title: "Boy", artist: "2hollis", cover: boy, year: "2024", url: "https://www.youtube.com/watch?v=PwxZQ3CrSvo&list=PL_Id1HN-E85dfOOcWATQBZJL8bPuFx-fU" },
  { id: 6, title: "I AM MUSIC", artist: "Playboi Carti", cover: iAmMusic, year: "2025", url: "https://www.youtube.com/watch?v=flQ0q8clrWw&list=OLAK5uy_kfvO_aIjaCT-nbmjApgekNZavPP-dZV_I" },
  { id: 7, title: "LONG.LIVE.A$AP", artist: "A$AP Rocky", cover: longLiveAsap, year: "2013", url: "https://www.youtube.com/watch?v=C9mquL8JLLM&list=PL8YH4mOwWryX0Q94XlzjkMyDzgBFdspip" },
  { id: 8, title: "Heroes & Villains", artist: "Metro Boomin", cover: heroesVillains, year: "2022", url: "https://www.youtube.com/watch?v=CmSRd6S9Gx4&list=PLxA687tYuMWhYCOhY98pYQipSNmBy-qaB&index=3" },
];

const buildDemoPairs = (tracks) => {
  const pairMap = new Map();

  tracks.forEach((track) => {
    const pairId = track.pairKey || track.pair_key || track.id;
    const pair = pairMap.get(pairId) || { id: pairId, before: null, after: null };
    const type = track.type || track.kind;

    if (type === "before") {
      pair.before = track;
    }
    if (type === "after") {
      pair.after = track;
    }

    pairMap.set(pairId, pair);
  });

  return Array.from(pairMap.values());
};

const steps = [
  { num: "01", title: "Заявка и бриф", desc: "Присылаете демо и референсы. Мы предлагаем формат, стоимость и сроки.", icon: Music },
  { num: "02", title: "Запись в студии", desc: "Работаем над подачей, дублями, бэками и деталями. Дорабатываем аранжировку при необходимости.", icon: Mic },
  { num: "03", title: "Сведение и мастеринг", desc: "Формируем баланс, пространство и динамику. Готовим мастер для плейлистов.", icon: Sliders },
  { num: "04", title: "Готовый релиз", desc: "Получаете мастер и версии под DSP. Помогаем с обложкой и выгрузкой.", icon: Rocket },
];

const equipTabs = [
  {
    id: "studio", label: "Студия", image: studioImg,
    items: ["Конденсаторные и ламповые микрофоны", "Студийные мониторы ближнего поля", "Профессиональные аудиоинтерфейсы", "MIDI-клавиатуры и контроллеры", "Электронная перкуссия и пад-контроллеры", "DJ-оборудование для выступлений"]
  },
  {
    id: "pc", label: "Компьютер", image: studioInfo,
    items: ["Intel XEON 3.0 GHz, 12 ядер / 24 потока", "ОЗУ 32 ГБ", "SSD 2 ТБ + HDD 2 ТБ", "Три монитора до 2560×1080", "Windows 11 + OBS Studio", "xPON до 1 Гбит/с"]
  },
  {
    id: "daw", label: "DAW и VST", image: dawInfo,
    items: ["FL Studio (обновления еженедельно)", "Ableton Live 12", "WAVES Total Bundle", "FabFilter 4 Total Bundle", "Serum 2, Massive, Diva, Spire, Avenger", "NI Kontakt (~500 ГБ библиотека)"]
  },
];

const serviceIcons = { recording: Mic, mix: Sliders, arrangements: Music, fullsong: Headphones, promo: Rocket };

export default function Home() {
  const navigate = useNavigate();
  const liteMotion = useLiteMotion();
  const [requestOpen, setRequestOpen] = useState(false);
  const { services, faq, reviews, plugins, demoTracks: managedDemoTracks, addToCart } = useContext(ShopContext);
  const { requireAuth } = useContext(AuthContext);
  const [activeEquipTab, setActiveEquipTab] = useState("studio");
  const [openFaq, setOpenFaq] = useState(null);

  const audioRef = useRef(null);
  const timelineRef = useRef(null);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioTime, setAudioTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioVolume, setAudioVolume] = useState(0.7);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubTime, setScrubTime] = useState(null);
  const audioTracks = managedDemoTracks || [];
  const hasDemoTracks = audioTracks.length > 0;
  const demoPairs = useMemo(() => buildDemoPairs(audioTracks), [audioTracks]);
  const beforeTracks = useMemo(
    () => demoPairs.map((pair) => pair.before).filter(Boolean),
    [demoPairs]
  );
  const afterTracks = useMemo(
    () => demoPairs.map((pair) => pair.after).filter(Boolean),
    [demoPairs]
  );
  const orderedAudioTracks = useMemo(
    () => demoPairs.flatMap((pair) => [pair.before, pair.after].filter(Boolean)),
    [demoPairs]
  );
  const displayedAudioTime = scrubTime ?? audioTime;
  const timelineProgress = audioDuration
    ? Math.min(100, Math.max(0, (displayedAudioTime / audioDuration) * 100))
    : 0;

  useEffect(() => {
    const a = audioRef.current; if (!a) return;
    const onTime = () => setAudioTime(a.currentTime);
    const onLoad = () => setAudioDuration(a.duration || 0);
    const onEnd = () => setIsPlaying(false);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onLoad);
    a.addEventListener("ended", onEnd);
    return () => { a.removeEventListener("timeupdate", onTime); a.removeEventListener("loadedmetadata", onLoad); a.removeEventListener("ended", onEnd); };
  }, []);

  useEffect(() => { if (audioRef.current) audioRef.current.volume = audioVolume; }, [audioVolume]);

  useEffect(() => {
    if (currentTrack && !audioTracks.some((track) => track.id === currentTrack.id)) {
      audioRef.current?.pause();
      setCurrentTrack(null);
      setIsPlaying(false);
      setAudioTime(0);
      setAudioDuration(0);
      setScrubTime(null);
      setIsScrubbing(false);
    }
  }, [audioTracks, currentTrack]);

  const playTrack = useCallback((track) => {
    if (!track?.src) return;
    if (currentTrack?.id === track.id) {
      if (isPlaying) { audioRef.current?.pause(); setIsPlaying(false); }
      else { audioRef.current?.play().then(() => setIsPlaying(true)).catch(() => {}); }
      return;
    }
    setCurrentTrack(track);
    setAudioTime(0);
    setAudioDuration(0);
    setScrubTime(null);
    setIsScrubbing(false);
    setTimeout(() => {
      audioRef.current?.load();
      audioRef.current?.play().then(() => setIsPlaying(true)).catch(() => {});
    }, 50);
  }, [currentTrack, isPlaying]);

  const playAdjacentTrack = useCallback((direction) => {
    if (!orderedAudioTracks.length) return;

    const currentIndex = currentTrack
      ? orderedAudioTracks.findIndex((track) => track.id === currentTrack.id)
      : -1;
    const fallbackIndex = direction > 0 ? 0 : orderedAudioTracks.length - 1;
    const nextIndex = currentIndex === -1
      ? fallbackIndex
      : (currentIndex + direction + orderedAudioTracks.length) % orderedAudioTracks.length;
    const nextTrack = orderedAudioTracks[nextIndex];

    if (currentTrack?.id === nextTrack.id) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        setAudioTime(0);
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
      return;
    }

    playTrack(nextTrack);
  }, [currentTrack, orderedAudioTracks, playTrack]);

  const getTimelineTime = useCallback((clientX) => {
    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect?.width || !audioDuration) return 0;

    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return ratio * audioDuration;
  }, [audioDuration]);

  const seekTrack = useCallback((value) => {
    const audio = audioRef.current;
    const nextTime = Math.min(audioDuration || 0, Math.max(0, Number(value) || 0));
    if (!audio || !audioDuration) return;

    try {
      if (typeof audio.fastSeek === "function") {
        audio.fastSeek(nextTime);
      } else {
        audio.currentTime = nextTime;
      }
    } catch {
      audio.currentTime = nextTime;
    }

    setAudioTime(nextTime);
    setScrubTime(null);
  }, [audioDuration]);

  const handleTimelinePointerDown = useCallback((event) => {
    if (!currentTrack || !audioDuration) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setIsScrubbing(true);
    setScrubTime(getTimelineTime(event.clientX));
  }, [audioDuration, currentTrack, getTimelineTime]);

  const handleTimelinePointerMove = useCallback((event) => {
    if (!isScrubbing) return;
    setScrubTime(getTimelineTime(event.clientX));
  }, [getTimelineTime, isScrubbing]);

  const handleTimelinePointerUp = useCallback((event) => {
    if (!isScrubbing) return;

    event.currentTarget.releasePointerCapture?.(event.pointerId);
    setIsScrubbing(false);
    seekTrack(getTimelineTime(event.clientX));
  }, [getTimelineTime, isScrubbing, seekTrack]);

  const handleTimelineKeyDown = useCallback((event) => {
    if (!currentTrack || !audioDuration) return;

    const step = event.shiftKey ? 15 : 5;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      seekTrack((scrubTime ?? audioTime) - step);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      seekTrack((scrubTime ?? audioTime) + step);
    }
    if (event.key === "Home") {
      event.preventDefault();
      seekTrack(0);
    }
    if (event.key === "End") {
      event.preventDefault();
      seekTrack(audioDuration);
    }
  }, [audioDuration, audioTime, currentTrack, scrubTime, seekTrack]);

  const formatTime = (s) => {
    if (!s || isNaN(s)) return "0:00";
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  };

  const goToBooking = () => navigate("/booking/recording");
  const scrollToServices = () => {
    const el = document.getElementById("services");
    if (el) el.scrollIntoView({ behavior: "smooth" });
    else navigate("/services");
  };

  const activeEquip = equipTabs.find((t) => t.id === activeEquipTab) || equipTabs[0];
  const renderTrackButton = (track) => (
    <button
      key={track.id}
      onClick={() => playTrack(track)}
      className={`min-h-[56px] w-full min-w-0 max-w-full overflow-hidden flex items-center justify-between gap-3 rounded-xl border p-3 text-left transition sm:min-h-[64px] sm:p-3.5 ${
        currentTrack?.id === track.id
          ? "border-[var(--color-accent)]/40 bg-[var(--color-accent-dim)]"
          : "border-white/[0.04] bg-white/[0.02] hover:border-white/[0.08]"
      }`}
    >
      <span className={`min-w-0 flex-1 overflow-hidden break-words text-sm leading-snug ${currentTrack?.id === track.id ? "text-white font-medium" : "text-[var(--color-text-muted)]"}`}>
        {track.title}
      </span>
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
        currentTrack?.id === track.id ? "bg-[var(--color-accent)]" : "bg-white/[0.04]"
      }`}>
        {currentTrack?.id === track.id && isPlaying
          ? <Pause size={12} className={currentTrack?.id === track.id ? "text-black" : ""} />
          : <Play size={12} className={`ml-0.5 ${currentTrack?.id === track.id ? "text-black" : ""}`} />
        }
      </div>
    </button>
  );

  return (
    <div className="bg-[var(--color-bg)] text-white min-h-screen flex flex-col" style={{ fontFamily: "var(--font-body)" }}>
      <Header />

      <main className="flex-1">
        <section className="relative min-h-[100vh] flex items-center overflow-hidden">
          <div className="absolute inset-0">
            <img
              src={heroImg}
              alt=""
              aria-hidden="true"
              className={`absolute inset-0 h-full w-full object-cover object-center ${liteMotion ? "" : "hero-media-ambient"}`}
              fetchpriority="high"
              loading="eager"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/50" />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg)] via-transparent to-black/40" />
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[var(--color-bg)] to-transparent" />
          </div>

          <div className="pointer-events-none absolute -left-32 top-1/3 w-72 h-72 rounded-full bg-[var(--color-accent)]/8 blur-[120px]" />
          <div className="pointer-events-none absolute right-0 bottom-1/4 w-64 h-64 rounded-full bg-[var(--color-accent)]/6 blur-[100px]" />

          <div className="relative z-10 w-full max-w-[1400px] mx-auto px-5 md:px-8 pt-32 pb-20 lg:pt-40 lg:pb-28">
            <div className="max-w-3xl space-y-8">
              <motion.div initial={liteMotion ? false : { opacity: 0, y: 30 }} animate={liteMotion ? undefined : { opacity: 1, y: 0 }} transition={liteMotion ? undefined : { duration: 0.8, delay: 0.2 }}>
                
              </motion.div>

              <motion.h1
                className="heading-display text-[clamp(2.5rem,6vw,5rem)]"
                initial={liteMotion ? false : { opacity: 0, y: 40 }}
                animate={liteMotion ? undefined : { opacity: 1, y: 0 }}
                transition={liteMotion ? undefined : { duration: 0.9, delay: 0.35 }}
              >
                PHASE RECORDS
                <br />
                <span className="text-gradient">от демо до релиза</span>
              </motion.h1>

              <motion.p
                className="text-lg md:text-xl text-[var(--color-text-muted)] max-w-xl leading-relaxed"
                initial={liteMotion ? false : { opacity: 0, y: 30 }}
                animate={liteMotion ? undefined : { opacity: 1, y: 0 }}
                transition={liteMotion ? undefined : { duration: 0.8, delay: 0.5 }}
              >
                Запись, сведение, мастеринг и авторский продакшн.
                Техническая поддержка на каждом этапе — от первого дубля до стриминговых площадок.
              </motion.p>

              <motion.div
                className="flex flex-wrap gap-3 pt-2"
                initial={liteMotion ? false : { opacity: 0, y: 20 }}
                animate={liteMotion ? undefined : { opacity: 1, y: 0 }}
                transition={liteMotion ? undefined : { duration: 0.7, delay: 0.65 }}
              >
                <button onClick={goToBooking} className="btn-primary">
                  Забронировать время
                  <ArrowRight size={16} />
                </button>
                <button onClick={scrollToServices} className="btn-ghost">
                  Смотреть услуги
                </button>
              </motion.div>

              <motion.div
                className="flex gap-8 pt-6"
                initial={liteMotion ? false : { opacity: 0 }}
                animate={liteMotion ? undefined : { opacity: 1 }}
                transition={liteMotion ? undefined : { duration: 0.6, delay: 0.85 }}
              >
                {[
                  { value: "100+", label: "релизов" },
                  { value: "24/7", label: "онлайн-бронь" },
                  { value: "Hi-End", label: "оборудование" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <p className="text-xl md:text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>{stat.value}</p>
                    <p className="text-xs text-[var(--color-text-dim)] mt-1">{stat.label}</p>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>

          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
            animate={liteMotion ? undefined : { y: [0, 8, 0] }}
            transition={liteMotion ? undefined : { duration: 2, repeat: Infinity }}
          >
            <ChevronDown size={20} className="text-[var(--color-text-dim)]" />
          </motion.div>
        </section>

        <section className="content-auto py-6 border-y border-white/[0.04] overflow-hidden bg-[var(--color-bg-raised)]">
          <div className="flex whitespace-nowrap" style={{ animation: liteMotion ? "none" : "marquee 30s linear infinite" }}>
            {[...Array(2)].map((_, i) => (
              <span key={i} className="text-sm font-medium tracking-wider text-[var(--color-text-dim)] mx-4">
                BUSHIDO ZHO · BLAGO WHITE · FEDUK · FLESH · KYIVSTONER · LOVV66 · MAYOT · OG BUDA · SEEMEE · SODA LUV · YANIX · ЕГОР КРИД · ПЛАТИНА · LIL YACHTY · YN JAY · AZIZI GIBSON ·&nbsp;
              </span>
            ))}
          </div>
        </section>

        <section id="services" className="content-auto py-24 lg:py-32">
          <div className="max-w-[1400px] mx-auto px-5 md:px-8">
            <Reveal>
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-16">
                <div className="space-y-3">
                  <p className="label-eyebrow">Услуги студии</p>
                  <h2 className="heading-section text-3xl sm:text-4xl lg:text-5xl">
                    Полный цикл
                    <span className="text-gradient"> продакшна</span>
                  </h2>
                </div>
                <button onClick={() => navigate("/services")} className="btn-ghost self-start lg:self-auto !text-xs">
                  Все услуги <ArrowRight size={14} />
                </button>
              </div>
            </Reveal>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {services.slice(0, 6).map((service, i) => {
                const Icon = serviceIcons[service.id] || Music;
                return (
                  <Reveal key={service.id} delay={i * 0.08} className="h-full">
                    <div
                      className="card group h-full min-h-[210px] p-6 flex flex-col gap-4 cursor-pointer hover:-translate-y-1"
                      onClick={() => navigate(`/services/${service.id}`)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-xl bg-[var(--color-accent-dim)] flex items-center justify-center">
                          <Icon size={18} className="text-[var(--color-accent)]" />
                        </div>
                        <span className="text-sm font-semibold text-[var(--color-accent)]">{service.price}</span>
                      </div>
                      <div>
                        <h3 className="text-base font-semibold mb-1.5 group-hover:text-[var(--color-accent-light)] transition-colors">
                          {service.title}
                        </h3>
                        <p className="text-sm text-[var(--color-text-muted)] leading-relaxed line-clamp-2">{service.shortDescription}</p>
                      </div>
                      <div className="mt-auto pt-3 flex gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/services/${service.id}`); }}
                          className="text-xs font-medium text-[var(--color-text-muted)] hover:text-white transition-colors"
                        >
                          Подробнее →
                        </button>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        <section className="content-auto py-24 lg:py-32 bg-[var(--color-bg-raised)] relative overflow-hidden">
          <div className="divider-glow absolute top-0 inset-x-0" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[var(--color-accent)]/5 blur-[200px]" />

          <div className="max-w-[1680px] mx-auto px-5 md:px-8 relative z-10">
            <Reveal>
              <div className="text-center mb-16 max-w-2xl mx-auto space-y-3">
                <p className="label-eyebrow">Процесс</p>
                <h2 className="heading-section text-3xl sm:text-4xl">
                  Как проходит работа
                  <span className="text-gradient"> над треком</span>
                </h2>
                <p className="text-[var(--color-text-muted)]">
                  Чёткая и прозрачная структура — от первого контакта до готового релиза.
                </p>
              </div>
            </Reveal>

            <div className="grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((step, i) => (
                <Reveal key={step.num} delay={i * 0.1} className="h-full" y={0}>
                  <div className="card flex h-full min-h-[224px] p-8 relative overflow-hidden group hover:-translate-y-1 lg:h-[224px]">
                    <span className="absolute right-7 top-4 text-[4.5rem] font-black leading-none text-white/[0.035]" style={{ fontFamily: "var(--font-display)" }}>
                      {step.num}
                    </span>
                    <div className="relative z-10 flex max-w-[300px] flex-col items-start justify-start">
                      <p className="label-eyebrow mb-4">Шаг {step.num}</p>
                      <h3 className="mb-4 text-lg font-extrabold leading-tight">{step.title}</h3>
                      <p className="text-base text-[var(--color-text-muted)] leading-7">{step.desc}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="portfolio" className="content-auto py-24 lg:py-32">
          <div className="max-w-[1400px] mx-auto px-5 md:px-8">
            <Reveal>
              <div className="mb-12 space-y-3">
                <p className="label-eyebrow">Портфолио</p>
                <h2 className="heading-section text-3xl sm:text-4xl">
                  Релизы<span className="text-gradient"> студии</span>
                </h2>
                <p className="text-[var(--color-text-muted)] max-w-lg">
                  Часть синглов и альбомов, записанных или сведённых на нашей студии.
                </p>
              </div>
            </Reveal>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
              {releases.map((r, i) => (
                <Reveal key={r.id} delay={i * 0.05}>
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group block rounded-xl overflow-hidden border border-white/[0.04] bg-[var(--color-bg-card)] hover:border-[var(--color-accent)]/30 transition-all hover:-translate-y-1"
                  >
                    <div className="aspect-square overflow-hidden">
                      <img
                        src={r.cover}
                        alt={r.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-semibold truncate">{r.title}</p>
                      <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{r.artist}</p>
                    </div>
                  </a>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="content-auto py-24 lg:py-32 bg-[var(--color-bg-raised)] relative">
          <div className="divider-glow absolute top-0 inset-x-0" />
          <div className="max-w-[1400px] mx-auto px-5 md:px-8">
            <Reveal>
              <div className="mb-12 space-y-3">
                <p className="label-eyebrow">До / После</p>
                <h2 className="heading-section text-3xl sm:text-4xl">
                  Как звучит<span className="text-gradient"> студийное сведение</span>
                </h2>
                <p className="text-[var(--color-text-muted)] max-w-lg">
                  Нажмите на трек — плеер автоматически загрузит фрагмент.
                </p>
              </div>
            </Reveal>

            <div className="card max-w-full overflow-visible md:overflow-hidden p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs text-[var(--color-text-dim)] mb-1">Сейчас играет</p>
                  <p className="max-w-full truncate font-medium">{currentTrack ? currentTrack.title : hasDemoTracks ? "Выберите трек" : "Треки пока не добавлены"}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    disabled={!hasDemoTracks}
                    onClick={() => playAdjacentTrack(-1)}
                    className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Предыдущий трек"
                  >
                    <SkipBack size={14} />
                  </button>
                  <button
                    onClick={() => currentTrack ? playTrack(currentTrack) : audioTracks[0] && playTrack(audioTracks[0])}
                    disabled={!hasDemoTracks}
                    className="w-10 h-10 rounded-full bg-[var(--color-accent)] flex items-center justify-center hover:brightness-110 transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isPlaying ? <Pause size={16} className="text-black" /> : <Play size={16} className="text-black ml-0.5" />}
                  </button>
                  <button
                    disabled={!hasDemoTracks}
                    onClick={() => playAdjacentTrack(1)}
                    className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Следующий трек"
                  >
                    <SkipForward size={14} />
                  </button>
                </div>
              </div>

              <div>
                <div
                  ref={timelineRef}
                  role="slider"
                  tabIndex={currentTrack && audioDuration ? 0 : -1}
                  aria-label="Перемотка трека"
                  aria-valuemin={0}
                  aria-valuemax={Math.floor(audioDuration || 0)}
                  aria-valuenow={Math.floor(displayedAudioTime || 0)}
                  onPointerDown={handleTimelinePointerDown}
                  onPointerMove={handleTimelinePointerMove}
                  onPointerUp={handleTimelinePointerUp}
                  onPointerCancel={() => {
                    setIsScrubbing(false);
                    setScrubTime(null);
                  }}
                  onKeyDown={handleTimelineKeyDown}
                  className={`relative flex h-6 w-full items-center ${
                    currentTrack && audioDuration
                      ? "cursor-pointer"
                      : "cursor-not-allowed opacity-50"
                  }`}
                >
                  <div className="h-1.5 w-full rounded-full bg-white/[0.06]">
                    <div
                      className={`h-full rounded-full bg-[var(--color-accent)] ${isPlaying && !liteMotion ? "audio-progress-live" : ""}`}
                      style={{ width: `${timelineProgress}%` }}
                    />
                  </div>
                  <span
                    className={`absolute h-3 w-3 -translate-x-1/2 rounded-full bg-[var(--color-accent)] ${liteMotion ? "" : "shadow-[0_0_0_4px_rgba(232,118,45,0.12)]"}`}
                    style={{ left: `${timelineProgress}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-[var(--color-text-dim)] mt-1">
                  <span>{formatTime(displayedAudioTime)}</span>
                  <span>{formatTime(audioDuration)}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Volume2 size={14} className="text-[var(--color-text-dim)]" />
                <input
                  type="range" min="0" max="1" step="0.01" value={audioVolume}
                  onChange={(e) => setAudioVolume(parseFloat(e.target.value))}
                  className="w-24 h-1 bg-white/[0.06] rounded-full appearance-none [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--color-accent)] [&::-webkit-slider-thumb]:appearance-none"
                />
                <span className="text-xs text-[var(--color-text-dim)]">{Math.round(audioVolume * 100)}%</span>
              </div>

              <div className="min-w-0 space-y-5">
                {hasDemoTracks && (
                  <div className="space-y-4 md:hidden">
                    <div className="space-y-3">
                      <p className="label-eyebrow">{"\u0414\u043e \u0441\u0432\u0435\u0434\u0435\u043d\u0438\u044f"}</p>
                      {beforeTracks.length > 0 ? (
                        beforeTracks.map(renderTrackButton)
                      ) : (
                        <div className="rounded-xl border border-dashed border-white/[0.04] bg-white/[0.01] px-3.5 py-4 text-xs text-[var(--color-text-dim)]">
                          {"\u0422\u0440\u0435\u043a\u0438 \u0434\u043e \u0441\u0432\u0435\u0434\u0435\u043d\u0438\u044f \u043f\u043e\u043a\u0430 \u043d\u0435 \u0434\u043e\u0431\u0430\u0432\u043b\u0435\u043d\u044b."}
                        </div>
                      )}
                    </div>
                    <div className="space-y-3">
                      <p className="label-eyebrow">{"\u041f\u043e\u0441\u043b\u0435 \u0441\u0432\u0435\u0434\u0435\u043d\u0438\u044f"}</p>
                      {afterTracks.length > 0 ? (
                        afterTracks.map(renderTrackButton)
                      ) : (
                        <div className="rounded-xl border border-dashed border-white/[0.04] bg-white/[0.01] px-3.5 py-4 text-xs text-[var(--color-text-dim)]">
                          {"\u0422\u0440\u0435\u043a\u0438 \u043f\u043e\u0441\u043b\u0435 \u0441\u0432\u0435\u0434\u0435\u043d\u0438\u044f \u043f\u043e\u043a\u0430 \u043d\u0435 \u0434\u043e\u0431\u0430\u0432\u043b\u0435\u043d\u044b."}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div className="hidden md:grid gap-3 md:grid-cols-2">
                  <p className="label-eyebrow">{"\u0414\u043e \u0441\u0432\u0435\u0434\u0435\u043d\u0438\u044f"}</p>
                  <p className="label-eyebrow">{"\u041f\u043e\u0441\u043b\u0435 \u0441\u0432\u0435\u0434\u0435\u043d\u0438\u044f"}</p>
                </div>
                {!hasDemoTracks && (
                  <div className="rounded-xl border border-dashed border-white/[0.06] bg-white/[0.02] p-5 text-sm text-[var(--color-text-muted)]">
                    {"\u0414\u0435\u043c\u043e-\u0442\u0440\u0435\u043a\u0438 \u043f\u043e\u043a\u0430 \u043d\u0435 \u0434\u043e\u0431\u0430\u0432\u043b\u0435\u043d\u044b."}
                  </div>
                )}
                {hasDemoTracks && demoPairs.map((pair) => (
                  <div key={pair.id} className="hidden md:grid min-w-0 gap-3 md:grid-cols-2">
                    {[pair.before, pair.after].map((track, index) => (
                      track ? (
                        renderTrackButton(track)
                      ) : (
                        <div
                          key={`${pair.id}-${index}`}
                          className="flex min-h-[64px] items-center rounded-xl border border-dashed border-white/[0.04] bg-white/[0.01] px-3.5 text-xs text-[var(--color-text-dim)]"
                        >
                          {index === 0 ? "\u041d\u0435\u0442 \u043f\u0430\u0440\u044b \u0434\u043e \u0441\u0432\u0435\u0434\u0435\u043d\u0438\u044f" : "\u041d\u0435\u0442 \u043f\u0430\u0440\u044b \u043f\u043e\u0441\u043b\u0435 \u0441\u0432\u0435\u0434\u0435\u043d\u0438\u044f"}
                        </div>
                      )
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <audio ref={audioRef} src={currentTrack?.src} preload="metadata" style={{ display: "none" }} />
          </div>
        </section>

        <section id="equipment" className="content-auto py-24 lg:py-32">
          <div className="max-w-[1400px] mx-auto px-5 md:px-8">
            <Reveal>
              <div className="mb-12 space-y-3">
                <p className="label-eyebrow">Оборудование</p>
                <h2 className="heading-section text-3xl sm:text-4xl">
                  Техническая<span className="text-gradient"> база студии</span>
                </h2>
              </div>
            </Reveal>

            <div className="flex gap-2 mb-8 flex-wrap">
              {equipTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveEquipTab(tab.id)}
                  className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                    activeEquipTab === tab.id
                      ? "bg-[var(--color-accent)] text-black"
                      : "bg-white/[0.04] text-[var(--color-text-muted)] hover:bg-white/[0.06] border border-white/[0.04]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <div className="rounded-2xl overflow-hidden border border-white/[0.04] h-64 lg:h-[380px]">
                <img
                  src={activeEquip.image}
                  alt={activeEquip.label}
                  className="w-full h-full object-cover transition-all duration-500"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="card p-6 md:p-8 space-y-4">
                <p className="label-eyebrow">{activeEquip.label}</p>
                <ul className="space-y-3">
                  {activeEquip.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-[var(--color-text-muted)]">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {reviews.length > 0 && (
          <section id="reviews" className="content-auto py-24 lg:py-32 bg-[var(--color-bg-raised)]">
            <div className="divider-glow absolute inset-x-0" style={{ top: "auto" }} />
            <div className="max-w-[1400px] mx-auto px-5 md:px-8">
              <Reveal>
                <div className="mb-12 space-y-3">
                  <p className="label-eyebrow">Отзывы</p>
                  <h2 className="heading-section text-3xl sm:text-4xl">
                    Что говорят<span className="text-gradient"> клиенты</span>
                  </h2>
                </div>
              </Reveal>

              <div className="grid gap-4 md:grid-cols-2">
                {reviews.slice(0, 4).map((review, i) => (
                  <Reveal key={review.id} delay={i * 0.08}>
                    <div className="card p-6 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[var(--color-accent-dim)] flex items-center justify-center">
                            <span className="text-sm font-semibold text-[var(--color-accent)]">{review.name?.[0]}</span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{review.name}</p>
                            {review.service?.title && <p className="text-xs text-[var(--color-text-dim)]">{review.service.title}</p>}
                          </div>
                        </div>
                        <div className="flex gap-0.5">
                          {[...Array(review.rating || 0)].map((_, j) => (
                            <Star key={j} size={12} className="fill-[var(--color-accent)] text-[var(--color-accent)]" />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">{review.content}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
        )}

        {faq.length > 0 && (
          <section id="faq" className="content-auto py-24 lg:py-32">
            <div className="max-w-3xl mx-auto px-5 md:px-8">
              <Reveal>
                <div className="text-center mb-12 space-y-3">
                  <p className="label-eyebrow">FAQ</p>
                  <h2 className="heading-section text-3xl sm:text-4xl">
                    Частые<span className="text-gradient"> вопросы</span>
                  </h2>
                </div>
              </Reveal>

              <div className="space-y-3">
                {faq.slice(0, 8).map((item) => (
                  <Reveal key={item.id}>
                    <div className="card overflow-hidden">
                      <button
                        onClick={() => setOpenFaq(openFaq === item.id ? null : item.id)}
                        className="w-full flex items-center justify-between p-5 text-left"
                      >
                        <span className="text-sm font-medium pr-4">{item.question}</span>
                        <ChevronDown
                          size={16}
                          className={`text-[var(--color-accent)] shrink-0 transition-transform duration-300 ${openFaq === item.id ? "rotate-180" : ""}`}
                        />
                      </button>
                      {openFaq === item.id && (
                        <div className="px-5 pb-5" style={{ animation: "slideDown 0.25s ease" }}>
                          <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">{item.answer}</p>
                        </div>
                      )}
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="content-auto py-24 lg:py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-accent)]/10 via-transparent to-[var(--color-accent)]/5" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-[var(--color-accent)]/8 blur-[200px]" />

          <div className="max-w-[1400px] mx-auto px-5 md:px-8 relative z-10">
            <div className="card glow-accent p-10 md:p-16 flex flex-col lg:flex-row items-center justify-between gap-10 text-center lg:text-left">
              <div className="space-y-4 max-w-lg">
                <p className="label-eyebrow">Начните прямо сейчас</p>
                <h2 className="heading-section text-3xl sm:text-4xl">
                  Готовы реализовать
                  <span className="text-gradient"> вашу идею?</span>
                </h2>
                <p className="text-[var(--color-text-muted)]">
                  Напишите нам — подберём формат работы и инженера под задачу.
                  Бесплатный разбор вашего материала.
                </p>
              </div>
              <div className="flex flex-col items-center gap-3">
                <button onClick={() => setRequestOpen(true)} className="btn-primary !px-10 !py-4 !text-sm">
                  Оставить заявку
                  <ArrowRight size={16} />
                </button>
                <p className="text-xs text-[var(--color-text-dim)]">Ответим в течение 2 часов</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <RequestModal
        open={requestOpen}
        onClose={() => setRequestOpen(false)}
        preset={{ type: "service", title: "Консультация" }}
      />

      <Footer />

      <div className="fixed bottom-0 left-0 right-0 z-40 p-3 bg-gradient-to-t from-[var(--color-bg)] via-[var(--color-bg)]/95 to-transparent lg:hidden pointer-events-none">
        <button onClick={goToBooking} className="btn-primary w-full pointer-events-auto !py-3.5">
          Забронировать время
        </button>
      </div>
    </div>
  );
}
