-- RNDM Chat v24 — назначение ВАШЕГО аккаунта владельцем.
-- 1) Сначала зарегистрируйтесь/войдите на сайте.
-- 2) Замените YOUR_EMAIL@example.com на email своего аккаунта RNDM.
-- 3) Выполните этот запрос в Supabase SQL Editor ОДИН раз.

update public.profiles p
set app_role='owner', is_verified=true, is_premium=true
from auth.users u
where p.id=u.id
  and lower(u.email)=lower('YOUR_EMAIL@example.com');

-- Проверка:
select p.username,p.display_name,p.app_role,p.is_verified,p.is_premium
from public.profiles p
join auth.users u on u.id=p.id
where lower(u.email)=lower('YOUR_EMAIL@example.com');
