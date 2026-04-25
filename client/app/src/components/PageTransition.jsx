import React from "react";
import { motion } from "framer-motion";

const transition = {
  duration: 0.35,
  ease: [0.22, 1, 0.36, 1],
};

export default function PageTransition({ children }) {
  return (
    <motion.div
      className="min-h-screen"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={transition}
    >
      {children}
    </motion.div>
  );
}
