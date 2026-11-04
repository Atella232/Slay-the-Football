import { expect, test } from '@playwright/test'

test('en móvil vertical pide girar la pantalla', async ({ page }) => {
  await page.goto('/?debug=1')
  await expect(page.getByText('Gira el móvil para jugar en horizontal')).toBeVisible()
})
