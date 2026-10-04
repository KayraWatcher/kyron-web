/**
 * KYRON web sitesi genel ayarları.
 *
 * APK indirme adresi, sürüm ve dosya boyutu gibi bilgiler BURADAN yönetilir.
 * Henüz gerçek bir APK adresi yoksa değer `null` bırakılmalıdır; UI bunu
 * düzgün şekilde gösterir (buton "yakında" durumuna geçer, sahte link basılmaz).
 */

export interface ApkRelease {
  /** Gerçek APK indirme adresi. Bilinmiyorsa `null`. */
  url: string | null
  /** Görüntülenecek sürüm etiketi. Bilinmiyorsa `null`. */
  version: string | null
  /** Dosya boyutu etiketi, örn. "24 MB". Bilinmiyorsa `null`. */
  fileSize: string | null
}

export const APK_RELEASE: ApkRelease = {
  url: 'https://github.com/KayraWatcher/kyron/releases/download/v1.0.0/KYRON-v1.0.0.apk',
  version: 'v1.0.0',
  fileSize: '56.9 MB',
}

export const APP_NAME = 'KYRON'
export const APP_TAGLINE = 'Türkiye piyasalarını tek yerde takip et.'
export const APP_DESCRIPTION =
  'Modern finans uygulaması. BIST, altın, döviz, gümüş, fonlar, haberler ve ekonomik takvim tek uygulamada.'

export const CONTACT_EMAIL = '' // biliniyorsa doldurulabilir

export const NAV_LINKS = [
  { label: 'Ana Sayfa', href: '#/' },
  { label: 'Özellikler', href: '#/#ozellikler' },
  { label: 'Piyasalar', href: '#/#piyasalar' },
  { label: 'İndir', href: '#/#indir' },
] as const

export const FOOTER_LINKS = [
  { label: 'Ana Sayfa', href: '#/' },
  { label: 'Özellikler', href: '#/#ozellikler' },
  { label: 'İndir', href: '#/#indir' },
  { label: 'Gizlilik', href: '#/gizlilik' },
  { label: 'Kullanım Koşulları', href: '#/kullanim-kosullari' },
] as const

export const LEGAL_PAGES = {
  privacy: {
    title: 'Gizlilik Politikası',
    updatedAt: null as string | null,
  },
  terms: {
    title: 'Kullanım Koşulları',
    updatedAt: null as string | null,
  },
} as const
