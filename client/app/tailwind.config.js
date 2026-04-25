module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: "#e8762d",
          light: "#f5a562",
          dim: "rgba(232,118,45,0.15)",
          glow: "rgba(232,118,45,0.35)",
        },
        surface: {
          DEFAULT: "#111111",
          raised: "#0a0a0a",
          card: "#0d0d0d",
        },
      },
      fontFamily: {
        display: ["Unbounded", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        xl: "1.25rem",
        "2xl": "1.5rem",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease",
        "slide-up": "slideUp 0.4s ease",
        "slide-down": "slideDown 0.3s ease",
        marquee: "marquee 30s linear infinite",
      },
    },
  },
  plugins: [],
};
