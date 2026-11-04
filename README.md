# Slay the Football

Roguelike de construcción de mazos con temática de fútbol. Eliges club (Athletic, Barça o Real Madrid), construyes tu mazo partido a partido y subes de Segunda División a campeón de Europa en una temporada de tres actos.

Cada combate es un **partido**: tus cartas generan Peligro contra la Defensa rival para marcar goles, mientras paras sus Ocasiones con Bloqueo antes de que se acabe el reloj.

## Jugar

```bash
cd app
npm install
npm run dev
```

Abre la URL que muestra Vite. Funciona con ratón, teclado y pantalla táctil (en horizontal), y se puede instalar como app (PWA) para jugar sin conexión.

Controles: arrastra una carta hacia arriba (o haz doble clic/toque) para jugarla · clic derecho o pulsación larga para ver el detalle · `1`–`0` elegir carta · `Enter` jugar · `E` fin de turno · `S` cambio · `A`/`D`/`X` pilas · `Esc` pausa.

## Estructura

| Carpeta | Contenido |
|---|---|
| `app/src/engine` | Motor en TypeScript puro y determinista: reglas del partido, cola de efectos con hooks, estados, IA rival, mapa, recompensas, guardado. Sin React. |
| `app/src/content` | Todo el contenido como datos: clubes, cartas, trofeos, consumibles, rivales, eventos, charlas. Los nombres reales sólo viven en `content/clubs` y en las finales de `content/rivals`. |
| `app/src/ui` | Interfaz React: escenario escalado, escenas, cola de animación por frames del motor, arte procedural de pizarra. |
| `app/src/platform` | Audio sintetizado (Web Audio), almacenamiento versionado. |
| `app/src/sim` | Simulador con bots (aleatorio, greedy, heurístico) para balance y fuzzing. |
| `app/e2e` | Tests de Playwright (escritorio, panorámico, móvil, sin red). |
| `docs/` | Reglas del juego y guía de balance. |

## Comandos

```bash
npm run verify      # typecheck + lint + tests + simulación de humo
npm run e2e         # Playwright (compila y sirve la versión de producción)
npm run sim -- --club athletic --runs 100 --bot heur   # informe de balance
npm run play:cli    # jugar por texto contra el motor
npm run build       # versión de producción en app/dist
npm run build:single  # un único HTML autocontenido en app/dist-single
```

## Despliegue

`.github/workflows/deploy-pages.yml` publica `app/dist` en GitHub Pages al hacer push a la rama por defecto (hay que activar Pages con origen "GitHub Actions" en los ajustes del repositorio). `ci.yml` ejecuta la verificación completa en cada push.

## Nota legal

Proyecto de fans sin ánimo de lucro. Los nombres y escudos de clubes y jugadores pertenecen a sus propietarios. Para un uso comercial habría que sustituirlos (están aislados en `app/src/content/clubs`).
