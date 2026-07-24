import { chromium } from '@playwright/test'
import { spawn } from 'node:child_process'
import { mkdir, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

const OUT = 'scratchpad/screenshots'
const BASE = 'http://127.0.0.1:5173'

const pages = [
  ['top', '/#/'],
  ['motions', '/#/motions'],
  ['motion-detail', '/#/motion/anime-run'],
  ['motion-detail-designed', '/#/motion/skid-stop'],
  ['configurator', '/#/configurator'],
  ['configurator-featured', '/#/configurator?seq=action-demo'],
  ['library', '/#/library'],
  ['purchase', '/#/purchase'],
  ['creators', '/#/creators'],
  ['creator-detail', '/#/creator/creator-a'],
]

async function waitForServer(url, tries = 40) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url)
      if (res.ok) return true
    } catch {}
    await new Promise((r) => setTimeout(r, 300))
  }
  return false
}

async function main() {
  if (existsSync(OUT)) await rm(OUT, { recursive: true })
  await mkdir(OUT, { recursive: true })

  const server = spawn('npm', ['run', 'dev', '--', '--host', '127.0.0.1'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false,
  })
  server.stdout.on('data', (d) => process.stdout.write(`[dev] ${d}`))
  server.stderr.on('data', (d) => process.stderr.write(`[dev-err] ${d}`))

  const ok = await waitForServer(BASE)
  if (!ok) {
    console.error('dev server did not start')
    server.kill('SIGTERM')
    process.exit(1)
  }

  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  })
  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
    })

    for (const [name, hash] of pages) {
      const page = await context.newPage()
      const url = BASE + hash
      console.log(`→ ${name}: ${url}`)
      await page.goto(url, { waitUntil: 'domcontentloaded' })
      await page.waitForFunction(() => window.__APP_READY__ === true, undefined, { timeout: 10000 })
      // give 3D and layout time to settle
      await page.waitForTimeout(1200)
      await page.screenshot({
        path: path.join(OUT, `${name}.png`),
        fullPage: false,
      })
      await page.close()
    }

    // additional: configurator scrolled for sequence
    const p = await context.newPage()
    await p.goto(BASE + '/#/configurator', { waitUntil: 'domcontentloaded' })
    await p.waitForFunction(() => window.__APP_READY__ === true, undefined, { timeout: 10000 })
    await p.waitForTimeout(1500)
    // click Play All to have a live pose
    await p.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) =>
        (b.textContent || '').includes('PLAY ALL'),
      )
      if (btn) btn.click()
    })
    await p.waitForTimeout(1200)
    await p.screenshot({ path: path.join(OUT, 'configurator-playing.png') })
    await p.close()

    await browser.close()
  } finally {
    server.kill('SIGTERM')
  }
  console.log('\nDone. Screenshots in', OUT)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
