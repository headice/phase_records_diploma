import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import useLiteMotion from "../../hooks/useLiteMotion";

export default function Reveal({ children, className = "", delay = 0, y = 28 }) {
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
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
