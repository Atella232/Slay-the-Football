import { expect, test } from '@playwright/test'
import { fastSettings, idle, state } from './helpers'

test('recargar a mitad de partido reproduce exactamente el mismo estado', async ({ page }) => {
  await fastSettings(page)
  await page.goto('/?debug=1')
  await page.evaluate(() => window.__stf.start('athletic', 'SAVE1'))
  for (let i = 0; i < 6; i++) {
    await page.evaluate(() => window.__stf.botStep())
    await idle(page)
  }
  const before = await state(page)
  await page.reload()
  await page.getByText('Continuar temporada').click()
  await idle(page)
  const after = await state(page)
  expect(after).toEqual(before)
})
