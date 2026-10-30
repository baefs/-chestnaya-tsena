ALTER TABLE public.admin_accounts ADD COLUMN IF NOT EXISTS auth_user_id uuid UNIQUE;
ALTER TABLE public.admin_accounts ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'ADMIN';
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='admin_accounts_auth_user_id_fkey') THEN ALTER TABLE public.admin_accounts ADD CONSTRAINT admin_accounts_auth_user_id_fkey FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE CASCADE; END IF; END $$;
ALTER TABLE public.service_categories ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '';
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS parameters jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS area text NOT NULL DEFAULT '';
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS price_min numeric(12,2);
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS price_max numeric(12,2);
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS price_type text NOT NULL DEFAULT 'FIXED';
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS conditions text NOT NULL DEFAULT '';
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS source_id uuid;
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS collected_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.offers ALTER COLUMN price DROP NOT NULL;
ALTER TABLE public.price_history ADD COLUMN IF NOT EXISTS change_reason text NOT NULL DEFAULT '';
ALTER TABLE public.price_history ALTER COLUMN new_price DROP NOT NULL;
ALTER TABLE public.price_history ADD COLUMN IF NOT EXISTS old_price_min numeric(12,2);
ALTER TABLE public.price_history ADD COLUMN IF NOT EXISTS old_price_max numeric(12,2);
ALTER TABLE public.price_history ADD COLUMN IF NOT EXISTS new_price_min numeric(12,2);
ALTER TABLE public.price_history ADD COLUMN IF NOT EXISTS new_price_max numeric(12,2);
ALTER TABLE public.price_history ADD COLUMN IF NOT EXISTS old_price_type text;
ALTER TABLE public.price_history ADD COLUMN IF NOT EXISTS new_price_type text;
CREATE TABLE IF NOT EXISTS public.sources (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 source_type text NOT NULL,
 source_url text NOT NULL,
 description text NOT NULL DEFAULT '',
 collected_at timestamptz NOT NULL DEFAULT now(),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.submissions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
 organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
 proposed_price numeric(12,2) NOT NULL CHECK (proposed_price > 0),
 evidence text NOT NULL DEFAULT '',
 status text NOT NULL DEFAULT 'USER_REPORTED',
 created_at timestamptz NOT NULL DEFAULT now(),
 reviewed_at timestamptz,
 review_note text NOT NULL DEFAULT ''
);
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='offers_source_id_fkey') THEN ALTER TABLE public.offers ADD CONSTRAINT offers_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.sources(id) ON DELETE SET NULL; END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='offers_price_shape_check') THEN ALTER TABLE public.offers ADD CONSTRAINT offers_price_shape_check CHECK ((price_type='FIXED' AND price IS NOT NULL AND price>0 AND price_min IS NULL AND price_max IS NULL) OR (price_type='FROM' AND price_min IS NOT NULL AND price_min>0 AND price_max IS NULL) OR (price_type='RANGE' AND price_min IS NOT NULL AND price_max IS NOT NULL AND price_min>0 AND price_max>=price_min)); END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='offers_status_check') THEN ALTER TABLE public.offers ADD CONSTRAINT offers_status_check CHECK (status IN ('CONFIRMED','VERIFIED','USER_REPORTED','OUTDATED')); END IF;
END $$;
CREATE INDEX IF NOT EXISTS offers_service_status_checked_idx ON public.offers(service_id,status,checked_at DESC);
CREATE INDEX IF NOT EXISTS offers_organization_idx ON public.offers(organization_id);
CREATE INDEX IF NOT EXISTS organizations_district_idx ON public.organizations(district);
CREATE INDEX IF NOT EXISTS price_history_offer_changed_idx ON public.price_history(offer_id,changed_at DESC);
CREATE INDEX IF NOT EXISTS submissions_status_created_idx ON public.submissions(status,created_at DESC);
ALTER TABLE public.admin_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_accounts,public.admin_sessions,public.offers,public.organizations,public.price_history,public.service_categories,public.services,public.sources,public.submissions FROM anon,authenticated;
CREATE OR REPLACE FUNCTION public.record_offer_price_history()
RETURNS trigger LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN
 IF TG_OP='INSERT' THEN
  INSERT INTO public.price_history(offer_id,old_price,new_price,new_price_min,new_price_max,new_price_type,change_reason)
  VALUES(NEW.id,NULL,NEW.price,NEW.price_min,NEW.price_max,NEW.price_type,'Первичное добавление предложения');
 ELSIF OLD.price IS DISTINCT FROM NEW.price OR OLD.price_min IS DISTINCT FROM NEW.price_min OR OLD.price_max IS DISTINCT FROM NEW.price_max OR OLD.price_type IS DISTINCT FROM NEW.price_type THEN
  INSERT INTO public.price_history(offer_id,old_price,new_price,old_price_min,old_price_max,new_price_min,new_price_max,old_price_type,new_price_type,change_reason)
  VALUES(NEW.id,OLD.price,NEW.price,OLD.price_min,OLD.price_max,NEW.price_min,NEW.price_max,OLD.price_type,NEW.price_type,'Изменение стоимости или типа цены');
 END IF;
 RETURN NEW;
END $$;
CREATE OR REPLACE FUNCTION public.touch_offer_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN NEW.updated_at=now(); RETURN NEW; END $$;
REVOKE EXECUTE ON FUNCTION public.admin_login(text,text) FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS offers_price_history_trigger ON public.offers;
CREATE TRIGGER offers_price_history_trigger AFTER INSERT OR UPDATE ON public.offers FOR EACH ROW EXECUTE FUNCTION public.record_offer_price_history();
DROP TRIGGER IF EXISTS offers_updated_at_trigger ON public.offers;
CREATE TRIGGER offers_updated_at_trigger BEFORE UPDATE ON public.offers FOR EACH ROW EXECUTE FUNCTION public.touch_offer_updated_at();
INSERT INTO public.service_categories(name,description,sort_order) VALUES
 ('Красота','Услуги парикмахерских и ухода',1),('Ремонт обуви','Ремонт и профилактика обуви',2),('Печать','Печать документов и изображений',3),('Химчистка','Профессиональная чистка одежды',4),('Велосервис','Обслуживание и ремонт велосипедов',5)
ON CONFLICT(name) DO UPDATE SET description=EXCLUDED.description,sort_order=EXCLUDED.sort_order;
INSERT INTO public.services(category_id,name,description,unit,parameters)
SELECT c.id,v.name,v.description,v.unit,v.parameters::jsonb FROM (VALUES
 ('Красота','Мужская стрижка','Стрижка волос машинкой и/или ножницами без дополнительных услуг. Мытьё и укладка не включены.','услуга','{"hair_wash":false,"styling":false}'),
 ('Красота','Женская стрижка','Стрижка волос по длине и форме без окрашивания и дополнительного ухода.','услуга','{"coloring":false,"care":false}'),
 ('Ремонт обуви','Замена набоек','Снятие изношенных набоек и установка новой пары. Материал должен быть указан.','пара','{"quantity":2}'),
 ('Ремонт обуви','Установка профилактики','Установка защитного материала на подошву пары обуви.','пара','{"quantity":2}'),
 ('Печать','Чёрно-белая печать А4','Печать одной стороны листа А4, чёрно-белый режим, стандартная бумага 80 г/м².','лист','{"format":"A4","color":"mono","sides":1,"paper_gsm":80}'),
 ('Печать','Цветная печать А4','Печать одной стороны листа А4, цветной режим, стандартная бумага 80 г/м².','лист','{"format":"A4","color":"color","sides":1,"paper_gsm":80}'),
 ('Химчистка','Чистка мужской рубашки','Химическая чистка одной мужской рубашки без дополнительных услуг.','шт.','{"garment":"shirt","gender":"male"}'),
 ('Химчистка','Чистка брюк','Химическая чистка одной пары брюк без дополнительных услуг.','пара','{"garment":"trousers"}'),
 ('Велосервис','Замена велосипедной камеры','Замена камеры на одном колесе велосипеда. Камера и работа указываются отдельно.','колесо','{"wheel_count":1}'),
 ('Велосервис','Регулировка тормозов','Регулировка одного тормозного механизма без замены комплектующих.','механизм','{"brake_count":1}')
) AS v(category_name,name,description,unit,parameters)
JOIN public.service_categories c ON c.name=v.category_name
WHERE NOT EXISTS (SELECT 1 FROM public.services s WHERE s.category_id=c.id AND s.name=v.name);
