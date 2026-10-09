/**
 * Cihazlar / Son Bağlantılar — birim + sözleşmeler.
 *
 * Kapsanan senaryolar:
 *   1. IP SAHTECİLİĞİ        — istemcide IP üretilemeyeceği + migration
 *                              sözleşmesi (IP parametresi yok, tek kaynak
 *                              güvenilir proxy başlığı, RLS, saklama).
 *   2. YETKİSİZ ADMIN ERİŞİMİ— oturumsuz sorgu hiç çalıştırılmaz.
 *   3. EKSİK CİHAZ BİLGİSİ   — "Bilinmiyor", tahmin yok.
 *   4. KAYIT LİSTELENMESİ    — satırlar eksiksiz + oturum maskeli.
 *
 * SQL'in davranışsal testi `sql.test.ts` (PGlite/Postgres) içindedir.
 */
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { test, describe } from 'node:test'
import { fileURLToPath } from 'node:url'

import {
  CONNECTION_RETENTION_DAYS,
  DEVICE_FETCH_LIMIT,
  IP_RETENTION_DAYS,
  UNKNOWN,
  displayValue,
  fetchDeviceConnections,
  maskSession,
  toDeviceView,
  type DeviceConnectionRow,
} from '../src/lib/devices.ts'

const here = path.dirname(fileURLToPath(import.meta.url))
const migrationsDir = path.resolve(here, '../../supabase/migrations')

function allMigrations(): string {
  return readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .map((f) => readFileSync(path.join(migrationsDir, f), 'utf8'))
    .join('\n---FILE---\n')
}

const migration = allMigrations()

/** SQL `--` yorumlarını atar: kod incelemesi yalnızca gerçek koda baksın. */
function stripSqlComments(sql: string): string {
  return sql
    .split('\n')
    .map((line) =>
      line.trimStart().startsWith('--') ? '' : line.replace(/\s--.*$/, ''),
    )
    .join('\n')
}

const migrationCode = stripSqlComments(migration)

function row(over: Partial<DeviceConnectionRow> = {}): DeviceConnectionRow {
  return {
    id: 'row-1',
    installation_id: '0f4a6c1e-93b2-4f7a-8c11-2b6d9e5a7f30',
    platform: 'android',
    app_version: '1.3.1+5',
    device_manufacturer: 'Xiaomi',
    device_model: '23127PN0CG',
    android_version: '14',
    client_ip: '195.12.34.7',
    connected_at: '2026-10-09T12:34:00.000Z',
    ...over,
  }
}

/** Sahte Supabase istemcisi: `from` çağrılırsa patlar (gate testi için). */
function explodingClient() {
  return {
    from(): never {
      throw new Error('OTURUM YOKKEN SORGU CALISTIRILMAMALI')
    },
  } as never
}

describe('1) IP sahteciliği', () => {
  test('migration: telemetry_ping içinde IP parametresi YOK', () => {
    const m = migration.match(
      /create function public\.telemetry_ping\(([\s\S]*?)\)\s*\nreturns void/,
    )
    assert.ok(m, 'telemetry_ping tanımı bulunamadı')
    const params = m[1]
      .split(',')
      .map((p) => p.trim().split(/\s+/)[0])
      .filter(Boolean)

    const ipParams = params.filter((p) => p.toLowerCase().includes('ip'))
    assert.deepEqual(
      ipParams,
      [],
      `IP istemciden alınamaz; IP parametresi olmamalı. Bulunan: ${ipParams}`,
    )
    // Cihaz bilgisi istemcidendir (cihazın kendi bilgisi), IP değildir.
    for (const expected of [
      'p_device_manufacturer',
      'p_device_model',
      'p_android_version',
    ]) {
      assert.ok(params.includes(expected), `${expected} imzada olmalı`)
    }
  })

  test('migration: tek IP kaynağı güvenilir proxy başlığı (X-Forwarded-For)', () => {
    assert.ok(
      migration.includes("h->>'x-forwarded-for'"),
      'IP yalnızca request.headers -> x-forwarded-for okunmalı',
    )
    assert.ok(
      migration.includes('reverse'),
      'Zincirin EN SAĞINDAKİ (güvenilir hop) giriş seçilmeli — soldaki sahte girişler okunmaz',
    )
    // Gövdeden IP okuyan bir ifade olmamalı (yorumlar hariç).
    assert.equal(
      /p_ip\b|body->>'ip'|_ip'\s*,/.test(migrationCode),
      false,
      'İstemci gövdesinden IP okunuyor',
    )
  })

  test('migration: RLS açık ve okuma yalnızca admin', () => {
    assert.ok(
      migration.includes('alter table public.device_connections enable row level security'),
    )
    assert.ok(migration.includes('using (public.is_admin())'))
    // Yanlışlıkla politika eklenmemiş olmalı: yazım yalnızca security definer.
    assert.equal(
      /create policy[^;]*on public\.device_connections[\s\S]{0,80}for\s+(insert|update|delete)/i.test(
        migrationCode,
      ),
      false,
      'device_connections için INSERT/UPDATE/DELETE politikası olmamalı',
    )
  })

  test('migration: saklama süresi tanımlı ve temizlik fonksiyonu var', () => {
    assert.equal(IP_RETENTION_DAYS, 30)
    assert.equal(CONNECTION_RETENTION_DAYS, 90)
    assert.ok(migration.includes("interval '30 days'"), 'IP saklama süresi yok')
    assert.ok(migration.includes("interval '90 days'"), 'kayıt saklama süresi yok')
    assert.ok(
      migration.includes('public.purge_device_connections()'),
      'temizlik fonksiyonu yok',
    )
    // Gizli veri loglaması olmamalı.
    assert.equal(
      /raise (notice|log)\s+\w*\s*.*(password|token|api[_ ]?key)/i.test(migrationCode),
      false,
    )
  })

  test('gövdede IP alanı yok + oturum maskeli', () => {
    const v = toDeviceView(row({ client_ip: null }))
    assert.equal(v.ip, UNKNOWN)

    const full = '0f4a6c1e-93b2-4f7a-8c11-2b6d9e5a7f30'
    assert.equal(maskSession(full), '0f4a6c1e…')
    assert.equal(maskSession(full).includes(full), false, 'tam uuid açılmamalı')
    assert.equal(maskSession(null), UNKNOWN)
    assert.equal(maskSession('   '), UNKNOWN)
  })
})

describe('2) Yetkisiz admin erişimi', () => {
  test('oturum yokken sorgu HİÇ çalıştırılmaz (istek bile atılmaz)', async () => {
    await assert.rejects(
      () => fetchDeviceConnections(explodingClient(), null),
      /oturum yok/,
      'oturumsuz çağrı engellenmeli',
    )
  })

  test('supabase yapılandırılmamışken hata verir, sorgu çalışmaz', async () => {
    await assert.rejects(
      () => fetchDeviceConnections(null, { user: { id: 'u1' } } as never),
      /yapılandırması yok/,
    )
  })

  test('limit daraltılır (minimum kapsam)', async () => {
    let asked: number | null = null
    const client = {
      from: () => ({
        select: () => ({
          order: () => ({
            limit: (n: number) => {
              asked = n
              return Promise.resolve({ data: [], error: null })
            },
          }),
        }),
      }),
    } as never

    await fetchDeviceConnections(client, { user: { id: 'u1' } } as never, 99_999)
    assert.equal(asked, DEVICE_FETCH_LIMIT, 'limit aşılmamalı')

    await fetchDeviceConnections(client, { user: { id: 'u1' } } as never, -5)
    assert.equal(asked, 1, 'negatif/sıfır limit geçersiz olmalı')
  })

  test('sunucu hatası yutulmaz, çağırıcıya iletilir', async () => {
    const client = {
      from: () => ({
        select: () => ({
          order: () => ({
            limit: () =>
              Promise.resolve({ data: null, error: { message: 'RLS denies' } }),
          }),
        }),
      }),
    } as never
    await assert.rejects(
      () => fetchDeviceConnections(client, { user: { id: 'u1' } } as never),
      /RLS denies/,
    )
  })
})

describe('3) Eksik cihaz bilgisi', () => {
  test('null/boş/unknown alanlar "Bilinmiyor" olur, değer UYDURULMAZ', () => {
    const v = toDeviceView(
      row({
        device_manufacturer: null,
        device_model: 'unknown',
        android_version: '   ',
        client_ip: null,
      }),
    )
    assert.equal(v.manufacturer, UNKNOWN)
    assert.equal(v.model, UNKNOWN)
    assert.equal(v.androidVersion, UNKNOWN)
    assert.equal(v.ip, UNKNOWN)

    const empty = toDeviceView(
      row({
        device_manufacturer: null,
        device_model: null,
        android_version: null,
        client_ip: null,
        app_version: '',
        platform: 'n/a',
      }),
    )
    assert.deepEqual(Object.values(empty).filter((x) => x === ''), [])
    assert.equal(empty.appVersion, UNKNOWN)
    assert.equal(empty.platform, UNKNOWN)
  })

  test('displayValue hiçbir zaman boş metin döndürmez', () => {
    for (const input of [null, undefined, '', '  ', 'unknown', 'NONE', 'N/A', '-']) {
      assert.equal(displayValue(input), UNKNOWN, `girdi: ${String(input)}`)
    }
    assert.equal(displayValue(' Xiaomi '), 'Xiaomi')
  })
})

describe('4) Kayıtların listelenmesi', () => {
  test('tüm alanlar satıra aynen yansır', () => {
    const v = toDeviceView(row())
    assert.equal(v.ip, '195.12.34.7')
    assert.equal(v.manufacturer, 'Xiaomi')
    assert.equal(v.model, '23127PN0CG')
    assert.equal(v.androidVersion, '14')
    assert.equal(v.appVersion, '1.3.1+5')
    assert.equal(v.platform, 'android')
    assert.equal(v.connectedAt, '2026-10-09T12:34:00.000Z')
    assert.equal(v.sessionRef, '0f4a6c1e…')
    assert.equal(v.id, 'row-1')
  })

  test('hiçbir alan undefined kalmaz (UI crashesız)', () => {
    const v = toDeviceView(
      row({
        device_manufacturer: null,
        device_model: null,
        android_version: null,
        client_ip: null,
      }),
    )
    for (const value of Object.values(v)) {
      assert.notEqual(value, undefined)
      assert.equal(typeof value, 'string')
    }
  })

  test('sorgu doğru kolonları ve sıralamayı kullanır', async () => {
    let sql: { cols: string; table: string; order: string; limit: number } | null = null
    const client = {
      from: (table: string) => ({
        select: (cols: string) => ({
          order: (order: string) => ({
            limit: (limit: number) => {
              sql = { cols, table, order, limit }
              return Promise.resolve({ data: [row()], error: null })
            },
          }),
        }),
      }),
    } as never

    const rows = await fetchDeviceConnections(
      client,
      { user: { id: 'u1' } } as never,
    )
    assert.ok(sql)
    assert.equal(sql.table, 'device_connections')
    assert.ok(sql.cols.includes('connected_at'))
    assert.ok(sql.cols.includes('client_ip'))
    assert.equal(sql.order, 'connected_at')
    assert.equal(rows.length, 1)
    assert.equal(toDeviceView(rows[0]).ip, '195.12.34.7')
  })
})
