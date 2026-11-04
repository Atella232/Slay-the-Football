import type { Page } from '@playwright/test'

export async function state(page: Page): Promise<Record<string, any>> {
  return JSON.parse(await page.evaluate(() => window.render_game_to_text!()))
}

export async function fastSettings(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem('stf.settings.v1', JSON.stringify({ speed: 99, master: 0, confirmEndTurn: false, reducedMotion: true }))
  })
}

export function collectErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('pageerror', e => errors.push(`pageerror: ${e.message}`))
  page.on('console', m => {
    if (m.type() === 'error') errors.push(`console: ${m.text()}`)
  })
  return errors
}

export async function idle(page: Page): Promise<void> {
  await page.waitForFunction(() => !JSON.parse(window.render_game_to_text!()).busy, undefined, { timeout: 15_000 })
}

declare global {
  interface Window {
    render_game_to_text?: () => string
    __stf?: any
  }
}
