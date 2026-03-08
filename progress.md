Original prompt: Este juego esta en una fase alfa muy preliminar. quiero que lo examines en detalle y profundidad y que me hagas un informe con lo que ves que esta bien y con las carencias que le ves y quiero que me propongas mejoras que podriamos implementar

# Estado actual

Fecha de ultima actualizacion: 2026-03-08

## Resumen corto
- El roadmap inmediato de contenido queda cerrado hasta `B30`.
- `B30` queda cerrado con una pasada numerica real sobre economia, curas y ascension.
- `ascension.ts`, `rewardTable.ts`, `relics.ts` y el flujo de combate ya comparten una curva de dificultad/economia mas coherente y menos inflada en sustain.
- El roadmap inmediato queda cerrado; el siguiente paso recomendable ya no es otro `Bxx`, sino observar runs reales con la telemetria actual y abrir una nueva tanda de ajustes o contenido.
- El dashboard de analytics ahora resume alertas accionables de balance en una franja de `Lectura rapida` para no depender solo de tablas crudas.
- La home y el runtime ya muestran escudos oficiales con fondo transparente y una paleta visual mas marcada por equipo.
- El lenguaje visual del equipo ya se extiende tambien a mapa, recompensa y cartas de equipo, no solo a home y HUD.
- El combate ya limpia correctamente el bloqueo enemigo entre rondas y las recompensas de elite garantizan una reliquia.

## Siguiente paso recomendado
- Observar runs reales con la telemetria ya instrumentada y abrir una nueva tanda de balance o contenido sobre datos de uso.
- Objetivo concreto:
  - revisar si Athletic sigue sobrerresistiendo tras quitar la cura duplicada y bajar sustain,
  - medir si la nueva economia por acto deja al shop en una banda sana,
  - usar la nueva `Lectura rapida` para detectar brechas de equipo, cartas dominantes y drift de recompensas sin leer toda la tabla,
- decidir la siguiente sprint ya con datos reales en vez de estimaciones de alfa,
  - si se mantiene esta direccion de marca, extender el uso del escudo a mas puntos de UI sin romper legibilidad.

# Roadmap por sprints

## Sprint 1
- `[x]` B01 Corregir los 4 errores de eslint en `gameStore.ts`.
- `[x]` B02 Extraer helpers puros de coste/descartes/exhaust desde `gameStore.ts` a `app/src/lib/combat/`.
- `[x]` B03 Separar generacion de mapa y navegacion de salas en un modulo propio fuera de `gameStore.ts`.
- `[x]` B04 Crear una capa de resolucion de efectos por tipo en vez de seguir ampliando el `if/else` gigante de `gameStore.ts`.
- `[x]` B05 Limpiar el mojibake en `cards.ts`, `relics.ts`, `enemies.ts` y `events.ts`.
- `[x]` B06 Reducir el papel de `text.ts` a compatibilidad temporal y dejar test de regresion.
- `[x]` B07 Anadir RNG con seed para mapa, recompensas y enemigos.
- `[x]` B08 Exponer `window.render_game_to_text` y `window.advanceTime(ms)` para automatizacion.
- `[x]` B09 Anadir smoke tests de arranque de run, primer combate y recompensa.

## Sprint 2
- `[x]` B10 Rehacer la parte superior de `TeamSelect.tsx` para que el CTA real quede visible sin scroll.
- `[x]` B11 Enriquecer cada card de equipo con reliquia inicial, mecanica unica y estilo de build.
- `[x]` B12 Convertir el selector de ascension en un bloque mas claro con resumen compacto del impacto actual.
- `[x]` B13 Revisar responsive en portatil y movil para la home y seleccion de equipo.
- `[x]` B14 Replantear `RewardScreen.tsx` para que la eleccion unica se entienda a primera vista.
- `[x]` B15 Mejorar `Map.tsx` con mejor lectura de ruta, nodo actual y siguiente decision.

## Sprint 3
- `[x]` B16 Anadir panel de mazo/descarte/exhaust en `Combat.tsx`.
- `[x]` B17 Mejorar la lectura de intenciones en `Enemy.tsx` con numeros, keywords y severidad.
- `[x]` B18 Anadir tooltips/glosario para buffs, debuffs y keywords de cartas.
- `[x]` B19 Crear log corto de combate con ultimas 5-8 acciones.
- `[x]` B20 Revisar feedback visual de energia, bloqueo y triggers de pasivas.
  - Primera pasada cerrada: pips de energia, bloque de bloqueo mas legible, chips de triggers pendientes, marcas contextuales en cartas y log de combate conectado a la UI.
  - Segunda pasada cerrada: cues efimeros para energia/bloqueo/triggers, cartas preparadas con aura visual y logs nombrados para pasivas/reliquias clave que alimentan la UI.

## Sprint 4
- `[x]` B21 Dar patron propio a cada elite en `enemies.ts` en lugar de usar solo intencion aleatoria.
- `[x]` B22 Dar al menos 2 fases claras a cada boss de acto.
- `[x]` B23 Subir los eventos de 3 a 8 primero, luego a 12.
- `[x]` B24 Auditar cartas de relleno y reforzar identidad real de Athletic, Barca y Madrid.
- `[x]` B25 Crear una tabla simple de distribucion de recompensas por acto y rareza.

## Sprint 5
- `[x]` B26 Hacer lazy-load del dashboard de `TelemetryDashboard.tsx`.
- `[x]` B27 Revisar dependencias UI sobrantes y reducir bundle.
- `[x]` B28 Extender telemetria para medir pickrate, winrate por equipo y cartas dominantes.
- `[x]` B29 Crear pantalla simple de continuar run con persistencia minima.
- `[x]` B30 Ajustar economia, curas y ascension con una pasada numerica real.

# Lo ya cerrado

## Validacion tecnica
- `npm run test` OK.
- `npm run build` OK.
- `npm run lint` OK.

## Validacion visual
- Home ligera OK.
- Analytics en lazy-load OK.
- Escenas debug de mapa y combate OK.
- Validacion Playwright de combate reciente OK sobre `/?debugTeam=athletic&debugSeed=20260308&debugRoom=first`.
- Validacion Playwright `B20` segunda pasada OK en combate debug: gasto de energia y ganancia de bloqueo visibles tras `Cobertura`, y proc nombrado de pasiva visible/logado tras `Muro Rojiblanco`.
- Validacion Playwright `B03` OK en mapa debug: primera fila alcanzable visible, 3 rutas iniciales coherentes y `render_game_to_text` alineado con el mapa.
- Validacion Playwright `B04` OK en combate debug: escena carga tras el refactor del resolver, mano inicial visible y snapshot consistente en `/?debugTeam=athletic&debugSeed=20260308&debugRoom=first`.
- Validacion `B21` OK: tests de secuencia para elites y smoke Playwright del runtime sin errores tras introducir `aiPattern`/`aiStep`.
- Validacion `B22` OK: tests de secuencia para fases de bosses y smoke runtime sin errores tras extender patrones a bosses.
- Validacion `B23` OK: pool ampliado a 12 eventos, tests de compatibilidad/variedad y smoke Playwright del runtime sin errores tras el refactor de `EventRoom.tsx`.
- Validacion `B24` OK: tests de identidad por equipo y mazos iniciales, build limpio y runtime smoke sin regresiones tras la pasada de cartas.
- Validacion `B25` OK: tests de curva por acto para cartas/reliquias/oro, `RewardScreen` conectado a la tabla compartida y smoke Playwright visual sobre `debugRoom=reward` sin errores.
- Validacion `B28` OK: telemetria de ofertas/choices persistida, dashboard lazy-load ampliado con dominancia y mezcla de decisiones, smoke Playwright de analytics OK y snapshot de estado de recompensa alineado con la escena debug.
- Validacion `B29` OK: storage compartido conserva run activa, la home muestra CTA de continuar en la misma sesion del navegador y los tests cubren resumen de run, merge de perfil y persistencia del snapshot activo.
- Validacion `B30` OK: nueva curva de oro por acto, curas base de hostal/transicion ajustadas, dano de boss separado del dano normal en ascension y smoke Playwright de combate sin regresiones visibles.
- Validacion post-`B30` OK: `TelemetryDashboard` muestra una franja de `Lectura rapida` con alertas accionables, tests de umbrales y smoke Playwright sobre analytics sin regresiones visuales.
- Validacion visual de arte OK: `TeamSelect` y `Combat` ya muestran escudos oficiales SVG con transparencia, y el color de Athletic/Barca/Madrid queda mejor separado en la UI.
- Validacion visual de extension de arte OK: `Map`, `RewardScreen` y `CardComponent` ya heredan escudo/paleta de equipo y los smokes Playwright no muestran regresiones de legibilidad.
- Validacion de recompensa elite OK: la escena debug `elite_reward` muestra la franja de recompensa de elite y tests cubren reliquia garantizada y reset de bloqueo del Portero Titular.
## Artefactos utiles
- `app/output/web-game/debug-map-postgate/shot-0.png`
- `app/output/web-game/debug-combat-slow/shot-0.png`
- `app/output/web-game/combat-glossary/shot-0.png`
- `app/output/web-game/discard-glossary/shot-0.png`
- `app/output/web-game/combat-log-feedback/shot-0.png`
- `app/output/web-game/combat-log-feedback/state-0.json`
- `app/output/web-game/b20-pass2-initial/shot-0.png`
- `app/output/web-game/b20-pass2-initial/state-0.json`
- `app/output/web-game/b20-pass2-block/shot-0.png`
- `app/output/web-game/b20-pass2-block/state-0.json`
- `app/output/web-game/b20-pass2-passive/shot-0.png`
- `app/output/web-game/b20-pass2-passive/state-0.json`
- `app/output/web-game/b03-map-flow/shot-0.png`
- `app/output/web-game/b03-map-flow/state-0.json`
- `app/output/web-game/b04-effect-resolver/shot-0.png`
- `app/output/web-game/b04-effect-resolver/state-0.json`
- `app/output/web-game/b21-elite-patterns/shot-0.png`
- `app/output/web-game/b21-elite-patterns/state-0.json`
- `app/output/web-game/b22-boss-phases/shot-0.png`
- `app/output/web-game/b22-boss-phases/state-0.json`
- `app/output/web-game/b23-b24-runtime/shot-0.png`
- `app/output/web-game/b23-b24-runtime/state-0.json`
- `app/output/web-game/b25-reward-table/shot-0.png`
- `app/output/web-game/b28-dashboard/shot-0.png`
- `app/output/web-game/b28-reward-telemetry/state-0.json`
- `app/output/web-game/b28-reward-window.png`
- `app/output/web-game/b29-continue-window.png`
- `app/output/web-game/b30-balance-runtime/shot-0.png`
- `app/output/web-game/b30-balance-runtime/state-0.json`
- `app/output/web-game/post-b30-analytics-runtime/shot-0.png`
- `app/output/web-game/team-crests-home/shot-0.png`
- `app/output/web-game/team-crests-combat/shot-0.png`
- `app/output/web-game/team-crests-combat/state-0.json`
- `app/output/web-game/team-crests-map/shot-0.png`
- `app/output/web-game/team-crests-reward/shot-0.png`
- `app/output/web-game/team-crests-reward/state-0.json`
- `app/output/web-game/elite-relic-reward/shot-0.png`
- `app/output/web-game/elite-relic-reward/state-0.json`
- `app/output/web-game/b25-reward-table/state-0.json`
## Baseline actual de bundle
- Chunk inicial: `dist/assets/index-CXinndXA.js` alrededor de `283.52 kB` minificado, `86.83 kB` gzip.
- Runtime lazy: `dist/assets/RuntimeApp-CLUhGDCu.js` alrededor de `352.41 kB` minificado, `100.67 kB` gzip.
- Comparativa util:
  - antes de optimizar: chunk principal alrededor de `610 kB`,
  - tras primera pasada lazy: alrededor de `354.14 kB`,
  - tras separar home y runtime: alrededor de `277.50 kB` iniciales.

# Deuda abierta y notas
- Tras cerrar `B30`, el roadmap inmediato queda sin bloques `Bxx` abiertos; la siguiente palanca es ya iteracion sobre telemetria real y nuevo contenido.
- `gameStore.ts` ya no concentra la resolucion principal de efectos, pero todavia retiene pasivas de equipo, logs y parte del flujo de combate. La base de `aiPattern` ya cubre elites y bosses.
- `EventRoom.tsx` ya no depende de textos como 'apostar' o 'vender' para resolver eventos; ahora usa metadatos explicitos (`costGold`, `bonusGold`, `removeCard`).
- La nueva curva de recompensas vive en `app/src/lib/rewards/rewardTable.ts`; cualquier ajuste de economia o frecuencia debe pasar por ahi para no desalinear UI, store y telemetria.
- La home ya no debe escribir sobre la ascension de una run activa: `profileStorage.ts` usa `profileAscension` para no pisar la dificultad guardada de una partida retomable.
- `Sangre de Leon` ya no cura dos veces: se elimino el trigger redundante en victoria de combate y ahora el sustain pasa solo por `heal_after_combat`.
- Aunque `B05` esta cerrado en los archivos de datos previstos, todavia quedan algunos textos legacy o cadenas con encoding mejorable fuera de ese alcance, especialmente en `gameStore.ts`.
- En `B07` queda `Date.now()` como fallback para generar seed cuando no se fija una seed explicita. La reproducibilidad por seed esta validada; ese fallback no rompe el flujo normal, pero conviene tenerlo presente si se quiere un control total.
- La siguiente gran palanca de peso ya no es tanto el JS inicial sino CSS y fuentes.
- `TelemetryDashboard` ya resume pistas claras, pero sigue leyendo de `localStorage`; si se quiere analisis longitudinal o comparativas fiables entre builds, tocara export o backend ligero.
- Los escudos integrados son oficiales y transparentes, bajados desde URLs de Wikimedia vigentes a fecha 2026-03-08; si el proyecto pasa de alfa privada a distribucion publica, conviene revisar de nuevo el encaje legal de marca.
- `RuntimeApp` ahora soporta `debugRoom=elite_reward` para validar rapido la recompensa garantizada de elites sin jugar una run completa.
- Mantener vigilado que la home no vuelva a importar `gameStore` ni datos pesados por accidente.

# Archivos clave para retomar
- `app/src/components/Combat.tsx`
- `app/src/components/Card.tsx`
- `app/src/components/RewardScreen.tsx`
- `app/src/components/RuntimeApp.tsx`
- `app/src/lib/rewards/rewardTable.ts`
- `app/src/lib/rewards/rewardTable.test.ts`
- `app/src/store/gameStore.ts`
- `app/src/store/gameStore.test.ts`
- `app/src/lib/combat/cardFlow.ts`
- `app/src/lib/combat/cardFlow.test.ts`
- `app/src/lib/combat/effectResolver.ts`
- `app/src/lib/combat/effectResolver.test.ts`
- `app/src/data/enemies.ts`
- `app/src/data/enemies.test.ts`
- `app/src/components/Enemy.tsx`
- `app/src/components/Map.tsx`
- `app/src/components/TeamSelect.tsx`
- `app/src/App.tsx`
- `app/src/components/RuntimeApp.tsx`
- `app/src/lib/telemetry.ts`
- `app/src/lib/telemetry.test.ts`
- `app/src/components/TelemetryDashboard.tsx`
- `app/src/lib/teamPresentation.ts`
- `app/src/components/Map.tsx`
- `app/src/components/RewardScreen.tsx`
- `app/src/components/Card.tsx`
- `app/src/components/RewardScreen.tsx`
- `app/src/components/RuntimeApp.tsx`
- `app/src/lib/rewards/rewardTable.ts`
- `app/src/lib/rewards/rewardTable.test.ts`
- `app/public/crests/`
- `app/src/lib/runPersistence.ts`
- `app/src/lib/runPersistence.test.ts`
- `app/src/lib/profileStorage.test.ts`
- `progress.md`
# Nota operativa
- El cliente Playwright del skill funciona, pero en esta maquina suele requerir ejecucion fuera del sandbox por el spawn del navegador.
- URLs debug utiles:
  - `http://127.0.0.1:4173/?debugTeam=athletic&debugSeed=20260308`
  - `http://127.0.0.1:4173/?debugTeam=athletic&debugSeed=20260308&debugRoom=first`
  - `http://127.0.0.1:4173/?debugTeam=athletic&debugSeed=20260308&debugRoom=first&debugPile=discard`
  - `http://127.0.0.1:4173/?debugTeam=athletic&debugSeed=20260308&debugRoom=reward`























## Update 2026-03-08 - Shop y EventRoom
- La identidad visual de equipo ya cubre tambien `Shop` y `EventRoom`.
- `Shop.tsx` usa escudo, gradiente y acentos del club en header, paneles y modal de eliminacion.
- `EventRoom.tsx` usa escudo, panel tematico del club y opciones visualmente alineadas con la misma paleta.
- `RuntimeApp.tsx` ahora soporta `debugRoom=shop` y `debugRoom=event` para revisar ambas escenas sin jugar una run completa.

### Validacion
- `npm run lint` OK.
- `npm run test` OK.
- `npm run build` OK.
- Playwright OK sobre `http://127.0.0.1:4173/?debugTeam=athletic&debugSeed=20260308&debugRoom=shop`.
- Playwright OK sobre `http://127.0.0.1:4173/?debugTeam=athletic&debugSeed=20260308&debugRoom=event`.

### Artefactos
- `app/output/web-game/shop-visual/shot-0.png`
- `app/output/web-game/shop-visual/state-0.json`
- `app/output/web-game/event-visual/shot-0.png`
- `app/output/web-game/event-visual/state-0.json`

### Bundle tras este corte
- Chunk inicial: `dist/assets/index-BZPzJavj.js` alrededor de `283.52 kB` minificado, `86.83 kB` gzip.
- Runtime lazy: `dist/assets/RuntimeApp-eVusNwXv.js` alrededor de `355.51 kB` minificado, `101.11 kB` gzip.

## Update 2026-03-08 - RestSite y TreasureRoom
- La identidad visual de equipo ya cubre tambien `RestSite` y `TreasureRoom`.
- `RestSite.tsx` usa escudo, gradiente y acentos del club en la cabecera y en la confirmacion de descanso.
- `TreasureRoom.tsx` ya presenta la reliquia con un panel tematico del club en vez de una pantalla neutra.
- `RuntimeApp.tsx` ahora soporta `debugRoom=rest` y `debugRoom=treasure` para revisar ambas escenas sin jugar una run completa.

### Validacion
- `npm run lint` OK.
- `npm run test` OK.
- `npm run build` OK.
- Playwright OK sobre `http://127.0.0.1:4173/?debugTeam=athletic&debugSeed=20260308&debugRoom=rest`.
- Playwright OK sobre `http://127.0.0.1:4173/?debugTeam=athletic&debugSeed=20260308&debugRoom=treasure`.

### Artefactos
- `app/output/web-game/rest-visual/shot-0.png`
- `app/output/web-game/rest-visual/state-0.json`
- `app/output/web-game/treasure-visual/shot-0.png`
- `app/output/web-game/treasure-visual/state-0.json`

## Update 2026-03-08 - Plan de ilustraciones
- Se define una nueva linea de trabajo para ilustraciones de cartas y enemigos con `imagegen`.
- Objetivo: arte TCG premium, pintura digital epica, inspirado en la sensacion de Magic: The Gathering pero llevado a futbol competitivo.
- Se detectan 71 entradas de cartas (68 nombres unicos) y 23 enemigos unicos, para un total aproximado de 91 ilustraciones si se cubre todo el set.
- Se deja un lote piloto de 9 assets para fijar estilo antes de escalar: `Golpeo`, `Cobertura`, `Todo o Nada`, `Muro Rojiblanco`, `Tiki-Taka`, `Galactico`, `Portero Titular`, `Capitan del Equipo` y `Campeon de Europa`.
- Documento de referencia creado: `art-illustration-plan.md`.

## Update 2026-03-08 - Gemini pilot smoke
- `GEMINI_API_KEY` ya es visible en la sesion actual.
- Se valida un primer smoke real contra `gemini-3.1-flash-image-preview` con una ilustracion de prueba para `Golpeo`.
- Prompt base del piloto guardado en `app/output/imagegen/prompts/pilot-prompts.md`.
- Artefacto generado: `app/output/imagegen/cards/pilot/golpeo/golpeo-test.png`.
- Respuesta cruda de la API guardada en `app/output/imagegen/cards/pilot/golpeo/response.json`.
- Siguiente paso: extender el piloto al resto de los 9 assets o refinar el prompt base si se quiere mas atmosfera, mas fantasia o mas identidad de club.
- Cambio de direccion para ilustraciones: las cartas no usaran splash vertical completa; el arte debe ser horizontal tipo MTG para ocupar solo la franja superior, dejando el texto abajo como ahora.

## Update 2026-03-08 - Golpeo art horizontal
- Se rehace `Golpeo` como ilustracion horizontal panoramica pensada para el art box superior de la carta, no como splash vertical.
- Asset generado con Gemini en `app/public/card-art/golpeo-horizontal.png`.
- Prompt y respuesta del smoke guardados en `app/output/imagegen/prompts/pilot-prompts.md` y `app/output/imagegen/cards/pilot/golpeo-horizontal/response.json`.
- `Card.tsx` ya soporta arte por carta via `app/src/lib/cardArt.ts` y `Golpeo` (neutral y Athletic) usa el nuevo art box.
- Validacion tecnica: `npm run lint`, `npm run test` y `npm run build` OK.
- Validacion visual parcial: el asset se reviso y el cableado en runtime esta activo; la captura automatizada del navegador no saco una imagen final limpia de la carta completa por problemas de foco/crop de ventana en esta maquina.

- 2026-03-08: Carta rehecha otra vez para evitar solapes en cabecera. La rareza sale del badge y pasa al borde: comun negro, uncommon plateado y rare dorado. Validado con lint/build y captura runtime en app/output/web-game/card-golpeo-rarity-border.png.

- 2026-03-08: Soporte anadido para rareza legendary con borde rojo en Card.tsx y precio de tienda preparado. rewardTable actualizado con peso 0 para legendary por ahora.
- 2026-03-08: Generadas 8 ilustraciones horizontales del piloto con Gemini y guardadas en app/public/card-art y app/public/enemy-art, con respuesta cruda en app/output/imagegen/. Integradas en runtime Cobertura, Todo o Nada, Muro Rojiblanco, Tiki-Taka, Galactico y retratos de Portero Titular, Capitan del Equipo y Campeon de Europa en Enemy.tsx.
- 2026-03-08: Validacion OK con npm run lint, npm run build y npm run test. Captura runtime de Cobertura en app/output/web-game/card-cobertura-art.png.

- 2026-03-08: Batch 2 de cartas generado con Gemini: Entrada Dura, Lectura de Partido, Cambio de Banda, Pase Seguro, Falta Tactica, Toque de Balon y Contraataque. Integradas en cardArt.ts y validadas con lint/build/test.
- 2026-03-08: Detectado que Barca y Madrid usan ids genericos strike_/defend_ en mano inicial. getCardArtSrc se rehace para resolver tambien por team y nombre, no solo por id.
- 2026-03-08: Mini batch extra para basicas visibles de Barca/Madrid: Pase Corto, Posicionamiento, Disparo y Marcaje. Se regeneran varias de ellas por derivas del modelo (futbol americano, logos o marcos incrustados) con prompts soccer-only y versionado de archivo v2 para romper cache del navegador.
- 2026-03-08: Capturas utiles de esta tanda en app/output/web-game/card-entrada-dura-art.png, app/output/web-game/card-toque-balon-art.png, app/output/web-game/card-pase-corto-art-v3.png y app/output/web-game/card-disparo-art-v2.png. Siguiente mejora recomendada: crear una vista debug de galeria de cartas para revisar arte a tamano grande y acelerar curacion/regeneracion.

- 2026-03-08: Añadida galeria debug de arte en app/src/components/ArtGallery.tsx y conectada en RuntimeApp con debugRoom=art_gallery. Muestra ilustracion grande + carta/enemigo en marco real, con filtros por equipo y estado de arte. Captura en app/output/web-game/art-gallery-debug.png.
