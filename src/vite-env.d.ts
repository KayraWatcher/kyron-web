/// Vite ortam degiskenleri tip tanitimlari (strict TS icin).
/// Gercek degerler `.env.local` dosyasinda tutulur (gitignore'li).
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
