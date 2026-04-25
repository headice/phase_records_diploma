from django.core.management.base import BaseCommand

from studio.models import FAQ, PluginProduct, Review, Service, User


class Command(BaseCommand):
    help = "Seed demo data for Phase Records"

    def handle(self, *args, **options):
        admin, _ = User.objects.get_or_create(
            username="admin",
            defaults={
                "email": "admin@phase.local",
                "is_staff": True,
                "is_superuser": True,
            },
        )
        if not admin.password:
            admin.set_password("admin123")
            admin.save()

        demo_user, _ = User.objects.get_or_create(
            username="demo",
            email="demo@phase.studio",
            defaults={"display_name": "Phase Demo"},
        )
        if not demo_user.password:
            demo_user.set_password("phase123")
            demo_user.save()

        services = [
            {
                "title": "Аранжировки и минусовки",
                "slug": "arrangements",
                "subtitle": "От демо до релиза",
                "short_description": "Создание авторских аранжировок и минусов под любой стиль.",
                "full_description": "Работаем по вашим референсам или предложим собственные идеи.",
                "duration": "3–7 дней на аранжировку",
                "price": 10000,
                "price_text": "от 10 000 ₽",
                "includes": [
                    "Детальный разбор референсов и структуры",
                    "Подбор тембра, ритмики и гармонии",
                    "Передача проекта в удобном формате",
                ],
            },
            {
                "title": "Сведение и мастеринг",
                "slug": "mix",
                "subtitle": "Баланс, глубина, loudness",
                "short_description": "Приводим трек к релизному звучанию.",
                "full_description": "Используем проверенные цепочки обработки и сравнение с референсами.",
                "duration": "2–4 дня",
                "price": 10000,
                "price_text": "от 10 000 ₽",
                "includes": [
                    "Сведение с учётом референсов",
                    "Мастеринг под стриминговые сервисы",
                    "Экспорт в нужных форматах (WAV/MP3/Stem)",
                ],
            },
            {
                "title": "Запись вокала и инструментов",
                "slug": "recording",
                "subtitle": "Комфорт и точность",
                "short_description": "Профессиональная запись с подбором микрофона под тембр.",
                "full_description": "Акустически подготовленная комната и инженеры, которые помогают по дублям.",
                "duration": "по часам",
                "price": 1500,
                "price_text": "от 1 500 ₽ / час",
                "includes": [
                    "Подбор микрофона и предусилителя",
                    "Руководство по подаче, акцентам и бэкам",
                    "Черновая обработка после сессии",
                ],
            },
            {
                "title": "Песня под ключ",
                "slug": "fullsong",
                "subtitle": "От идеи до релиза",
                "short_description": "Текст, аранжировка, запись, сведение и мастеринг.",
                "full_description": "Берем на себя полный цикл и сопровождаем при выгрузке релиза.",
                "duration": "от 10 дней",
                "price": 15000,
                "price_text": "от 15 000 ₽",
                "includes": [
                    "Разработка концепции и текста",
                    "Аранжировка, запись, сведение, мастеринг",
                    "Сопровождение при выгрузке релиза",
                ],
            },
        ]
        for data in services:
            Service.objects.update_or_create(slug=data["slug"], defaults=data)

        plugins = [
            {
                "name": "SERUM 2",
                "slug": "serum2",
                "category": PluginProduct.CATEGORY_VSTI_INSTRUMENT,
                "tag": "таблично-волновой синтезатор",
                "description": "Обновленный синт с улучшенным движком и грануляцией.",
                "price": 3990,
                "old_price": 9990,
                "discount": "-60%",
                "image_url": "",
                "features": [
                    "Гранулярный режим и новые фильтры",
                    "Новый движок модуляции",
                    "Совместимость с пресетами Serum 1",
                ],
            },
            {
                "name": "FabFilter Total Bundle",
                "slug": "fabfilter-bundle",
                "category": PluginProduct.CATEGORY_VST_MIXING,
                "tag": "EQ, компрессия, лимитинг",
                "description": "Полный набор FabFilter для микса и мастера.",
                "price": 4990,
                "old_price": 12990,
                "discount": "-60%",
                "image_url": "",
                "features": [
                    "Все плагины FabFilter в одном наборе",
                    "Интуитивные интерфейсы и анализаторы",
                    "Поддержка основных DAW",
                ],
            },
        ]
        for data in plugins:
            PluginProduct.objects.update_or_create(slug=data["slug"], defaults=data)

        faqs = [
            ("Как забронировать запись?", "Выберите услугу «Запись» и оставьте заявку или сразу забронируйте слот."),
            ("Работаете удаленно?", "Да, сведение и мастеринг делаем онлайн, файлы можно прислать через облако."),
            ("Как оплатить?", "Поддерживаем онлайн-оплату (ЮKassa) и безнал для юрлиц."),
        ]
        for idx, (q, a) in enumerate(faqs, start=1):
            FAQ.objects.update_or_create(order=idx, question=q, defaults={"answer": a, "is_active": True})

        Review.objects.get_or_create(
            name="Phase Demo",
            defaults={
                "rating": 5,
                "content": "Отличная студия: быстро записали вокал и свели трек под релиз.",
                "user": demo_user,
                "service": Service.objects.filter(slug="recording").first(),
            },
        )

        self.stdout.write(self.style.SUCCESS("Demo data seeded"))
