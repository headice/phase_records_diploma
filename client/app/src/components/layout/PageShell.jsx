import Header from "../Header.jsx";
import Footer from "../Footer.jsx";

export default function PageShell({ children, className = "" }) {
  return (
    <div
      className={`bg-[var(--color-bg)] text-white min-h-screen flex flex-col ${className}`}
      style={{ fontFamily: "var(--font-body)" }}
    >
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
