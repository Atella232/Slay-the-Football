import { expect, test } from '@playwright/test'
import { collectErrors, fastSettings, idle, state } from './helpers'

test('en móvil se juega una carta con doble toque', async ({ page }) => {
  const errors = collectErrors(page)
  await fastSettings(page)
  await page.goto('/?debug=1')
  await page.evaluate(() => window.__stf.start('athletic', 'TOUCH'))
  await page.locator('.map-node.reachable').first().tap()
  await idle(page)
  let s = await state(page)
  const energy = s.match.energy
  const card = page.locator('.hand-card .card').first()
  await card.tap()
  await page.waitForTimeout(150)
  await card.tap()
  await idle(page)
  s = await state(page)
  expect(s.match.energy).toBeLessThan(energy)
  expect(errors).toEqual([])
})
