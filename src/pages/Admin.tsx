import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, supabaseConfigured } from '../lib/supabase'
import {
  CONNECTION_RETENTION_DAYS,
  IP_RETENTION_DAYS,
  UNKNOWN,
  fetchDeviceConnections,
  toDeviceView,
  type DeviceView,
} from '../lib/devices'

/**
 * KYRON ADMIN - anonim kurulum telemetrisi dashboard'u (#/admin).
 *
 * Guvenlik (FAZ 12):
 *  - Supabase Auth ile email/sifre giris zorunlu; oturum yoksa veri gosterilmez.
 *  - Yetki FRONTEND'de degil, veritabaninda tanimlidir (admin_users + RLS).
 *    Backend'de `is_admin()` gecmeyen kullanici tek satir bile okuyamaz.
 *  - Service-role key frontend'de YOKTUR; yalnizca public anon key kullanilir.
 *
 * Veri (FAZ 9/10): tamami GERCEK Supabase kayitlarindan gelir; fake data yok.
 * Veritabani bossa "Henuz veri yok" gosterilir.
 */

type Stats = {
  total: number
  active24h: number
  active7d: number
  active30d: number
  versions: { version: string; count: number }[]
  daily: { label: string; count: number }[]
  recent: {
    id: string
    createdAt: string
    eventType: string
    appVersion: string
    platform: string
  }[]
}

function sinceIso(hours: number): string {
  return new Date(Date.now() - hours * 3600_000).toISOString()
}

function splitVersion(raw: string): { version: string; build: string | null } {
  const [version, build] = raw.split('+')
  return { version, build: build ?? null }
}

function dayLabel(date: Date): string {
  const now = new Date()
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const diffDays = Math.round((startOf(now) - startOf(date)) / 86_400_000)
  if (diffDays === 0) return 'Bugün'
  if (diffDays === 1) return 'Dün'
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  return `${dd}.${mm}.${date.getFullYear()}`
}

/** `connected_at` -> `gg.aa.yyyy ss:dd`. Geçersiz tarih uydurulmaz. */
function formatDateTime(iso: string): string {
  const t = new Date(iso)
  if (Number.isNaN(t.getTime())) return UNKNOWN
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    `${pad(t.getDate())}.${pad(t.getMonth() + 1)}.${t.getFullYear()} ` +
    `${pad(t.getHours())}:${pad(t.getMinutes())}`
  )
}

async function fetchStats(): Promise<Stats> {
  const client = supabase
  if (!client) throw new Error('supabase yok')

  const [total, a24, a7, a30, versions, recent, events7d] = await Promise.all([
    client
      .from('app_installations')
      .select('id', { count: 'exact', head: true }),
    client
      .from('app_installations')
      .select('id', { count: 'exact', head: true })
      .gte('last_seen_at', sinceIso(24)),
    client
      .from('app_installations')
      .select('id', { count: 'exact', head: true })
      .gte('last_seen_at', sinceIso(24 * 7)),
    client
      .from('app_installations')
      .select('id', { count: 'exact', head: true })
      .gte('last_seen_at', sinceIso(24 * 30)),
    client.from('app_installations').select('app_version'),
    client
      .from('app_events')
      .select('id,created_at,event_type,app_version,platform')
      .order('created_at', { ascending: false })
      .limit(30),
    client
      .from('app_events')
      .select('created_at')
      .gte('created_at', sinceIso(24 * 7)),
  ])

  const firstError =
    total.error ?? a24.error ?? a7.error ?? a30.error ??
    versions.error ?? recent.error ?? events7d.error
  if (firstError) throw new Error(firstError.message)

  // Surum dagilimi (gercek veri; versiyon degistikce otomatik olusur).
  const counts = new Map<string, number>()
  for (const row of versions.data ?? []) {
    const key = row.app_version || 'bilinmiyor'
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  const versionList = [...counts.entries()]
    .map(([version, count]) => ({ version, count }))
    .sort((a, b) => b.count - a.count)

  // Son 7 gun gunluk olay yogunlugu.
  const daily: { label: string; count: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    start.setDate(start.getDate() - i)
    const end = new Date(start)
    end.setDate(end.getDate() + 1)
    const count = (events7d.data ?? []).filter((e) => {
      const t = new Date(e.created_at).getTime()
      return t >= start.getTime() && t < end.getTime()
    }).length
    daily.push({ label: `${String(start.getDate()).padStart(2, '0')}.${String(start.getMonth() + 1).padStart(2, '0')}`, count })
  }

  return {
    total: total.count ?? 0,
    active24h: a24.count ?? 0,
    active7d: a7.count ?? 0,
    active30d: a30.count ?? 0,
    versions: versionList,
    daily,
    recent: (recent.data ?? []).map((e) => ({
      id: e.id,
      createdAt: e.created_at,
      eventType: e.event_type,
      appVersion: e.app_version,
      platform: e.platform,
    })),
  }
}

function LoginCard({ onLogin }: { onLogin: (session: Session) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!supabase) return
    setBusy(true)
    setError(null)
    const { data, error: err } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    setBusy(false)
    if (err || !data.session) {
      setError(
        err?.message === 'Invalid login credentials'
          ? 'E-posta veya şifre hatalı.'
          : `Giriş başarısız: ${err?.message ?? 'bilinmeyen hata'}`,
      )
      return
    }
    onLogin(data.session)
  }

  return (
    <div className="admin__login card">
      <div className="admin__brand">
        KYRON <span>ADMIN</span>
      </div>
      <p className="admin__login-hint">
        Bu alan yalnızca yetkili yöneticiler içindir. Veriler Supabase Auth ve
        row-level security ile korunur.
      </p>
      <form onSubmit={handleSubmit} className="admin__form">
        <label className="admin__label" htmlFor="admin-email">
          E-posta
        </label>
        <input
          id="admin-email"
          className="admin__input"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <label className="admin__label" htmlFor="admin-password">
          Şifre
        </label>
        <input
          id="admin-password"
          className="admin__input"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <div className="admin__error">{error}</div>}
        <button className="btn btn--primary" type="submit" disabled={busy}>
          {busy ? 'Giriş yapılıyor…' : 'Giriş yap'}
        </button>
      </form>
    </div>
  )
}

function StatCard({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="admin__stat card">
      <div className="admin__stat-value">{value}</div>
      <div className="admin__stat-label">{label}</div>
      {hint && <div className="admin__stat-hint">{hint}</div>}
    </div>
  )
}

function Dashboard({ session, onLogout }: { session: Session; onLogout: () => void }) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Cihazlar / Son Bağlantılar AYRI yüklenir: migration henüz
  // uygulanmamışsa bu bölüm hata verse bile diğer bölümler bozulmaz.
  const [devices, setDevices] = useState<DeviceView[]>([])
  const [devicesError, setDevicesError] = useState<string | null>(null)
  const [devicesLoading, setDevicesLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setStats(await fetchStats())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Bilinmeyen hata')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadDevices = useCallback(async () => {
    setDevicesLoading(true)
    setDevicesError(null)
    try {
      const rows = await fetchDeviceConnections(supabase, session)
      setDevices(rows.map(toDeviceView))
    } catch (e) {
      setDevices([])
      setDevicesError(e instanceof Error ? e.message : 'Bilinmeyen hata')
    } finally {
      setDevicesLoading(false)
    }
  }, [session])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    loadDevices()
  }, [loadDevices])

  const maxDaily = Math.max(1, ...(stats?.daily.map((d) => d.count) ?? [1]))

  return (
    <div className="admin">
      <header className="admin__header">
        <div className="admin__brand">
          KYRON <span>ADMIN</span>
        </div>
        <div className="admin__header-right">
          <span className="admin__user">{session.user.email}</span>
          <button className="btn btn--ghost" onClick={onLogout}>
            Çıkış
          </button>
        </div>
      </header>

      <main className="admin__main">
        <h1 className="admin__title">Kurulum İstatistikleri</h1>
        <p className="admin__subtitle">
          Anonim kurulum telemetrisi — kişisel veri toplanmaz. Tanımlar: toplam =
          benzersiz kurulum; aktif = <code>last_seen_at</code> penceresi.
        </p>

        {loading && <div className="admin__notice">Yükleniyor…</div>}
        {error && (
          <div className="admin__error">
            Veri okunamadı: {error} — oturumunuzu yenileyin ya da RLS/admin
            ayarlarını kontrol edin.
          </div>
        )}

        {!loading && !error && stats && stats.total === 0 && (
          <div className="admin__empty card">
            <div className="admin__empty-title">Henüz veri yok</div>
            <p>
              Telemetri gönderen bir kurulum kaydedilmediğinde bu ekran
              gösterilir. Uygulama ilk açıldığında satırlar otomatik oluşur.
            </p>
          </div>
        )}

        {!loading && !error && stats && stats.total > 0 && (
          <>
            <section className="admin__stats">
              <StatCard label="Toplam benzersiz kurulum" value={stats.total} />
              <StatCard label="Son 24 saat aktif kurulum" value={stats.active24h} />
              <StatCard label="Son 7 gün aktif kurulum" value={stats.active7d} />
              <StatCard label="Son 30 gün aktif kurulum" value={stats.active30d} />
            </section>

            <div className="admin__grid2">
              <section className="admin__panel card">
                <h2 className="admin__panel-title">APP VERSIONS</h2>
                {stats.versions.length === 0 ? (
                  <div className="admin__muted">Sürüm verisi yok</div>
                ) : (
                  <ul className="admin__versions">
                    {stats.versions.map((v) => {
                      const { version, build } = splitVersion(v.version)
                      return (
                        <li key={v.version}>
                          <span className="admin__mono">
                            v{version}
                            {build && <span className="admin__build">+{build}</span>}
                          </span>
                          <span className="admin__bar">
                            <span
                              className="admin__bar-fill"
                              style={{
                                width: `${Math.max(6, (v.count / stats.versions[0].count) * 100)}%`,
                              }}
                            />
                          </span>
                          <span className="admin__count">{v.count}</span>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </section>

              <section className="admin__panel card">
                <h2 className="admin__panel-title">SON 7 GÜN OLAY</h2>
                <div className="admin__daily">
                  {stats.daily.map((d) => (
                    <div className="admin__daily-col" key={d.label}>
                      <div className="admin__daily-count">{d.count}</div>
                      <div className="admin__daily-bar-track">
                        <div
                          className="admin__daily-bar"
                          style={{ height: `${(d.count / maxDaily) * 100}%` }}
                        />
                      </div>
                      <div className="admin__daily-label">{d.label}</div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <section className="admin__panel card">
              <h2 className="admin__panel-title">RECENT ACTIVITY</h2>
              <div className="admin__events">
                {stats.recent.length === 0 && (
                  <div className="admin__muted">Henüz olay kaydı yok</div>
                )}
                {(() => {
                  let lastDay = ''
                  return stats.recent.map((e) => {
                    const d = new Date(e.createdAt)
                    const label = dayLabel(d)
                    const newDay = label !== lastDay
                    lastDay = label
                    const hhmm = `${String(d.getHours()).padStart(2, '0')}:${String(
                      d.getMinutes(),
                    ).padStart(2, '0')}`
                    const { version, build } = splitVersion(e.appVersion)
                    return (
                      <div className="admin__event-row" key={e.id}>
                        <span className="admin__event-day">
                          {newDay && <strong>{label}</strong>}
                        </span>
                        <span className="admin__mono admin__event-time">{hhmm}</span>
                        <span
                          className={`admin__badge admin__badge--${e.eventType === 'app_update' ? 'update' : 'open'}`}
                        >
                          {e.eventType}
                        </span>
                        <span className="admin__mono">
                          v{version}
                          {build ? `+${build}` : ''}
                        </span>
                        <span className="admin__muted">{e.platform}</span>
                      </div>
                    )
                  })
                })()}
              </div>
            </section>

            <section className="admin__panel card">
              <h2 className="admin__panel-title">CİHAZLAR / SON BAĞLANTILAR</h2>
              <p className="admin__muted admin__devices-note">
                IP ve cihaz bilgisi yalnızca güvenlik, hata ayıklama ve bağlantı
                geçmişi içindir. IP <strong>{IP_RETENTION_DAYS} gün</strong>,
                bağlantı kaydı <strong>{CONNECTION_RETENTION_DAYS} gün</strong>{' '}
                sonra otomatik temizlenir. Eksik alanlar uydurulmaz.
              </p>

              {devicesLoading && (
                <div className="admin__muted">Cihazlar yükleniyor…</div>
              )}

              {!devicesLoading && devicesError && (
                <div className="admin__error">
                  Cihazlar okunamadı: {devicesError} — migration uygulanmış mı
                  ve hesabınız <code>admin_users</code> içinde mi kontrol edin.
                  Diğer bölümler etkilenmez.
                </div>
              )}

              {!devicesLoading && !devicesError && (
                <>
                  {devices.length === 0 ? (
                    <div className="admin__muted">Kayıt yok</div>
                  ) : (
                    <div className="admin__devices-scroll">
                      <table className="admin__devices">
                        <thead>
                          <tr>
                            <th>IP</th>
                            <th>Üretici</th>
                            <th>Model</th>
                            <th>Android</th>
                            <th>KYRON</th>
                            <th>Platform</th>
                            <th>Son bağlantı</th>
                            <th>Oturum</th>
                          </tr>
                        </thead>
                        <tbody>
                          {devices.map((d) => (
                            <tr key={d.id}>
                              <td className="admin__mono">{d.ip}</td>
                              <td>{d.manufacturer}</td>
                              <td>{d.model}</td>
                              <td className="admin__mono">{d.androidVersion}</td>
                              <td className="admin__mono">{d.appVersion}</td>
                              <td className="admin__muted">{d.platform}</td>
                              <td className="admin__mono">
                                {formatDateTime(d.connectedAt)}
                              </td>
                              <td className="admin__mono">{d.sessionRef}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  )
}

export default function Admin() {
  const [session, setSession] = useState<Session | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (!supabase) {
      setChecking(false)
      return
    }
    let alive = true
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return
      setSession(data.session ?? null)
      setChecking(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next ?? null)
    })
    return () => {
      alive = false
      sub.subscription.unsubscribe()
    }
  }, [])

  async function logout() {
    await supabase?.auth.signOut()
    setSession(null)
  }

  if (!supabaseConfigured) {
    return (
      <div className="admin">
        <main className="admin__main">
          <div className="admin__empty card">
            <div className="admin__empty-title">Yapılandırma eksik</div>
            <p>
              <code>VITE_SUPABASE_URL</code> ve{' '}
              <code>VITE_SUPABASE_ANON_KEY</code> tanımlı değil. Devam etmek
              için <code>.env.local</code> dosyasını oluşturun (bkz.{' '}
              <code>.env.example</code>).
            </p>
          </div>
        </main>
      </div>
    )
  }

  if (checking) {
    return (
      <div className="admin">
        <main className="admin__main">
          <div className="admin__notice">Oturum kontrol ediliyor…</div>
        </main>
      </div>
    )
  }

  if (!session) return <LoginCard onLogin={setSession} />

  return <Dashboard session={session} onLogout={logout} />
}
