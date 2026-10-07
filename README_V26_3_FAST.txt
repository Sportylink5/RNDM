RNDM Chat v26.3 FAST

Добавлено:
- Забыли пароль? + восстановление через Supabase email
- Единый rndm_bootstrap(): профиль, уведомления, непрочитанные чаты, техрежим, цензура, объявление, входящий звонок — одним запросом
- Кэш профиля 10 минут, bootstrap 45 секунд, cloud state 5 минут
- Heartbeat раз в 5 минут вместо каждой минуты
- Random Chat: Realtime для очереди + fallback 60 секунд; проверка матча реже
- Censorship использует bootstrap вместо отдельного app_settings запроса
- Service Worker/cache version 26.3

Дополнительно:
- Service Worker больше не перехватывает Supabase/API запросы
- Локальные JS/CSS работают cache-first
- Повторяющиеся старые inline-бандлы вынесены в общие кэшируемые JS-файлы (~67 КБ меньше на каждой старой странице)
