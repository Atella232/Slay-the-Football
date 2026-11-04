import { expect, test } from '@playwright/test'
import { collectErrors, fastSettings, state } from './helpers'


test('una temporada completa con el bot termina sin errores', async ({ page }) => {
  test.setTimeout(300_000)
  const errors = collectErrors(page)
  await fastSettings(page)
  await page.goto('/?debug=1')
  await page.evaluate(() => window.__stf.start('athletic', 'FULLRUN3'))
  const result = await page.evaluate(async () => {
    let steps = 0
    while (steps++ < 4000) {
      const s = JSON.parse(window.render_game_to_text!())
      if (s.screen === 'ended') return { steps, outcome: s.outcome }
      if (s.busy) {
        window.__stf.skip()
        await new Promise(r => setTimeout(r, 5))
        continue
      }
      window.__stf.botStep()
      if (steps % 20 === 0) await new Promise(r => setTimeout(r, 0))
    }
    return { steps, outcome: 'timeout' }
  })
  expect(result.outcome).not.toBe('timeout')
  await page.waitForFunction(() => !JSON.parse(window.render_game_to_text!()).busy)
  await page.mouse.click(5, 5)
  const s = await state(page)
  expect(s.screen).toBe('ended')
  await expect(page.getByText('Puntuación')).toBeVisible()
  expect(errors).toEqual([])
})
