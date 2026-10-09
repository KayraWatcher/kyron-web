/**
 * Cihazlar / Son Bağlantılar — GERÇEK SQL davranış testleri (PGlite/WASM Postgres).
 *
 * Migration'lar yerel bir Postgres'e birebir uygulanır ve fonksiyonlar gerçekten
 * çalıştırılır. Supabase canlı projesi kullanılmaz (service-role anahtarı yok);
 * `auth.uid()` + roller bir taklit ortamda hazırlanır.
 *
 * Kapsanan senaryolar:
 *   1) IP SAHTECİLİĞİ      — güvenilir proxy başlığı dışındaki hiçbir kaynak
 *                            IP üretmez; sahte X-Forwarded-For girdileri yok
 *                            sayılır; RPC'de IP parametresi yoktur.
 *   2) YETKİSİZ ERİŞİM     — anon ve admin-olmayan authenticated rol satır
 *                            göremez, sahte satır SOKAMAZ.
 *   3) EKSİK CİHAZ BİLGİSİ — null/unknown alanlar null kalır, UYDURULMAZ.
 *   4) KAYIT LİSTELENMESİ  — RPC kaydı üretir, admin en yeniden eskiye okur.
 *   + Saklama süresi (IP 30 gün / kayıt 90 gün) ve 1-saat tekrar sınırı.
 */
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { after, before, describe, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { PGlite } from '@electric-sql/pglite'

const here = path.dirname(fileURLToPath(import.meta.url))
const migrationsDir = path.resolve(here, '../../supabase/migrations')

const migrationFiles = readdirSync(migrationsDir)
  .filter((f) => f.endsWith('.sql'))
  .sort()

/**
 * Canlı Supabase projesinde var olan, repo'daki migration'larda OLMAYAN
 * taban şema (kurulum SQL'i ayrı tutulmuş). Burada birebir hazırlanır.
 */
const BASELINE_SQL = `
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin;
  end if;
end $$;

grant usage on schema public to anon, authenticated, service_role;

-- Supabase'in varsayılan davranışı: yeni tablolar anon/authenticated'e yetki
-- verir; ASIL koruma RLS'tir. (Yetki verilir, satır politikası ile sınırılır.)
alter default privileges in schema public
  grant all on tables to anon, authenticated, service_role;

-- Supabase auth.uid() taklidi (request.jwt.claims GUC'unu okur).
create schema if not exists auth;
grant usage on schema auth to anon, authenticated, service_role;
create or replace function auth.uid() returns uuid
language sql stable
as $$
  select nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'sub', '')::uuid
$$;

create table if not exists public.admin_users (
  user_id uuid primary key
);

create or replace function public.is_admin() returns boolean
language sql stable
as $$
  select exists (select 1 from public.admin_users a where a.user_id = auth.uid())
$$;

create or replace function public.update_updated_at_column()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create table if not exists public.app_installations (
  id               uuid primary key default gen_random_uuid(),
  installation_id  text not null unique,
  platform         text not null,
  app_version      text not null,
  first_seen_at    timestamptz not null default now(),
  last_seen_at     timestamptz not null default now()
);

create table if not exists public.app_events (
  id               uuid primary key default gen_random_uuid(),
  installation_id  text not null,
  event_type       text not null,
  app_version      text not null,
  platform         text not null,
  created_at       timestamptz not null default now()
);

grant all on public.app_installations, public.app_events, public.admin_users
  to anon, authenticated, service_role;
`

const ADMIN_UUID = '11111111-2222-4333-8444-555555555555'
const OTHER_UUID = '99999999-8888-4777-8666-555555555555'

let db: PGlite

/** PostgREST'in yaptığı gibi istek başlıklarını oturum boyunca ayarlar. */
async function setHeaders(headers: Record<string, string> | null): Promise<void> {
  await db.query(`select set_config('request.headers', $1, false)`, [
    headers === null ? '' : JSON.stringify(headers),
  ])
}

/** Supabase'in yaptığı gibi JWT oturumunu (sub) ayarlar. */
async function setJwtSub(sub: string | null): Promise<void> {
  await db.query(`select set_config('request.jwt.claims', $1, false)`, [
    sub === null ? '{}' : JSON.stringify({ sub }),
  ])
}

async function countRows(where = ''): Promise<number> {
  const r = await db.query<{ n: string }>(
    `select count(*)::text as n from public.device_connections ${where}`,
  )
  return Number(r.rows[0].n)
}

async function getRow(installationId: string) {
  const r = await db.query<Record<string, unknown>>(
    `select * from public.device_connections where installation_id = $1
      order by connected_at desc limit 1`,
    [installationId],
  )
  return r.rows[0] ?? null
}

// Tüm dosya boyunca tek bir yerel Postgres: migration'lar bir kez uygulanır.
before(async () => {
  db = new PGlite()
  await db.exec(BASELINE_SQL)
  for (const file of migrationFiles) {
    await db.exec(readFileSync(path.join(migrationsDir, file), 'utf8'))
  }
})

after(async () => {
  await db.close()
})

describe('migration + taban şema', () => {
  test('tablolar, index ve RLS hazır', async () => {
    const t = await db.query<{ relrowsecurity: boolean }>(
      `select c.relrowsecurity
         from pg_class c
         join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relname = 'device_connections'`,
    )
    assert.equal(t.rows.length, 1)
    assert.equal(t.rows[0].relrowsecurity, true, 'RLS açık olmalı')

    const idx = await db.query<{ indexname: string }>(
      `select indexname from pg_indexes
        where schemaname = 'public' and tablename = 'device_connections'`,
    )
    const names = idx.rows.map((r) => r.indexname)
    assert.ok(names.includes('device_connections_connected_at_idx'))
    assert.ok(names.includes('device_connections_installation_idx'))
  })

  test('telemetry_ping TEK imza ve IP parametresi içermiyor', async () => {
    const r = await db.query<{ args: string }>(
      `select pg_get_function_identity_arguments(p.oid) as args
         from pg_proc p
         join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public' and p.proname = 'telemetry_ping'`,
    )
    assert.equal(r.rows.length, 1, 'çakışan (overload) ikinci fonksiyon olmamalı')

    const args = r.rows[0].args
    const ipArgs = args
      .split(',')
      .map((a) => a.trim().split(/\s+/)[0])
      .filter((a) => a.toLowerCase().includes('ip'))
    assert.deepEqual(ipArgs, [], `IP istemciden alınamaz: ${ipArgs}`)

    for (const expected of ['p_device_manufacturer', 'p_device_model', 'p_android_version']) {
      assert.ok(args.includes(expected), `${expected} imzada olmalı`)
    }
  })
})

describe('1) IP sahteciliği', () => {
  test('istemcinin sahte X-Forwarded-For girdisi yok sayılır', async () => {
    // Güvenilir proxy, istemcinin gönderdiği değerin SAĞINA gerçek IP'yi yazar.
    await setHeaders({ 'x-forwarded-for': '8.8.8.8, 195.12.34.7' })
    const r = await db.query<{ ip: string | null }>(
      `select public._kyron_client_ip() as ip`,
    )
    assert.equal(
      r.rows[0].ip,
      '195.12.34.7',
      'soldaki sahte giriş asla seçilmemeli (en sağdaki = güvenilir hop)',
    )
  })

  test('tek güvenilir hop olduğu kabul edilir', async () => {
    await setHeaders({ 'x-forwarded-for': '1.2.3.4' })
    const r = await db.query<{ ip: string | null }>(
      `select public._kyron_client_ip() as ip`,
    )
    assert.equal(r.rows[0].ip, '1.2.3.4')
  })

  test('geçersiz IP üretilmez -> null (Bilinmiyor)', async () => {
    await setHeaders({ 'x-forwarded-for': '999.999.999.999, 195.12.34.7' })
    const r1 = await db.query<{ ip: string | null }>(
      `select public._kyron_client_ip() as ip`,
    )
    assert.equal(r1.rows[0].ip, '195.12.34.7')

    await setHeaders({ 'x-forwarded-for': 'sadece-bir-metin' })
    const r2 = await db.query<{ ip: string | null }>(
      `select public._kyron_client_ip() as ip`,
    )
    assert.equal(r2.rows[0].ip, null, 'geçersiz değer uydurulmamalı')
  })

  test('başlık yoksa / JSON değilse IP null kalır', async () => {
    await setHeaders({})
    const r1 = await db.query<{ ip: string | null }>(
      `select public._kyron_client_ip() as ip`,
    )
    assert.equal(r1.rows[0].ip, null)

    await setHeaders(null)
    const r2 = await db.query<{ ip: string | null }>(
      `select public._kyron_client_ip() as ip`,
    )
    assert.equal(r2.rows[0].ip, null)

    await db.query(`select set_config('request.headers', $1, false)`, ['bozuk-json'])
    const r3 = await db.query<{ ip: string | null }>(
      `select public._kyron_client_ip() as ip`,
    )
    assert.equal(r3.rows[0].ip, null, 'bozuk başlık çökmemeli, IP uydurmamalı')
  })

  test('RPC, gövdede IP yokken güvenilir başlıktan IP yazar', async () => {
    await setHeaders({ 'x-forwarded-for': '8.8.8.8, 195.12.34.7' })
    await db.query(
      `select public.telemetry_ping(
         'device-ip-test-1', 'android', '1.3.1+5', 'app_open', null,
         'Xiaomi', 'M2101K6G', '14')`,
    )
    const row = await getRow('device-ip-test-1')
    assert.ok(row, 'bağlantı kaydı oluşmalı')
    assert.equal(row.client_ip, '195.12.34.7')
    assert.equal(row.device_manufacturer, 'Xiaomi')
    assert.equal(row.device_model, 'M2101K6G')
    assert.equal(row.android_version, '14')
    assert.equal(row.app_version, '1.3.1+5')
    assert.equal(row.platform, 'android')
  })

  test('aynı kurulum için 1 saatte 1 kayıt (gereksiz geçmiş üretilmez)', async () => {
    const started = await countRows(`where installation_id = 'device-throttle-1'`)
    await setHeaders({ 'x-forwarded-for': '195.12.34.7' })
    for (let i = 0; i < 3; i++) {
      await db.query(
        `select public.telemetry_ping('device-throttle-1', 'android', '1.3.1+5', 'app_open')`,
      )
    }
    const ended = await countRows(`where installation_id = 'device-throttle-1'`)
    assert.equal(ended - started, 1, 'aynı saat içinde tekrar satır açılmamalı')

    // 1 saatten eski bir kayıt varsa yenisi açılabilir.
    await db.query(
      `insert into public.device_connections
         (installation_id, platform, app_version, connected_at)
       values ('device-throttle-2', 'android', '1.2.0', now() - interval '2 hours')`,
    )
    await db.query(
      `select public.telemetry_ping('device-throttle-2', 'android', '1.3.1+5', 'app_open')`,
    )
    const t2 = await countRows(`where installation_id = 'device-throttle-2'`)
    assert.equal(t2, 2, 'eski kayıt varken yenisi açılmalı')
  })
})

describe('3) Eksik cihaz bilgisi', () => {
  test('null/unknown/boş alanlar NULL kalır — tahmin edilmez', async () => {
    await setHeaders({ 'x-forwarded-for': '195.12.34.7' })
    await db.query(
      `select public.telemetry_ping(
         'device-missing-1', 'android', '1.3.1+5', null, null,
         'unknown', null, '   ')`,
    )
    const row = await getRow('device-missing-1')
    assert.ok(row)
    assert.equal(row.device_manufacturer, null, '"unknown" bilinmiyor sayılmalı')
    assert.equal(row.device_model, null)
    assert.equal(row.android_version, null, 'boşluk bilinmiyor sayılmalı')
    assert.equal(row.client_ip, '195.12.34.7')
  })

  test('başlık da yoksa IP null kalır', async () => {
    await setHeaders({})
    await db.query(
      `select public.telemetry_ping(
         'device-missing-2', 'android', '1.3.1+5', null, null, null, null, null)`,
    )
    const row = await getRow('device-missing-2')
    assert.ok(row)
    assert.equal(row.client_ip, null, 'IP uydurulmamalı')
    assert.equal(row.device_manufacturer, null)
    assert.equal(row.device_model, null)
    assert.equal(row.android_version, null)
  })

  test('eski istemci (cihaz alanız) hâlâ çalışır', async () => {
    await setHeaders({ 'x-forwarded-for': '195.12.34.7' })
    await db.query(
      `select public.telemetry_ping('device-legacy-1', 'android', '1.3.0+4', 'app_open')`,
    )
    const row = await getRow('device-legacy-1')
    assert.ok(row, 'migration sonrası eski imza da kayıt üretmeli')
    assert.equal(row.device_manufacturer, null)
    assert.equal(row.client_ip, '195.12.34.7')
  })
})

describe('2) Yetkisiz erişim (RLS)', () => {
  test('anon satır göremez ve sahte satır SOKAMAZ', async () => {
    await setJwtSub(null)
    await db.exec('set role anon')
    try {
      const visible = await countRows()
      assert.equal(visible, 0, 'anon tek satır bile görmemeli')

      const before = await countRows()
      try {
        await db.query(
          `insert into public.device_connections
             (installation_id, platform, app_version, client_ip)
           values ('spoof-anon-1', 'android', '1.3.1+5', '8.8.8.8')`,
        )
      } catch {
        // Politika yoksa hata da dönmektedir — ikisi de kabul edilebilir.
      }
      const after = await countRows()
      assert.equal(after, before, 'anon sahte kayıt SOKAMAMALI')
    } finally {
      await db.exec('reset role')
    }
  })

  test('admin olmayan authenticated kullanıcı satır göremez', async () => {
    await setJwtSub(OTHER_UUID)
    await db.exec('set role authenticated')
    try {
      const visible = await countRows()
      assert.equal(visible, 0, 'admin olmayan tek satır bile görmemeli')
    } finally {
      await db.exec('reset role')
    }
  })

  test('admin_users içindeki kullanıcı satırları görebilir', async () => {
    await db.query(
      `insert into public.admin_users (user_id) values ($1)
         on conflict (user_id) do nothing`,
      [ADMIN_UUID],
    )
    await setJwtSub(ADMIN_UUID)
    await db.exec('set role authenticated')
    try {
      const visible = await countRows()
      assert.ok(visible > 0, 'admin kayıtları görebilmeli')
    } finally {
      await db.exec('reset role')
      await setJwtSub(null)
    }
  })
})

describe('4) Kayıtların listelenmesi', () => {
  before(async () => {
    // Kronolojik olarak bilinen üç kayıt (RPC zaten bazı satırlar açtı).
    await db.query(
      `insert into public.device_connections
         (installation_id, platform, app_version,
          device_manufacturer, device_model, android_version,
          client_ip, connected_at)
       values
         ('list-old',   'android', '1.2.0', 'Samsung', 'SM-G991B', '13', '195.12.34.7',
          '2026-10-01T09:00:00Z'),
         ('list-mid',   'android', '1.3.0', null,       null,       null, null,
          '2026-10-05T09:00:00Z'),
         ('list-new',   'android', '1.3.1+5','Xiaomi',  '23127PN0CG','14', '195.12.34.7',
          '2026-10-09T09:00:00Z')`,
    )
  })

  test('admin en yeniden eskiye okur, tüm alanlar taşınır', async () => {
    await setJwtSub(ADMIN_UUID)
    await db.exec('set role authenticated')
    try {
      const r = await db.query<Record<string, unknown>>(
        `select id, installation_id, platform, app_version,
                device_manufacturer, device_model, android_version,
                client_ip, connected_at
           from public.device_connections
          order by connected_at desc
          limit 100`,
      )
      assert.ok(r.rows.length > 0)

      const ids = r.rows.map((x) => x.installation_id)
      const iNew = ids.indexOf('list-new')
      const iMid = ids.indexOf('list-mid')
      const iOld = ids.indexOf('list-old')
      assert.ok(iNew >= 0 && iMid >= 0 && iOld >= 0, 'üç kayıt da listelenmeli')
      assert.ok(iNew < iMid, 'en yeni en üstte')
      assert.ok(iMid < iOld, 'sıralama bozulmamalı')

      const first = r.rows[0]
      assert.equal(typeof first.id, 'string')
      assert.equal(first.connected_at != null, true)

      // Eksik cihaz bilgisi korunur (null), "Bilinmiyor" dönüşümü UI katmanında.
      const mid = r.rows[iMid]
      assert.equal(mid.device_manufacturer, null)
      assert.equal(mid.device_model, null)
      assert.equal(mid.android_version, null)
      assert.equal(mid.client_ip, null)
    } finally {
      await db.exec('reset role')
      await setJwtSub(null)
    }
  })
})

describe('Saklama süresi', () => {
  test('IP 30 gün, tam kayıt 90 gün sonra temizlenir', async () => {
    await db.query(
      `insert into public.device_connections
         (installation_id, platform, app_version, client_ip, connected_at)
       values
         ('keep-10d',  'android', '1.3.1+5', '195.12.34.7', now() - interval '10 days'),
         ('ip-old-40d','android', '1.3.1+5', '195.12.34.7', now() - interval '40 days'),
         ('gone-100d', 'android', '1.2.0',   '195.12.34.7', now() - interval '100 days')`,
    )

    await db.query(`select public.purge_device_connections()`)

    const keep = await getRow('keep-10d')
    assert.ok(keep, '10 günlük kayıt kalmalı')
    assert.equal(keep.client_ip, '195.12.34.7', '30 günden yeni IP saklanmalı')

    const ipOld = await getRow('ip-old-40d')
    assert.ok(ipOld, '40 günlük kayıt silinmemeli (90 gün dolmadı)')
    assert.equal(ipOld.client_ip, null, '30 günden eski IP anonimleştirilmeli')

    const gone = await getRow('gone-100d')
    assert.equal(gone, null, '90 günden eski kayıt silinmeli')
  })

  test('telemetry_ping içinde de saklama uygulanır', async () => {
    await db.query(
      `insert into public.device_connections
         (installation_id, platform, app_version, client_ip, connected_at)
       values ('gone-via-ping', 'android', '1.2.0', '195.12.34.7',
               now() - interval '120 days')`,
    )
    await setHeaders({ 'x-forwarded-for': '195.12.34.7' })
    await db.query(
      `select public.telemetry_ping('purge-via-ping-1', 'android', '1.3.1+5', 'app_open')`,
    )
    assert.equal(await getRow('gone-via-ping'), null, 'RPC eski kaydı temizlemeli')
    assert.ok(await getRow('purge-via-ping-1'), 'yeni kayıt korunmalı')
  })
})
