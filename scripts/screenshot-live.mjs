import { chromium } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const OUT = 'scratchpad/screenshots-live'
const URL = 'https://ogshaw03.github.io/Motion-Marketplace-Motion-Configurator/'

await mkdir(OUT, { recursive: true })

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
})

const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
})

const page = await context.newPage()
console.log('goto', URL)
await page.goto(URL, { waitUntil: 'domcontentloaded' })
await page.waitForFunction(() => window.__APP_READY__ === true, undefined, { timeout: 15000 })
await page.waitForTimeout(2000)
await page.screenshot({ path: path.join(OUT, 'top-live.png'), fullPage: false })
await page.screenshot({ path: path.join(OUT, 'top-live-full.png'), fullPage: true })
await page.close()
await browser.close()
console.log('done')
