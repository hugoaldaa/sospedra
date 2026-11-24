-- Permitir lectura pública de las tablas del catálogo desde el navegador.
-- Ejecutar una vez en Supabase > SQL Editor.
-- La anon key sola no puede leer si RLS está activo sin estas políticas.

ALTER TABLE public.tipos_de_prendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prendas_imagenes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_tipos_de_prendas" ON public.tipos_de_prendas;
CREATE POLICY "public_read_tipos_de_prendas"
    ON public.tipos_de_prendas FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "public_read_prendas" ON public.prendas;
CREATE POLICY "public_read_prendas"
    ON public.prendas FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "public_read_prendas_imagenes" ON public.prendas_imagenes;
CREATE POLICY "public_read_prendas_imagenes"
    ON public.prendas_imagenes FOR SELECT TO anon USING (true);
