import { useEffect, useState } from "react";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("cookieConsent")) {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem("cookieConsent", "true");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black text-white p-4 z-50">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-4 items-center justify-between">
        <p>
          Продолжая пользоваться сайтом, вы соглашаетесь с использованием
          файлов cookie и обработкой персональных данных.
        </p>

        <button
          onClick={accept}
          className="bg-white text-black px-4 py-2 rounded"
        >
          Принять
        </button>
      </div>
    </div>
  );
}
