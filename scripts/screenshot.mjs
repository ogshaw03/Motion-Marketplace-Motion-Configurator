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

    // transition editor - Auto
    const p2 = await context.newPage()
    await p2.goto(BASE + '/#/configurator', { waitUntil: 'domcontentloaded' })
    await p2.waitForFunction(() => window.__APP_READY__ === true, undefined, { timeout: 10000 })
    await p2.waitForTimeout(1200)
    await p2.evaluate(() => {
      const node = document.querySelector('.transition-node')
      if (node) node.click()
    })
    await p2.waitForTimeout(600)
    await p2.screenshot({ path: path.join(OUT, 'transition-editor-auto.png') })
    await p2.close()

    // transition editor - Designed selected
    // Build a Run → Idle sequence so Designed Transition candidates exist,
    // then click the transition node and pick Skid Stop.
    const p3 = await context.newPage()
    await p3.goto(BASE + '/#/configurator', { waitUntil: 'domcontentloaded' })
    await p3.waitForFunction(() => window.__APP_READY__ === true, undefined, { timeout: 10000 })
    await p3.waitForTimeout(600)
    await p3.evaluate(() => {
      window.DB.currentSequence.steps = [
        { motionId: 'anime-run', loopCount: 2, transitionToNext: { kind: 'Auto', blendLengthSec: 0.15 } },
        { motionId: 'idle-neutral', loopCount: 1 },
      ]
      window.location.hash = '#/configurator?t=' + Date.now()
    })
    await p3.waitForTimeout(700)
    await p3.evaluate(() => {
      const node = document.querySelector('.transition-node')
      if (node) node.click()
    })
    await p3.waitForTimeout(500)
    await p3.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('.side-panel h3'))
      const designedHeading = headings.find((h) => h.textContent === 'DESIGNED')
      if (!designedHeading) return
      let n = designedHeading.nextElementSibling
      while (n && !n.classList.contains('next-motion-item')) n = n.nextElementSibling
      if (n) n.click()
    })
    await p3.waitForTimeout(700)
    await p3.screenshot({ path: path.join(OUT, 'transition-editor-designed.png') })
    await p3.close()

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
