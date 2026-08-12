-- Demo satırlarını `draft`'a geri çeker (dev_activate_demo.sql'in tersi).
-- Tohum verisinin varsayılan durumu budur: anonim istemciye görünmez.

begin;

update public.brands        set status = 'draft' where is_demo;
update public.categories    set status = 'draft' where is_demo;
update public.device_models set status = 'draft' where is_demo;
update public.products      set status = 'draft' where is_demo;
update public.services      set status = 'draft' where is_demo;

commit;
