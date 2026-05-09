import { motion } from "framer-motion";
import useLiteMotion from "../../hooks/useLiteMotion";

export default function PageHero({ eyebrow, title, titleAccent, description, children, backgroundImage }) {
  const liteMotion = useLiteMotion();

  return (
    <section className="relative w-full overflow-hidden pt-28 pb-16 md:pt-36 md:pb-20 min-h-[50vh] flex items-end">
      {backgroundImage && (
        <>
          <img
            src={backgroundImage}
            alt=""
            aria-hidden="true"
            className={`absolute inset-0 h-full w-full object-cover object-center ${liteMotion ? "" : "hero-media-ambient"}`}
            fetchpriority="high"
            loading="eager"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/50" />
        </>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg)] via-transparent to-black/30" />
      <div className="pointer-events-none absolute -left-32 top-1/3 w-72 h-72 rounded-full bg-[var(--color-accent)]/6 blur-[120px]" />

      <div className="relative z-10 max-w-[1400px] mx-auto px-5 md:px-8 w-full">
        <motion.div
          className="max-w-3xl space-y-5"
          initial={liteMotion ? false : { opacity: 0, y: 30 }}
          animate={liteMotion ? undefined : { opacity: 1, y: 0 }}
          transition={liteMotion ? undefined : { duration: 0.7, delay: 0.15 }}
        >
          {eyebrow && <p className="label-eyebrow">{eyebrow}</p>}
          <h1 className="heading-display text-[clamp(2rem,5vw,3.5rem)]">
            {title}
            {titleAccent && <span className="text-gradient"> {titleAccent}</span>}
          </h1>
          {description && (
            <p className="text-base md:text-lg text-[var(--color-text-muted)] max-w-xl leading-relaxed">
              {description}
            </p>
          )}
          {children}
        </motion.div>
      </div>
    </section>
  );
}
