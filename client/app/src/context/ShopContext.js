import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import api from "../api/client";
import { AuthContext } from "./AuthContext";
import arrImg from "../img/arr.jpg";
import mixImg from "../img/mix.jpg";
import recordImg from "../img/record.jpg";
import fullsongImg from "../img/fullsong.jpg";
import promoImg from "../img/promo.jpg";
import serumImg from "../img/serum2-hero-min.png";
import nexusImg from "../img/nexus_5.png";
import wavesImg from "../img/waves_bundle.jpg";
import fabfilterImg from "../img/fabfilter_pro_bundle.jpg";

const SERVICE_IMAGE_MAP = {
  arrangements: arrImg,
  mix: mixImg,
  recording: recordImg,
  fullsong: fullsongImg,
  promo: promoImg,
};

const PLUGIN_IMAGE_MAP = {
  serum2: serumImg,
  fabfilter: fabfilterImg,
  "fabfilter-bundle": fabfilterImg,
  waves: wavesImg,
  nexus5: nexusImg,
};

const unwrapList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const STATUS_LABELS = {
  draft: "Черновик",
  pending: "Ожидает подтверждения",
  pending_payment: "Ожидает оплаты",
  confirmed: "Подтверждено",
  paid: "Оплачен",
  cancelled: "Отменен",
};

const formatPrice = (value) => {
  if (value === null || value === undefined) return "—";
  return `${Number(value).toLocaleString("ru-RU")} ₽`;
};

const getStatusLabel = (status) => STATUS_LABELS[status] || status || "Неизвестно";

export const ShopContext = createContext({
  services: [],
  plugins: [],
  demoTracks: [],
  faq: [],
  reviews: [],
  cartItems: [],
  bookings: [],
  orders: [],
  getServiceSlots: async () => [],
  addToCart: async () => {},
  updateCartItemQuantity: async () => {},
  removeFromCart: async () => {},
  clearCart: async () => {},
  bookService: async () => {},
  addRequest: async () => {},
  checkout: async () => {},
  confirmOrderPayment: async () => {},
  refreshOrders: async () => {},
  refreshCatalog: async () => {},
  isLoading: false,
});

export function ShopProvider({ children }) {
  const { isAuthenticated } = useContext(AuthContext);
  const location = useLocation();
  const [services, setServices] = useState([]);
  const [plugins, setPlugins] = useState([]);
  const [demoTracks, setDemoTracks] = useState([]);
  const [faq, setFaq] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const shouldLoadCatalog = useMemo(() => {
    const { pathname } = location;
    return (
      pathname === "/" ||
      pathname === "/services" ||
      pathname === "/plugins" ||
      pathname === "/booking" ||
      pathname.startsWith("/services/") ||
      pathname.startsWith("/plugins/")
    );
  }, [location]);

  const mapService = useCallback(
    (service) => ({
      id: service.slug,
      backendId: service.id,
      title: service.title,
      subtitle: service.subtitle,
      shortDescription: service.short_description,
      fullDescription: service.full_description,
      duration: service.duration,
      price: formatPrice(service.price ?? service.price_text),
      priceValue: service.price,
      priceText: service.price_text || formatPrice(service.price),
      includes: service.includes || [],
      image: service.image_url || SERVICE_IMAGE_MAP[service.slug] || arrImg,
    }),
    []
  );

  const mapPlugin = useCallback((plugin) => {
    const price = formatPrice(plugin.price);
    const oldPrice = plugin.old_price ? formatPrice(plugin.old_price) : null;
    return {
      id: plugin.slug,
      backendId: plugin.id,
      name: plugin.name,
      category: plugin.category,
      categoryLabel: plugin.category_label || plugin.tag || "Plugin",
      tag: plugin.tag,
      description: plugin.description,
      price,
      oldPrice,
      discount: plugin.discount,
      image: plugin.image || plugin.image_url || PLUGIN_IMAGE_MAP[plugin.slug] || serumImg,
      features: plugin.features || [],
    };
  }, []);

  const mapDemoTrack = useCallback((track) => ({
    id: String(track.id),
    title: track.title,
    type: track.kind,
    pairKey: track.pair_key,
    order: track.order ?? 0,
    src: track.audio || track.audio_url || track.audio_file || "",
  }), []);

  const mapCartItem = useCallback((item) => ({
    id: item.id,
    type: item.product_type,
    productId: item.product_id,
    name: item.title,
    price: formatPrice(item.price),
    priceValue: item.price,
    quantity: item.quantity,
    tag: item.product_type === "service" ? "Услуга" : "Плагин",
  }), []);

  const mapBooking = useCallback((item) => ({
    id: item.id,
    serviceId: item.service?.slug || item.service?.id,
    serviceTitle: item.service?.title,
    clientName: item.client_name,
    clientContact: item.client_contact,
    date: item.scheduled_at?.slice(0, 10),
    time: item.scheduled_at?.slice(11, 16),
    duration: item.duration_hours,
    status: item.status,
    statusLabel: getStatusLabel(item.status),
    createdAt: item.created_at,
    total: item.total_price,
    notes: item.notes,
  }), []);

  const mapOrder = useCallback((order) => ({
    id: order.id,
    status: order.status,
    statusLabel: getStatusLabel(order.status),
    totalAmount: order.total_amount,
    totalLabel: formatPrice(order.total_amount),
    contactEmail: order.contact_email,
    contactPhone: order.contact_phone,
    paymentUrl: order.payment_url,
    createdAt: order.created_at,
    items: (order.items || []).map((item) => ({
      type: item.product_type,
      typeLabel: item.product_type === "service" ? "Услуга" : "Плагин",
      productId: item.product_id,
      title: item.title,
      price: item.price,
      priceLabel: formatPrice(item.price),
      quantity: item.quantity,
      licenseCodes: item.license_codes || [],
    })),
  }), []);

  const refreshCatalog = useCallback(async () => {
    setIsLoading(true);
    try {
      const [servicesRes, pluginsRes, faqRes, reviewsRes, demoTracksRes] = await Promise.allSettled([
        api.get("services/", { skipAuth: true }),
        api.get("plugins/", { skipAuth: true }),
        api.get("faq/", { skipAuth: true }),
        api.get("reviews/", { skipAuth: true }),
        api.get("demo-tracks/", { skipAuth: true }),
      ]);

      setServices(
        servicesRes.status === "fulfilled"
          ? unwrapList(servicesRes.value.data).map(mapService)
          : []
      );
      setPlugins(
        pluginsRes.status === "fulfilled"
          ? unwrapList(pluginsRes.value.data).map(mapPlugin)
          : []
      );
      setFaq(faqRes.status === "fulfilled" ? unwrapList(faqRes.value.data) : []);
      setReviews(
        reviewsRes.status === "fulfilled" ? unwrapList(reviewsRes.value.data) : []
      );
      setDemoTracks(
        demoTracksRes.status === "fulfilled"
          ? unwrapList(demoTracksRes.value.data).map(mapDemoTrack).filter((track) => track.src)
          : []
      );
    } catch (error) {
      setServices([]);
      setPlugins([]);
      setDemoTracks([]);
      setFaq([]);
      setReviews([]);
    } finally {
      setIsLoading(false);
    }
  }, [mapDemoTrack, mapPlugin, mapService]);

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCartItems([]);
      return;
    }
    try {
      const { data } = await api.get("cart/items/");
      setCartItems(unwrapList(data).map(mapCartItem));
    } catch (error) {
      setCartItems([]);
    }
  }, [isAuthenticated, mapCartItem]);

  const refreshBookings = useCallback(async () => {
    if (!isAuthenticated) {
      setBookings([]);
      return;
    }
    try {
      const { data } = await api.get("bookings/");
      setBookings(unwrapList(data).map(mapBooking));
    } catch (error) {
      setBookings([]);
    }
  }, [isAuthenticated, mapBooking]);

  const refreshOrders = useCallback(async () => {
    if (!isAuthenticated) {
      setOrders([]);
      return;
    }
    try {
      const { data } = await api.get("orders/");
      setOrders(unwrapList(data).map(mapOrder));
    } catch (error) {
      setOrders([]);
    }
  }, [isAuthenticated, mapOrder]);

  useEffect(() => {
    if (!shouldLoadCatalog) {
      return;
    }
    refreshCatalog();
  }, [refreshCatalog, shouldLoadCatalog]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshCart();
      refreshBookings();
      refreshOrders();
    } else {
      setCartItems([]);
      setBookings([]);
      setOrders([]);
    }
  }, [isAuthenticated, refreshBookings, refreshCart, refreshOrders]);

  const addToCart = useCallback(
    async (item) => {
      let productId = item.backendId || item.id;
      if (item.type === "service" && typeof productId !== "number") {
        const found = services.find(
          (s) => s.id === productId || s.backendId === productId
        );
        productId = found?.backendId || productId;
      }
      if (item.type === "plugin" && typeof productId !== "number") {
        const found = plugins.find(
          (p) => p.id === productId || p.backendId === productId
        );
        productId = found?.backendId || productId;
      }

      const payload = {
        product_type: item.type,
        product_id: productId,
        quantity: item.quantity || 1,
      };
      await api.post("cart/items/", payload);
      await refreshCart();
    },
    [plugins, refreshCart, services]
  );

  const removeFromCart = useCallback(
    async (id) => {
      await api.delete(`cart/items/${id}/`);
      await refreshCart();
    },
    [refreshCart]
  );

  const updateCartItemQuantity = useCallback(
    async (id, quantity) => {
      const nextQuantity = Math.max(1, Number(quantity) || 1);
      await api.patch(`cart/items/${id}/`, { quantity: nextQuantity });
      await refreshCart();
    },
    [refreshCart]
  );

  const clearCart = useCallback(async () => {
    await api.delete("cart/items/clear/");
    setCartItems([]);
  }, []);

  const getServiceSlots = useCallback(async (serviceSlug, date) => {
    const { data } = await api.get(`services/${serviceSlug}/slots/`, {
      skipAuth: true,
      params: { date },
    });
    return data.slots || [];
  }, []);

  const bookService = useCallback(
    async ({
      serviceBackendId,
      serviceSlug,
      scheduledAt,
      duration = 1,
      clientName = "",
      clientContact = "",
      notes = "",
    }) => {
      let targetId = serviceBackendId;
      if (!targetId && serviceSlug) {
        const found = services.find((s) => s.id === serviceSlug);
        targetId = found?.backendId;
      }
      if (!targetId && services.length) {
        targetId = services[0].backendId;
      }
      const { data } = await api.post("bookings/", {
        service_id: targetId,
        client_name: clientName,
        client_contact: clientContact,
        scheduled_at: scheduledAt,
        duration_hours: duration,
        notes,
      });
      await refreshBookings();
      return data;
    },
    [refreshBookings, services]
  );

  const addRequest = useCallback(async (request) => {
    await api.post("leads/", request);
  }, []);

  const checkout = useCallback(
    async ({ contact_email, contact_phone }) => {
      const { data } = await api.post("cart/checkout/", {
        contact_email,
        contact_phone,
        return_url: `${window.location.origin}/cart?payment=return`,
      });
      await refreshCart();
      await refreshOrders();
      return data;
    },
    [refreshCart, refreshOrders]
  );

  const confirmOrderPayment = useCallback(async (orderId) => {
    const { data } = await api.post(`orders/${orderId}/confirm_payment/`);
    await refreshOrders();
    return data;
  }, [refreshOrders]);

  const value = useMemo(
    () => ({
      services,
      plugins,
      demoTracks,
      faq,
      reviews,
      cartItems,
      bookings,
      orders,
      getServiceSlots,
      addToCart,
      updateCartItemQuantity,
      removeFromCart,
      clearCart,
      bookService,
      addRequest,
      checkout,
      confirmOrderPayment,
      refreshOrders,
      refreshCatalog,
      isLoading,
    }),
    [
      addRequest,
      addToCart,
      bookService,
      bookings,
      cartItems,
      demoTracks,
      getServiceSlots,
      faq,
      reviews,
      orders,
      checkout,
      confirmOrderPayment,
      clearCart,
      isLoading,
      plugins,
      refreshCatalog,
      refreshOrders,
      removeFromCart,
      services,
      updateCartItemQuantity,
    ]
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}
