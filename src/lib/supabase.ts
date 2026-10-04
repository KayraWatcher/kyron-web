import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Supabase istemcisi (anon anahtar).
 *
 * FAZ 14:
 *  - Degerler yalnizca `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`
 *    environment degiskenlerinden gelir; source'a hardcode edilmez.
 *  - Bu anahtar PUBLIC'tir (publishable anon key); okumalar RLS ile korunur.
 *  - Service-role key bu dosyada VE projenin hicbir yerinde bulunmaz.
 *
 * `.env.local` yoksa (ornegin lokal `npm run dev`) istemci olusturulmaz ve
 * admin sayfasi "yapilandirma eksik" durumu gosterir.
 */
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabaseConfigured = Boolean(url && anonKey)

export const supabase: SupabaseClient | null = supabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: {
        // Admin oturumu yalnizca bu tarayicida saklanir.
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null
