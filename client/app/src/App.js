import "./input.css";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Suspense, lazy, useEffect, useLayoutEffect } from "react";
import { ShopProvider } from "./context/ShopContext";
import { AuthProvider } from "./context/AuthContext";
import PageTransition from "./components/PageTransition.jsx";

const Home = lazy(() => import("./Home.jsx"));
const About = lazy(() => import("./About.jsx"));
const Contacts = lazy(() => import("./Contacts.jsx"));
const Shop = lazy(() => import("./Shop.jsx"));
const Registration = lazy(() => import("./Registration.jsx"));
const Login = lazy(() => import("./Login.jsx"));
const ForgotPassword = lazy(() => import("./ForgotPassword.jsx"));
const Profile = lazy(() => import("./Profile.jsx"));
const Cart = lazy(() => import("./Cart.jsx"));
const Booking = lazy(() => import("./Booking.jsx"));
const ServiceDetails = lazy(() => import("./ServiceDetails.jsx"));
const PluginDetails = lazy(() => import("./PluginDetails.jsx"));
const SITE_NAME = "Phase Records";
const DEFAULT_DESCRIPTION = "Phase Records — студия звукозаписи во Владивостоке. Запись, сведение, мастеринг, аранжировки, онлайн-бронирование и цифровые продукты.";
const DEFAULT_KEYWORDS = "студия звукозаписи, запись вокала, сведение, мастеринг, аранжировка, Phase Records, Владивосток";

const upsertMeta = (selector, attributes) => {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
};

const upsertLink = (selector, attributes) => {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement("link");
    document.head.appendChild(element);
  }
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
};

const getRouteMeta = (pathname) => {
  if (pathname === "/") {
    return {
      title: `${SITE_NAME} — студия звукозаписи`,
      description: "Запись, сведение, мастеринг и продакшн-поддержка релизов. От демо до готового трека.",
    };
  }
  if (pathname === "/about") {
    return {
      title: `О студии — ${SITE_NAME}`,
      description: "Информация о студии звукозаписи Phase Records, команде, процессе работы и технической базе.",
    };
  }
  if (pathname === "/services") {
    return {
      title: `Услуги студии — ${SITE_NAME}`,
      description: "Запись вокала, сведение, мастеринг, аранжировки и продакшн-услуги студии Phase Records.",
    };
  }
  if (pathname === "/plugins") {
    return {
      title: `Плагины и цифровые продукты — ${SITE_NAME}`,
      description: "Каталог плагинов и цифровых продуктов студии Phase Records с возможностью заказа онлайн.",
    };
  }
  if (pathname.startsWith("/services/")) {
    return {
      title: `Услуга студии — ${SITE_NAME}`,
      description: "Подробная информация об услуге студии звукозаписи Phase Records, условиях и стоимости.",
    };
  }
  if (pathname.startsWith("/plugins/")) {
    return {
      title: `Цифровой продукт — ${SITE_NAME}`,
      description: "Подробная страница цифрового продукта студии Phase Records с описанием и возможностью покупки.",
    };
  }
  if (pathname.startsWith("/booking")) {
    return {
      title: `Бронирование — ${SITE_NAME}`,
      description: "Онлайн-бронирование записи в студии Phase Records с выбором услуги, даты и времени.",
    };
  }
  if (pathname === "/cart") {
    return {
      title: `Корзина — ${SITE_NAME}`,
      description: "Оформление заказа выбранных услуг и цифровых продуктов студии Phase Records.",
    };
  }
  if (pathname === "/contacts") {
    return {
      title: `Контакты — ${SITE_NAME}`,
      description: "Контактная информация студии звукозаписи Phase Records, форма обратной связи и карта.",
    };
  }
  if (pathname === "/login") {
    return {
      title: `Вход — ${SITE_NAME}`,
      description: "Вход в личный кабинет пользователя на сайте студии звукозаписи Phase Records.",
    };
  }
  if (pathname === "/register") {
    return {
      title: `Регистрация — ${SITE_NAME}`,
      description: "Создание аккаунта на сайте студии звукозаписи Phase Records для заказов и бронирования.",
    };
  }
  if (pathname === "/forgot-password" || pathname.startsWith("/reset-password/")) {
    return {
      title: `Восстановление пароля — ${SITE_NAME}`,
      description: "Восстановление доступа к личному кабинету пользователя на сайте Phase Records.",
    };
  }
  if (pathname === "/profile") {
    return {
      title: `Личный кабинет — ${SITE_NAME}`,
      description: "Личный кабинет пользователя с заказами, бронированиями и данными профиля.",
    };
  }
  return {
    title: `${SITE_NAME} — студия звукозаписи`,
    description: DEFAULT_DESCRIPTION,
  };
};

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-white flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-2 border-[var(--color-accent)]/30 border-t-[var(--color-accent)] rounded-full animate-spin mx-auto" />
        <p className="text-xs tracking-widest uppercase text-[var(--color-text-dim)]" style={{ fontFamily: "var(--font-mono)" }}>
          Загрузка...
        </p>
      </div>
    </div>
  );
}

function AppRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<LoadingFallback />}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageTransition><Home /></PageTransition>} />
          <Route path="/about" element={<PageTransition><About /></PageTransition>} />
          <Route path="/contacts" element={<PageTransition><Contacts /></PageTransition>} />
          <Route path="/services" element={<PageTransition><Shop /></PageTransition>} />
          <Route path="/plugins" element={<PageTransition><Shop /></PageTransition>} />
          <Route path="/shop" element={<Navigate to="/services" replace />} />
          <Route path="/register" element={<PageTransition><Registration /></PageTransition>} />
          <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
          <Route path="/forgot-password" element={<PageTransition><ForgotPassword /></PageTransition>} />
          <Route path="/reset-password/:uid/:token" element={<PageTransition><ForgotPassword /></PageTransition>} />
          <Route path="/profile" element={<PageTransition><Profile /></PageTransition>} />
          <Route path="/account" element={<Navigate to="/profile" replace />} />
          <Route path="/cart" element={<PageTransition><Cart /></PageTransition>} />
          <Route path="/booking" element={<PageTransition><Booking /></PageTransition>} />
          <Route path="/booking/:serviceId" element={<PageTransition><Booking /></PageTransition>} />
          <Route path="/services/:serviceId" element={<PageTransition><ServiceDetails /></PageTransition>} />
          <Route path="/plugins/:pluginId" element={<PageTransition><PluginDetails /></PageTransition>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
}

function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useLayoutEffect(() => {
    if (hash) {
      return;
    }
    window.scrollTo(0, 0);
  }, [hash, pathname]);

  return null;
}

function ScrollToHash() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      return;
    }

    const targetId = decodeURIComponent(hash.slice(1));
    const scrollToTarget = () => {
      const target = document.getElementById(targetId);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    const timeoutId = window.setTimeout(scrollToTarget, 120);
    return () => window.clearTimeout(timeoutId);
  }, [hash, pathname]);

  return null;
}

function RouteMeta() {
  const { pathname } = useLocation();

  useEffect(() => {
    const { title, description } = getRouteMeta(pathname);
    const currentUrl = `${window.location.origin}${pathname}`;

    document.title = title;
    upsertMeta('meta[name="description"]', { name: "description", content: description });
    upsertMeta('meta[name="keywords"]', { name: "keywords", content: DEFAULT_KEYWORDS });
    upsertMeta('meta[property="og:title"]', { property: "og:title", content: title });
    upsertMeta('meta[property="og:description"]', { property: "og:description", content: description });
    upsertMeta('meta[property="og:url"]', { property: "og:url", content: currentUrl });
    upsertMeta('meta[name="twitter:title"]', { name: "twitter:title", content: title });
    upsertMeta('meta[name="twitter:description"]', { name: "twitter:description", content: description });
    upsertLink('link[rel="canonical"]', { rel: "canonical", href: currentUrl });

    const structuredData = {
      "@context": "https://schema.org",
      "@type": "MusicRecordingStudio",
      name: SITE_NAME,
      url: window.location.origin,
      description,
      areaServed: "Владивосток",
      serviceType: ["Запись вокала", "Сведение", "Мастеринг", "Аранжировка"],
    };

    let schemaTag = document.head.querySelector("#phase-records-schema");
    if (!schemaTag) {
      schemaTag = document.createElement("script");
      schemaTag.type = "application/ld+json";
      schemaTag.id = "phase-records-schema";
      document.head.appendChild(schemaTag);
    }
    schemaTag.textContent = JSON.stringify(structuredData);
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <div className="App">
      <AuthProvider>
        <ShopProvider>
          <BrowserRouter>
            <ScrollToTop />
            <ScrollToHash />
            <RouteMeta />
            <AppRoutes />
          </BrowserRouter>
        </ShopProvider>
      </AuthProvider>
    </div>
  );
}

