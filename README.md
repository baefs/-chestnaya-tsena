# Честная цена

Адаптивная аналитическая платформа сравнения стоимости стандартизированных повседневных услуг в Москве.

## Стек

- Next.js App Router, React, TypeScript
- Tailwind CSS
- PostgreSQL + Prisma ORM
- Supabase Auth для входа администратора
- Recharts для аналитики
- Яндекс Карты JS API
- Zod для серверной валидации

## Переменные окружения

Скопируйте `.env.example` в `.env.local`.

- `DATABASE_URL` — строка подключения PostgreSQL из Supabase → Project Settings → Database → Connection string → Transaction pooler. Используйте порт 6543 и параметр `?pgbouncer=true`.
- `NEXT_PUBLIC_SUPABASE_URL` — URL проекта Supabase.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — publishable key проекта.
- `NEXT_PUBLIC_YANDEX_MAPS_API_KEY` — ключ JavaScript API Яндекс Карт.

В Vercel переменные должны быть заданы для Production, Preview и Development.

## Локальный запуск

```bash
npm install
npx prisma generate
npm run dev
```

## База данных

Схема находится в `prisma/schema.prisma`, миграции — в `prisma/migrations`.

```bash
npx prisma migrate deploy
```

Базовые категории и 10 стандартизированных услуг включены в миграцию. Организации и цены не заполняются фиктивными значениями.

## Первый администратор

1. В Supabase Dashboard откройте Authentication → Users и создайте пользователя с нужным email.
2. Скопируйте UUID этого пользователя.
3. Выполните SQL в Supabase SQL Editor, подставив UUID и логин:

```sql
insert into public.admin_accounts (username, password_hash, auth_user_id, role, is_active)
values ('admin', 'managed-by-supabase-auth', 'UUID_ИЗ_AUTH_USERS', 'ADMIN', true)
on conflict (username) do update
set auth_user_id = excluded.auth_user_id, role = 'ADMIN', is_active = true;
```

Пароль проверяется Supabase Auth. Поле `password_hash` оставлено для совместимости со старой схемой и не используется приложением. Пользователь без записи в `admin_accounts` не получает права администратора.

## Правила публикации цен

- Публичная статистика включает только опубликованные `CONFIRMED` и `VERIFIED` предложения.
- Текущими считаются цены с датой проверки не старше 30 дней.
- Медиана публикуется при минимум 5 сопоставимых предложениях.
- Сравнение округов требует минимум 5 организаций в каждой группе.
- `USER_REPORTED` не участвует в публичной статистике до модерации.
- `OUTDATED` исключается из актуальных расчётов.
- Типы FIXED, FROM и RANGE сохраняются раздельно.
- Изменения цены автоматически записываются в `price_history`, включая границы диапазонов.

## Разделы

- Главная
- Каталог услуг
- Сравнение услуги
- Карточка организации
- Карта
- Аналитика
- Методология
- Защищённая административная панель

## Текущие ограничения

Для полноценного production-запуска необходимо задать `DATABASE_URL` и ключ Яндекс Карт, создать первого пользователя Supabase Auth и связать его с `admin_accounts`. В базе пока нет организаций и ценовых предложений; публичные цифры не имитируются.
