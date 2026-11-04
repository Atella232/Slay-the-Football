import type { CSSProperties } from 'react'

// Set de iconos propio. Todos en viewBox 0 0 24 24, trazo o relleno con currentColor.
const P: Record<string, string> = {
  energia: 'M13 2 4 14h6l-1 8 9-12h-6l1-8z',
  bloqueo: 'M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3z',
  ocasion: 'M3 6h18v12H3z M6 6v12 M18 6v12 M3 10h3 M18 10h3 M3 14h3 M18 14h3',
  ataque: 'M4 15c2-1 4-1 6 0l7-7c1-1 3-1 4 0s1 3 0 4l-7 7c1 2 1 4 0 6l-3-3-4 1 1-4-4-4z',
  repliegue: 'M3 8h4v12H3zM10 8h4v12h-4zM17 8h4v12h-4zM3 4h18v2H3z',
  presion: 'M2 12h6m-3-3 3 3-3 3M22 12h-6m3-3-3 3 3 3M12 2v6m-3-3 3 3 3-3M12 22v-6m-3 3 3-3 3 3',
  buff: 'M12 3l7 8h-4v9h-6v-9H5z',
  debuff: 'M12 21l7-8h-4V4h-6v9H5z',
  reloj: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 4v5l4 2',
  garra: 'M6 20c0-6 2-10 4-14M10 20c0-5 1-9 3-13M14 20c0-4 1-8 4-12M4 20h16',
  posesion: 'M12 3a9 9 0 1 1-8.5 6M3 4v5h5',
  momentum: 'M13 2c1 4-3 5-3 9a4 4 0 0 0 8 0c0-2-1-3-1-3 3 2 4 5 4 7a9 9 0 0 1-18 0c0-6 6-8 10-13z',
  amarilla: 'M7 3h10v18H7z',
  forma: 'M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-3 4.5 4.5 0 0 1 8 3c0 6-8 11-8 11z',
  oro: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 4v10m-3-7c0-1.5 6-1.5 6 0 0 3-6 1-6 4 0 1.5 6 1.5 6 0',
  cambio: 'M4 8h13l-3-3M20 16H7l3 3',
  mazo: 'M6 4h10v14H6zM9 7h10v14H9z',
  descarte: 'M5 7h14l-1 13H6zM9 4h6v3H9z',
  agotadas: 'M6 6l12 12M18 6 6 18M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z',
  sistema: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2',
  confianza: 'M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z',
  solidez: 'M4 10h16v10H4zM8 10V6a4 4 0 0 1 8 0v4',
  fatiga: 'M4 18h3l2-6 3 9 3-12 2 9h3',
  desorganizado: 'M4 4l4 5-4 5 4 6M12 4l-2 6 4 4-2 6M20 4l-4 5 3 4-3 7',
  desconcentrado: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm-3 7h.01M15 10h.01M8 16c2-2 6-2 8 0',
  expulsion: 'M7 3h10v18H7zM9 9l6 6m0-6-6 6',
  contragolpe: 'M3 12h14M13 6l6 6-6 6M3 6v12',
  reaccion: 'M4 12a8 8 0 0 1 14-5l2-2v6h-6l2-2A5 5 0 0 0 7 12z',
  balon: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 4 3 2-1 4h-4l-1-4zM12 7V3M15 9l5-1M14 13l3 4M10 13l-3 4M9 9 4 8',
  copa: 'M7 3h10v4a5 5 0 0 1-10 0zM7 5H4a3 3 0 0 0 3 4M17 5h3a3 3 0 0 1-3 4M12 12v5M8 21h8M9 17h6',
  medalla: 'M8 2h3l1 6-2 0zM16 2h-3l-1 6 2 0zM12 9a6 6 0 1 0 0 12 6 6 0 0 0 0-12z',
  bota: 'M5 4h5v8l7 3c2 1 3 2 3 4v1H4c0-6 1-10 1-16zM4 20h16',
  silbato: 'M3 10h10a5 5 0 1 1-5 5v-1H3zM13 10l6-4',
  libreta: 'M6 3h12v18H6zM9 7h6M9 11h6M9 15h4',
  corazon: 'M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-3 4.5 4.5 0 0 1 8 3c0 6-8 11-8 11z',
  cruz: 'M9 3h6v6h6v6h-6v6H9v-6H3V9h6z',
  estrella: 'M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z',
  pizarra: 'M3 4h18v12H3zM8 20l4-4 4 4M7 8l3 3m0-3-3 3M14 9a2 2 0 1 0 4 0 2 2 0 0 0-4 0',
  grada: 'M3 20h18M5 16h14M7 12h10M9 8h6M6 20v-4M12 20v-8M18 20v-4',
  leon: 'M12 3c4 0 7 3 7 7 2 1 2 4 0 5-1 4-4 6-7 6s-6-2-7-6c-2-1-2-4 0-5 0-4 3-7 7-7zM9 11h.01M15 11h.01M10 16h4',
  escudo: 'M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3z',
  menu: 'M4 6h16M4 12h16M4 18h16',
  cerrar: 'M6 6l12 12M18 6 6 18',
  check: 'M4 12l5 5L20 6',
  candado: 'M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4',
  play: 'M7 4l13 8-13 8z',
  ajustes: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2',
  info: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 8v6m0-9h.01',
  dados: 'M4 4h16v16H4zM8 8h.01M16 16h.01M12 12h.01M16 8h.01M8 16h.01',
  flecha: 'M12 3l7 8h-4v10H9V11H5z',
  tienda: 'M3 9l2-5h14l2 5M4 9h16v11H4zM9 20v-6h6v6',
  evento: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm-2 6a2 2 0 1 1 3 2c-1 .6-1 1-1 2m0 3h.01',
  descanso: 'M3 18h18M5 18V9h14v9M5 13h14M9 9V6h6v3',
  vitrina: 'M5 3h14v18H5zM5 9h14M9 13l3 3 3-3',
  partido: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 4 3 2-1 4h-4l-1-4z',
  grande: 'M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z',
  final: 'M7 3h10v4a5 5 0 0 1-10 0zM7 5H4a3 3 0 0 0 3 4M17 5h3a3 3 0 0 1-3 4M12 12v5M8 21h8M9 17h6',
}

const FILLED = new Set([
  'energia', 'bloqueo', 'buff', 'debuff', 'amarilla', 'forma', 'confianza', 'estrella', 'corazon', 'cruz', 'momentum', 'grande', 'expulsion', 'play', 'flecha',
])

const ALIAS: Record<string, string> = {
  txapela: 'leon', espinillera: 'escudo', venda: 'cruz', chaleco: 'escudo', micro: 'silbato', bufanda: 'forma', almohada: 'descanso', hucha: 'oro',
  tacos: 'bota', brazalete: 'medalla', monitor: 'pizarra', video: 'pizarra', banquillo: 'cambio', nevera: 'descanso', trebol: 'estrella', placa: 'medalla',
  cerebro: 'confianza', pesa: 'solidez', maletin: 'mazo', adn: 'momentum', carnet: 'mazo', prismaticos: 'evento', tijeras: 'agotadas', masia: 'escudo',
  lata: 'energia', spray: 'fatiga', megafono: 'silbato', botella: 'descanso', flechas: 'cambio', concentracion: 'descanso', mercado: 'tienda',
}

export function Icon({ name, size = 18, className, style, title }: { name: string; size?: number; className?: string; style?: CSSProperties; title?: string }) {
  const key = P[name] ? name : ALIAS[name] ?? 'balon'
  const d = P[key]
  const filled = FILLED.has(key)
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      style={style}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'}
      strokeWidth={filled ? 0 : 2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {title && <title>{title}</title>}
      <path d={d} />
    </svg>
  )
}
