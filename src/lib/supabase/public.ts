import { createClient } from "@supabase/supabase-js";

// Klien tanpa cookie untuk membaca konten publik saat build (PRD §11.2).
// Memakai publishable key, jadi hanya data yang lolos RLS (materi published) yang terbaca.
export function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY wajib diisi (lihat .env.example).");
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
