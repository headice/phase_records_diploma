import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-white py-20 px-6">
      <Header/>
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold">
          Политика обработки персональных данных
        </h1>

        <p>
          Настоящая политика обработки персональных данных определяет порядок
          обработки и защиты персональных данных пользователей сайта
          «Phase Records».
        </p>

        <section>
          <h2 className="text-2xl font-semibold mb-3">
            1. Персональные данные
          </h2>
          <p>
            Сайт может обрабатывать следующие данные пользователей:
          </p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>имя пользователя;</li>
            <li>адрес электронной почты;</li>
            <li>контактные данные;</li>
            <li>информация о заказах и бронированиях.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">
            2. Цели обработки данных
          </h2>
          <p>
            Персональные данные используются для:
          </p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>регистрации пользователей;</li>
            <li>авторизации в системе;</li>
            <li>оформления заказов;</li>
            <li>бронирования услуг;</li>
            <li>обратной связи с пользователями.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">
            3. Защита информации
          </h2>
          <p>
            Администрация сайта принимает необходимые меры для защиты
            персональных данных пользователей от неправомерного доступа,
            изменения или распространения.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">
            4. Согласие пользователя
          </h2>
          <p>
            Используя сайт и регистрируясь в системе, пользователь выражает
            согласие на обработку своих персональных данных.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">
            5. Заключительные положения
          </h2>
          <p>
            Администрация сайта вправе вносить изменения в настоящую политику
            без предварительного уведомления пользователей.
          </p>
        </section>
      </div>
      <Footer/>
    </div>
  );
}
