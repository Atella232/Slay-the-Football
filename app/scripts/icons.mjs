// Genera los iconos PNG de la PWA a partir de un SVG (se ejecuta a mano: node scripts/icons.mjs)
import { Resvg } from '@resvg/resvg-js'
import { writeFileSync } from 'node:fs'

const svg = (pad) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <radialGradient id="g" cx="50%" cy="40%" r="70%">
      <stop offset="0" stop-color="#2a5a43"/><stop offset="1" stop-color="#0f241b"/>
    </radialGradient>
  </defs>
  <rect x="${pad}" y="${pad}" width="${512 - 2 * pad}" height="${512 - 2 * pad}" rx="${pad ? 96 : 0}" fill="url(#g)"/>
  <g fill="none" stroke="#f2efe3" stroke-opacity=".55" stroke-width="10">
    <line x1="256" y1="${pad + 30}" x2="256" y2="${512 - pad - 30}"/>
    <circle cx="256" cy="256" r="120"/>
  </g>
  <circle cx="256" cy="256" r="92" fill="#ffffff" stroke="#111" stroke-width="8"/>
  <polygon points="256,206 300,238 284,290 228,290 212,238" fill="#111"/>
  <g stroke="#111" stroke-width="8" stroke-linecap="round">
    <line x1="256" y1="206" x2="256" y2="166"/><line x1="300" y1="238" x2="340" y2="224"/>
    <line x1="284" y1="290" x2="306" y2="328"/><line x1="228" y1="290" x2="206" y2="328"/>
    <line x1="212" y1="238" x2="172" y2="224"/>
  </g>
  <rect x="${pad + 14}" y="${pad + 14}" width="${512 - 2 * pad - 28}" height="${512 - 2 * pad - 28}" rx="${pad ? 84 : 0}" fill="none" stroke="#f2c14e" stroke-width="10"/>
</svg>`

const render = (s, size, out) => {
  const png = new Resvg(s, { fitTo: { mode: 'width', value: size } }).render().asPng()
  writeFileSync(out, png)
}
render(svg(0), 192, 'public/icons/icon-192.png')
render(svg(0), 512, 'public/icons/icon-512.png')
render(svg(40), 512, 'public/icons/icon-maskable-512.png')
render(svg(0), 180, 'public/icons/apple-touch-icon.png')
writeFileSync('public/icons/favicon.svg', svg(24))
console.log('iconos generados')
