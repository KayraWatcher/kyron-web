/**
 * KYRON web sitesi genel ayarlarÄ±.
 *
 * APK indirme adresi, sÃ¼rÃ¼m ve dosya boyutu gibi bilgiler BURADAN yÃ¶netilir.
 * HenÃ¼z gerÃ§ek bir APK adresi yoksa deÄŸer `null` bÄ±rakÄ±lmalÄ±dÄ±r; UI bunu
 * dÃ¼zgÃ¼n ÅŸekilde gÃ¶sterir (buton "yakÄ±nda" durumuna geÃ§er, sahte link basÄ±lmaz).
 */

export interface ApkRelease {
  /** GerÃ§ek APK indirme adresi. Bilinmiyorsa `null`. */
  url: string | null
  /** GÃ¶rÃ¼ntÃ¼lenecek sÃ¼rÃ¼m etiketi. Bilinmiyorsa `null`. */
  version: string | null
  /** Dosya boyutu etiketi, Ã¶rn. "24 MB". Bilinmiyorsa `null`. */
  fileSize: string | null
}

export const APK_RELEASE: ApkRelease = {
   url: '/downloads/KYRON-v1.3.2.apk',
   version: 'v1.3.2',
   fileSize: '57.9 MB',
}

export const APP_NAME = 'GOLD'
export const APP_TAGLINE = 'TÃ¼rkiye piyasalarÄ±nÄ± tek yerde takip et.'
export const APP_DESCRIPTION =
  'Modern finans uygulamasÄ±. BIST, altÄ±n, dÃ¶viz, gÃ¼mÃ¼ÅŸ, fonlar, haberler ve ekonomik takvim tek uygulamada.'

export const CONTACT_EMAIL = '' // biliniyorsa doldurulabilir

export const NAV_LINKS = [
  { label: 'Ana Sayfa', href: '#/' },
  { label: 'Ã–zellikler', href: '#/#ozellikler' },
  { label: 'Piyasalar', href: '#/#piyasalar' },
  { label: 'Ä°ndir', href: '#/#indir' },
] as const

export const FOOTER_LINKS = [
  { label: 'Ana Sayfa', href: '#/' },
  { label: 'Ã–zellikler', href: '#/#ozellikler' },
  { label: 'Ä°ndir', href: '#/#indir' },
  { label: 'Gizlilik', href: '#/gizlilik' },
  { label: 'KullanÄ±m KoÅŸullarÄ±', href: '#/kullanim-kosullari' },
] as const

export const LEGAL_PAGES = {
  privacy: {
    title: 'Gizlilik PolitikasÄ±',
    updatedAt: null as string | null,
  },
  terms: {
    title: 'KullanÄ±m KoÅŸullarÄ±',
    updatedAt: null as string | null,
  },
} as const

