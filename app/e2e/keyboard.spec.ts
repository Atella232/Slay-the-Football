import { expect, test } from '@playwright/test'
import { collectErrors, fastSettings, idle, state } from './helpers'

test('un partido se puede jugar sólo con teclado', async ({ page }) => {
  const errors = collectErrors(page)
  await fastSettings(page)
  await page.goto('/?debug=1')
  await page.evaluate(() => window.__stf.start('athletic', 'KEYS'))
  await page.keyboard.press('1')
  await idle(page)
  await expect(page.locator('.hand-card')).toHaveCount(5)
  await page.waitForTimeout(300)
  let s = await state(page)
  expect(s.screen).toBe('match')
  const energy = s.match.energy
  const handBefore = s.match.hand.length
  await page.keyboard.press('1')
  await page.keyboard.press('Enter')
  await idle(page)
  s = await state(page)
  expect(s.match.hand.length).toBe(handBefore - 1)
  expect(s.match.energy).toBeLessThan(energy)
  await page.keyboard.press('e')
  await idle(page)
  s = await state(page)
  expect(s.match.turn).toBe(2)
  expect(errors).toEqual([])
})
