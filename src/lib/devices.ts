import type { Session, SupabaseClient } from '@supabase/supabase-js'

/**
 * Cihazlar / Son Bağlantılar — görüntüleme ve erişim mantığı.
 *
 * GÜVENLİK / GİZLİLİK
 *  - IP adresi burada HİÇBİR yerden türetilmez; yalnızca sunucunun
 *    `device_connections.client_ip` kolonuna koyduğu değeri gösterir.
 *    (Sunucu tarafı: `public._kyron_client_ip()` yalnızca güvenilir proxy
 *    başlığı `X-Forwarded-For`'ın en sağındaki girişi kabul eder.)
 *  - Yetkilendirme frontend'de DEĞİLDİR: veri RLS ile yalnızca admin'e açıktır.
 *    Buradaki oturum kapısı yalnızca gereksiz istek atmamak içindir.
 *  - Tam `installation_id` (uuid) gösterilmez, maskelenir.
 *
 * EKSİK VERİ
 *  - Cihaz bilgisi yoksa "tahmin" edilmez; `Bilinmiyor` gösterilir.
 */

/** Eksik/okunamamış alanların gösterim metni. */
export const UNKNOWN = 'Bilinmiyor'

/** Sorgulanacak azami kayıt (minimum kapsam). */
export const DEVICE_FETCH_LIMIT = 100

/** Saklama süresi (migration ile aynı değerler; panelde bilgi notu olarak). */
export const IP_RETENTION_DAYS = 30
export const CONNECTION_RETENTION_DAYS = 90

/** `device_connections` satırı (PostgREST ham şekli). */
export type DeviceConnectionRow = {
  id: string
  installation_id: string
  platform: string
  app_version: string
  device_manufacturer: string | null
  device_model: string | null
  android_version: string | null
  client_ip: string | null
  connected_at: string
}

/** Satırın ekrandaki hâli — tüm alanlar asla `undefined` değildir. */
export type DeviceView = {
  id: string
  ip: string
  manufacturer: string
  model: string
  androidVersion: string
  appVersion: string
  platform: string
  connectedAt: string
  sessionRef: string
}

const UNKNOWN_TOKENS = ['unknown', 'null', 'none', 'n/a', 'na', '-', '?']

/**
 * Eksik alanı `Bilinmiyor`'a çevirir.
 *
 * Boş, `null`, boşluk veya `unknown`-gibi etiketler dahil hiçbir durumda
 * değer UYDURULMAZ.
 */
export function displayValue(value: string | null | undefined): string {
  if (value === null || value === undefined) return UNKNOWN
  const v = String(value).trim()
  if (v === '') return UNKNOWN
  if (UNKNOWN_TOKENS.includes(v.toLowerCase())) return UNKNOWN
  return v
}

/** IP yoksa `Bilinmiyor` (sunucu üretemediyse uydurulmaz). */
export function displayIp(value: string | null | undefined): string {
  return displayValue(value)
}

/**
 * Oturum/kurulum kimliğini maskeler.
 *
 * Tam uuid bir kişiye ait olmasa da gereksiz yere açılmaz; tanım ve
 * hata ayıklama için ilk 8 karakter yeterlidir.
 */
export function maskSession(id: string | null | undefined): string {
  if (id === null || id === undefined) return UNKNOWN
  const v = String(id).trim()
  if (v === '') return UNKNOWN
  if (v.length <= 8) return v
  return `${v.slice(0, 8)}…`
}

/** Ham satırı görüntü modeline çevirir. Hiçbir alanı atlamaz. */
export function toDeviceView(row: DeviceConnectionRow): DeviceView {
  return {
    id: row.id,
    ip: displayIp(row.client_ip),
    manufacturer: displayValue(row.device_manufacturer),
    model: displayValue(row.device_model),
    androidVersion: displayValue(row.android_version),
    appVersion: displayValue(row.app_version),
    platform: displayValue(row.platform),
    connectedAt: displayValue(row.connected_at),
    sessionRef: maskSession(row.installation_id),
  }
}

const DEVICE_COLUMNS =
  'id,installation_id,platform,app_version,device_manufacturer,device_model,' +
  'android_version,client_ip,connected_at'

/**
 * Bağlantı kayıtlarını okur.
 *
 * OTURUM KAPISI: oturum yoksa sorgu hiç çalıştırılmaz (istek bile atılmaz).
 * Asıl yetki veritabanında `is_admin()` + RLS ile; admin olmayan bir
 * authenticated kullanıcı bu tablodan tek satır bile çekemez.
 */
export async function fetchDeviceConnections(
  client: SupabaseClient | null,
  session: Session | null,
  limit: number = DEVICE_FETCH_LIMIT,
): Promise<DeviceConnectionRow[]> {
  if (!client) throw new Error('supabase yapılandırması yok')
  if (!session) throw new Error('oturum yok')

  const take = Math.min(Math.max(Math.trunc(limit) || 1, 1), DEVICE_FETCH_LIMIT)

  const { data, error } = await client
    .from('device_connections')
    .select(DEVICE_COLUMNS)
    .order('connected_at', { ascending: false })
    .limit(take)

  if (error) throw new Error(error.message)
  // Supabase istemcisi şema tipleri olmadan çalışır; satırları sözleşmeye göre
  // yorumlarız (alan adları DEVICE_COLUMNS ile sabitlenmiştir).
  return (data ?? []) as unknown as DeviceConnectionRow[]
}
