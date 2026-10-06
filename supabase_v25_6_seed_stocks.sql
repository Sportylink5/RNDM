-- RNDM v25.6 — optional seed stocks. Safe to run more than once.
do $$
declare
  owner_id uuid;
  sid uuid;
begin
  select p.id into owner_id
  from public.profiles p
  join auth.users u on u.id=p.id
  where lower(u.email)=lower('sergey080re@yandex.ru')
  limit 1;

  if not exists(select 1 from public.stock_assets where ticker='RNDM') then
    insert into public.stock_assets(ticker,name,emoji,description,price,previous_price,is_active,created_by)
    values('RNDM','RNDM Technologies','💜','Главная виртуальная компания экосистемы RNDM.',1250,1250,true,owner_id)
    returning id into sid;
    insert into public.stock_price_history(stock_id,price,changed_by) values(sid,1250,owner_id);
  end if;

  if not exists(select 1 from public.stock_assets where ticker='CLIPS') then
    insert into public.stock_assets(ticker,name,emoji,description,price,previous_price,is_active,created_by)
    values('CLIPS','RNDM Clips','🎬','Виртуальная акция видеосервиса RNDM Clips.',640,640,true,owner_id)
    returning id into sid;
    insert into public.stock_price_history(stock_id,price,changed_by) values(sid,640,owner_id);
  end if;
end $$;
