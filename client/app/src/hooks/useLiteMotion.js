import { useEffect, useState } from "react";

const getLiteMotionPreference = () => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }

  return (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    window.matchMedia("(max-width: 767px)").matches
  );
};

export default function useLiteMotion() {
  const [liteMotion, setLiteMotion] = useState(getLiteMotionPreference);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return undefined;
    }

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobileQuery = window.matchMedia("(max-width: 767px)");
    const update = () => setLiteMotion(getLiteMotionPreference());

    update();

    reducedMotionQuery.addEventListener?.("change", update);
    mobileQuery.addEventListener?.("change", update);

    return () => {
      reducedMotionQuery.removeEventListener?.("change", update);
      mobileQuery.removeEventListener?.("change", update);
    };
  }, []);

  return liteMotion;
}
