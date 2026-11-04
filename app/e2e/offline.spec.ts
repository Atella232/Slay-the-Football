import { expect, test } from '@playwright/test'
import { fastSettings, idle, state } from './helpers'

test('tras instalarse funciona sin red', async ({ page, context }) => {
  await fastSettings(page)
  await page.goto('/?debug=1')
  await page.waitForFunction(async () => {
    const reg = await navigator.serviceWorker?.getRegistration()
    return !!reg?.active
  }, undefined, { timeout: 30_000 })
  await page.reload()
  await page.waitForFunction(() => !!navigator.serviceWorker.controller, undefined, { timeout: 30_000 })
  await context.setOffline(true)
  await page.reload()
  await expect(page.getByText('Nueva temporada')).toBeVisible()
  await page.evaluate(() => window.__stf.start('madrid', 'OFFLINE'))
  await page.keyboard.press('1')
  await idle(page)
  const s = await state(page)
  expect(s.screen).toBe('match')
  await expect(page.locator('.hand-card').first()).toBeVisible()
})
