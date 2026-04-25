# Phase Records — Fullstack MVP (React + Django + Docker)

## Стек
- Frontend: React 18 (CRA), framer-motion, axios.
- Backend: Django 5, DRF, JWT (simplejwt), PostgreSQL.
- Infra: Docker Compose (frontend + backend + postgres + nginx), gunicorn.

## Быстрый старт (Docker, рекомендовано)
```bash
docker compose up --build
```
После сборки:
- Frontend: http://localhost
- API: http://localhost/api/
- Админка: http://localhost/admin

## Локальный запуск без Docker
Backend (PowerShell):
```powershell
cd coursework_phase_records/backend
Copy-Item .env.example .env
# По умолчанию .env.example запускает локальный SQLite (DJANGO_USE_SQLITE=True)

python -m pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo
python manage.py runserver
```
Если нужен именно PostgreSQL локально вне Docker, откройте `coursework_phase_records/backend/.env` и выставьте:
- `DJANGO_USE_SQLITE=False`
- `POSTGRES_HOST=localhost`
- остальные `POSTGRES_*` под вашу локальную базу

Frontend (PowerShell):
```powershell
cd coursework_phase_records/client/app
Copy-Item .env.example .env
# REACT_APP_API_BASE_URL=http://localhost:8000/api/
npm install
npm start
```

## Тестовые учётки и данные
- Админка: `admin / admin123`
- Клиент (демо): `demo@phase.studio / phase123`
- Демо-услуги, плагины, FAQ и отзыв — загружаются командой `seed_demo`.

## API кратко
- Auth: `POST /api/auth/register`, `POST /api/auth/login` (email/username + password), `POST /api/auth/refresh`, `GET /api/auth/me`
- Каталог: `GET /api/services/`, `GET /api/plugins/`
- Бронирование: `GET/POST /api/bookings/`, `POST /api/bookings/{id}/cancel`
- Корзина: `GET/POST/PATCH/DELETE /api/cart/items/`, `DELETE /api/cart/items/clear/`, `POST /api/cart/checkout/`
- Заказы: `GET /api/orders/`
- Лиды: `POST /api/leads/`
- Отзывы: `GET/POST /api/reviews/`
- FAQ: `GET /api/faq/`
- Healthcheck: `GET /api/health/`

## Тесты
- Backend API: `cd coursework_phase_records/backend && python manage.py test`
- Frontend smoke: `cd coursework_phase_records/client/app && npm test -- src/__tests__/smoke.test.js`

## Что осталось подключить (дальнейшие шаги)
- Реальную оплату через ЮKassa (подставить shop_id/secret, создать платеж и webhooks).
- Расширить фронт: вывод FAQ/отзывов уже есть, можно добавить форму отзывов.
- При желании — HTTPS/домен в nginx и полноценные e-mail уведомления.
