import { expect, test } from '@playwright/test'
import { collectErrors, fastSettings, idle, state } from './helpers'

test('arranca, se empieza una temporada por la UI y se entra en un partido', async ({ page }) => {
  const errors = collectErrors(page)
  await fastSettings(page)
  await page.goto('/?debug=1')
  await expect(page.getByText('Nueva temporada')).toBeVisible()
  await page.getByText('Nueva temporada').click()
  await expect(page.getByText('Elige tu club')).toBeVisible()
  await page.getByText('Empezar temporada').click()
  await expect(page.getByText('Siguiente jornada')).toBeVisible()
  await page.locator('.map-node.reachable').first().click()
  await idle(page)
  const s = await state(page)
  expect(s.screen).toBe('match')
  await expect(page.getByRole('button', { name: 'Fin de turno' })).toBeVisible()
  await expect(page.locator('.hand-card')).toHaveCount(5)
  expect(errors).toEqual([])
})
