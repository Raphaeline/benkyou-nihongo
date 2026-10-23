-- Status review dihapus: konten di branch main = konten produksi (keputusan pemilik 22 Okt 2026).
-- Kolom published tetap ada untuk RLS dan selalu diisi true oleh seed.
alter table public.lessons drop column review_status;
