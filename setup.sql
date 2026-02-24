
-- EXECUTE ESTE COMANDO NO SQL EDITOR DO SUPABASE PARA LIBERAR A FUNÇÃO DE REPÓRTER
-- O erro acontece porque o banco ainda não conhece a nova coluna "show_reporter"

ALTER TABLE artigos ADD COLUMN IF NOT EXISTS show_reporter BOOLEAN DEFAULT false;
