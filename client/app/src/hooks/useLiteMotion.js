import { useEffect, useState } from "react";

const getLiteMotionPreference = () => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }

  return (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
};

export default function useLiteMotion() {
  const [liteMotion, setLiteMotion] = useState(getLiteMotionPreference);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return undefined;
    }

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setLiteMotion(getLiteMotionPreference());

    update();

    reducedMotionQuery.addEventListener?.("change", update);

    return () => {
      reducedMotionQuery.removeEventListener?.("change", update);
    };
  }, []);

  return liteMotion;
}
