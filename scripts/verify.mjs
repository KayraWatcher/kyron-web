/**
 * KYRON web - headless dogrulama (FAZ 15).
 * Sistem Chrome'u (puppeteer-core) ile gercek tarayici testleri:
 *   1. Ana sayfa tasarimi ayakta + admin route'u menude GIZLI
 *   2. #/admin -> yapilandirma yokken veri gostermez (gate)
 *   3. #/gizlilik ve bilinmeyen route calisiyor
 *   4. Mobil (375px) responsive: yatay tasma yok
 *
 * Kullanim:  npm run dev  (ayri pencerede)  ->  node scripts/verify.mjs
 * Supabase .env.local doldurulduktan sonra ek senaryolar eklenebilir.
 */
import puppeteer from 'puppeteer-core'

const BASE = process.env.VERIFY_BASE || 'http://localhost:5173'
const CHROME =
  process.env.CHROME_PATH ||
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'

const results = []
function check(name, ok, detail = '') {
  results.push({ name, ok, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'} - ${name}${detail ? ` (${detail})` : ''}`)
}

async function textOf(page) {
  return page.evaluate(() => document.body.innerText)
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu'],
})

try {
  const page = await browser.newPage()
  page.setDefaultTimeout(15000)

  // ---- 1) Ana sayfa: tasarim + gizli admin route ----
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle0' })
  let text = await textOf(page)
  check('ana sayfa yukleniyor', text.includes('KYRON'), 'baslik')
  check(
    'ana sayfa icerigi yerinde (menu + hero + footer)',
    text.includes('Gizlilik') && text.includes('Kullanım'),
    'yasal linkler',
  )
  check(
    'admin route menude/linkte GIZLI',
    !page.url().includes('admin') && !text.includes('KYRON ADMIN'),
    'gizli route',
  )
  const navHasAdmin = await page.evaluate(
    () => document.body.innerHTML.includes('#/admin'),
  )
  check('hicbir yerde #/admin linki yok', !navHasAdmin)

  // ---- 2) #/admin gate (env yoksa veri YOK) ----
  await page.goto(`${BASE}/#/admin`, { waitUntil: 'networkidle0' })
  text = await textOf(page)
  check(
    'admin route aciliyor',
    page.url().includes('/admin'),
    'hash route',
  )
  const unconfigured = text.includes('Yapılandırma eksik')
  if (unconfigured) {
    check(
      'admin: env yokken veri YOK (yapilandirma ekrani)',
      !text.includes('Toplam benzersiz kurulum'),
      'unconfigured gate',
    )
  } else {
    check(
      'admin: oturum yokken VERI GOSTERILMIYOR (login gate)',
      !text.includes('Toplam benzersiz kurulum') && /E-posta/.test(text),
      'login formu',
    )
  }

  // ---- 3) Diger route'lar ----
  await page.goto(`${BASE}/#/gizlilik`, { waitUntil: 'networkidle0' })
  text = await textOf(page)
  check('gizlilik sayfasi aciliyor', text.includes('Gizlilik'))

  await page.goto(`${BASE}/#/olmayan-sayfa`, { waitUntil: 'networkidle0' })
  text = await textOf(page)
  check('bilinmeyen route -> 404', text.includes('404') || text.includes('bulunamadı'), 'not-found')

  // ---- 4) Mobil responsive (375px): yatay tasma yok ----
  await page.setViewport({ width: 375, height: 800 })
  for (const route of ['/', '/#/admin', '/#/gizlilik']) {
    await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle0' })
    const overflow = await page.evaluate(() => {
      const el = document.scrollingElement
      return el ? el.scrollWidth - window.innerWidth : 999
    })
    check(`mobil 375px tasma yok: ${route}`, overflow <= 1, `fark=${overflow}px`)
  }
} finally {
  await browser.close()
}

const failed = results.filter((r) => !r.ok)
console.log(`\nSONUC: ${results.length - failed.length}/${results.length} gecti`)
if (failed.length > 0) process.exit(1)
