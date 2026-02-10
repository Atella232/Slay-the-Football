# Plan Maestro de Balance y Expansion de Contenido

**Proyecto:** Slay the Football  
**Fecha:** 2026-02-07  
**Estado:** Plan funcional y de produccion (sin implementacion de codigo en este documento)

## 1. Objetivo

Llevar el juego a un nivel de profesionalismo en balance y variedad de contenido con 5 resultados claros:

1. Identidad jugable fuerte y diferenciada para Athletic, Barcelona y Madrid.
2. Habilidad base propia para cada equipo + mecanica unica de equipo.
3. Expansion amplia de cartas de equipo y cartas comunes neutrales.
4. Expansion de reliquias con impacto real en decisiones de build.
5. Metodo de balance por datos (no por sensaciones) para iterar rapido.

---

## 2. Diagnostico actual (base sobre el estado del codigo)

### 2.1 Lo que ya esta bien

1. Estructura general de roguelike funcional: combate, mapa, tienda, descanso, eventos, reliquias, ascension.
2. Tres equipos jugables ya con identidad inicial.
3. Motor de efectos ya soporta un set util: dano, bloqueo, robo, energia, vulnerable, debil, buffs, condicion por vida, condicion por enemigo, efectos de exhaust, efectos globales.
4. Curva base de ascension implementada (A0-A20).

### 2.2 Lo que falta para nivel profesional

1. Identidad de equipo aun muy cercana entre si (faltan sistemas exclusivos por equipo).
2. Pool de cartas todavia corto para deckbuilding profundo en runs largas.
3. Reliquias con overlap alto (algunas se pisan en rol o potencia).
4. Falta de objetivos numericos de balance por acto/arquetipo.
5. Falta pipeline de playtesting con metricas de winrate, pickrate y performance por carta.

### 2.3 Baseline de contenido actual (aprox)

- Cartas por equipo: 15.
- Cartas neutrales base: 2.
- Reliquias neutrales: 18 (mas 3 starter).

Este plan amplia el contenido sin romper el motor actual y marca que sistemas nuevos son obligatorios.

---

## 3. Marco de balance profesional

## 3.1 Metricas objetivo (A0, run completa)

| Metrica | Objetivo global | Rango aceptable por equipo |
|---|---:|---:|
| Winrate run completa | 58% | 54% - 62% |
| Llegar al Acto 2 | 82% | 78% - 86% |
| Llegar al Acto 3 | 62% | 58% - 66% |
| Llegar al Acto 4 | 39% | 34% - 44% |
| Victoria Acto 4 | 58% de quienes llegan | 52% - 64% |

## 3.2 Metricas objetivo (A20)

| Metrica | Objetivo global |
|---|---:|
| Winrate run completa | 10% - 16% |
| Llegar al Acto 3 | 28% - 36% |
| Variacion entre equipos | max 5 pp |

## 3.3 Reglas de tuning

1. Si una carta rara tiene pickrate > 70% y win contribution > +6 pp, nerf en 1-2 puntos de valor o condicion mas exigente.
2. Si una carta comun tiene pickrate < 8% en 3 parches seguidos, buff o rework.
3. Ninguna reliquia comun debe aportar mas de +2 pp de winrate por si sola.
4. Reliquias boss siempre con tradeoff real.

---

## 4. Identidad, habilidad base y mecanica unica por equipo

## 4.1 Athletic Club

| Elemento | Definicion |
|---|---|
| Identidad | Defensa activa, exhaust util, conversion de resistencia en dano.
| Habilidad base | **Corazon de Acero**: al inicio de cada combate ganas 4 de bloqueo. La primera vez por turno que agotas una carta, ganas 2 bloqueo extra.
| Mecanica unica | **Garra (0-10)**: ganas Garra al agotar cartas y al jugar cartas defensivas fuertes. Varias cartas consumen Garra para escalar dano o bloqueo.
| Objetivo de build | Controlar el ritmo, sobrevivir y cerrar con finishers de Garra.

**Reglas de Garra:**

- +1 Garra al agotar una carta.
- +1 Garra al ganar 8+ bloqueo con una sola carta.
- Algunas cartas consumen X Garra para potenciarse.
- Cap en 10 para evitar loops.

## 4.2 FC Barcelona

| Elemento | Definicion |
|---|---|
| Identidad | Secuencias de cartas, tempo, control de mano y eficiencia de energia.
| Habilidad base | **Ritmo de Posesion**: la primera skill de cada turno roba 1 carta si ya jugaste al menos 1 carta ese turno.
| Mecanica unica | **Posesion (0-8)**: se acumula al jugar skills/robo. Al llegar a 6, activas bonus de tempo (energia + robo) y conservas 2 stacks.
| Objetivo de build | Encadenar turnos largos, crear ventaja de recursos y finalizar por combo.

**Reglas de Posesion:**

- +1 Posesion al jugar una skill.
- +1 Posesion extra al jugar un efecto de robo de 2+ cartas.
- Umbral 6: +1 energia y +1 robo instantaneo, luego pasas a 2 Posesion.
- Cap en 8.

## 4.3 Real Madrid

| Elemento | Definicion |
|---|---|
| Identidad | Ventanas explosivas, transicion ataque-defensa, cierre rapido de combate.
| Habilidad base | **Mentalidad Ganadora**: la primera vez por turno que juegas Ataque despues de Skill, ese ataque gana +4 dano.
| Mecanica unica | **Momentum (0-5)**: se gana por kills, por jugar secuencia Skill->Ataque y por dano alto. Se consume para efectos explosivos.
| Objetivo de build | Preparar ventanas cortas de burst y decidir bien cuando gastar Momentum.

**Reglas de Momentum:**

- +1 Momentum al matar un enemigo.
- +1 Momentum al jugar Ataque despues de Skill (max 1 por turno por esta via).
- +1 Momentum al infligir 15+ dano en un solo golpe.
- Algunas cartas consumen Momentum para repetir ataques o ganar energia.
- Cap en 5.

---

## 5. Nuevos tipos de cartas (subtipos de diseño)

Estos subtipos no reemplazan `attack|skill|power`; son tags de diseño/balance para ordenar el pool:

| Subtipo | Funcion |
|---|---|
| Setup | Invierte valor hoy para escalar proximos turnos.
| Tempo | Gana robo/energia para mantener turno largo.
| Control | Reduce output enemigo (debil/vulnerable/ritmo).
| Finisher | Carta de cierre, alto impacto bajo condicion.
| Sustain | Curacion/bloqueo eficiente para runs largas.
| Engine | Pieza de combo repetible (powers/reliquias sinergicas).

### 5.1 Tags prioritarios por equipo

- Athletic: `Setup`, `Sustain`, `Finisher`.
- Barcelona: `Tempo`, `Engine`, `Control`.
- Madrid: `Tempo`, `Finisher`, `Burst`.

---

## 6. Nuevos efectos tecnicos necesarios (motor)

| Effect type nuevo | Uso | Complejidad |
|---|---|---|
| `gain_garra` | Sumar recurso Garra | Baja |
| `spend_garra` | Consumir Garra para escalar | Media |
| `if_garra_at_least` | Condicion por Garra | Baja |
| `gain_posesion` | Sumar Posesion | Baja |
| `trigger_posesion_threshold` | Bonus al llegar a 6 Posesion | Media |
| `set_card_cost_temp` | Reducir coste solo este turno (target en mano) | Media |
| `gain_momentum` | Sumar Momentum | Baja |
| `spend_momentum` | Consumir Momentum | Media |
| `if_previous_card_type` | Bonos por secuencia Skill->Ataque | Baja |
| `damage_bonus_if_enemy_intent_attack` | Bonus segun intencion visible | Baja |
| `retain_block_up_to` | Retener bloqueo con cap | Media |
| `temp_strength_this_turn` | Fuerza temporal sin romper buffs permanentes | Media |

---

## 7. Catalogo de cartas nuevas (detallado)

## 7.1 Athletic Club (12 cartas nuevas)

| Carta | Tipo | Coste | Rareza | Efecto | Rol |
|---|---|---:|---|---|---|
| Rugido Local | Skill | 1 | Common | Gana 6 bloqueo. `gain_garra(1)` | Setup defensivo |
| Entrada Medida | Attack | 1 | Common | 7 dano. Si tienes bloqueo, aplica 1 Vulnerable | Control ofensivo |
| Linea Compacta | Skill | 1 | Common | 8 bloqueo. Si tienes 3+ Garra, roba 1 | Sustain |
| Cantera en Fuego | Skill | 1 | Common | Agota 1 carta de la mano, gana 6 bloqueo y `gain_garra(1)` | Engine exhaust |
| Choque Frontal | Attack | 2 | Uncommon | 14 dano. `spend_garra(hasta 3)`: +3 dano por stack | Finisher medio |
| Duelo Aereo | Attack | 1 | Uncommon | 5x2 dano. Si tienes 10+ bloqueo, aplica 2 Debil | Hibrido |
| Orgullo Inquebrantable | Power | 1 | Uncommon | Primera carta de bloqueo por turno gana +2 bloqueo y `gain_garra(1)` | Engine defensivo |
| Refuerzo de Lezama | Skill | 1 | Uncommon | Roba 2. Agota 1. Si agotaste, gana 4 bloqueo | Tempo + exhaust |
| Himno de San Mames | Power | 3 | Rare | Inicio turno: +4 bloqueo y `gain_garra(1)` | Engine late game |
| Contra del Leon | Attack | 2 | Rare | 12 dano a todos. Consume toda Garra: +2 dano AOE por stack | Finisher AOE |
| Muro Historico | Power | 2 | Rare | `retain_block_up_to(12)` cada turno | Sustain elite/boss |
| Ultimo Minuto en Bilbao | Skill | 2 | Rare | Si HP <= 50%: +12 bloqueo, +2 Fuerza, +2 Destreza; si no: +9 bloqueo y roba 1 | Clutch |

## 7.2 FC Barcelona (12 cartas nuevas)

| Carta | Tipo | Coste | Rareza | Efecto | Rol |
|---|---|---:|---|---|---|
| Pase Vertical | Attack | 1 | Common | 6 dano y `gain_posesion(1)` | Setup ofensivo |
| Pausa y Giro | Skill | 1 | Common | 5 bloqueo, roba 1, `gain_posesion(1)` | Tempo base |
| Triangulo Corto | Skill | 0 | Common | Roba 1, siguiente carta cuesta 0, `gain_posesion(1)` | Motor de combo |
| Presion tras Perdida | Skill | 1 | Common | Aplica 2 Debil y `gain_posesion(1)` | Control |
| Rondo Profundo | Skill | 1 | Uncommon | Roba 2, descarta 1, `gain_posesion(2)` | Tempo alto |
| Juego de Posicion | Power | 1 | Uncommon | Cada 3ra carta que juegues por turno: roba 1 | Engine |
| Entrelineas | Attack | 2 | Uncommon | 12 dano. Si Posesion >= 4: +2 Vulnerable | Setup finisher |
| Orquestar Tiempo | Skill | 2 | Uncommon | +1 energia, reduce en 1 el coste de tu mano este turno | Tempo explosivo |
| Orquesta Blaugrana | Power | 2 | Rare | Al activar umbral de Posesion: +1 energia y +1 robo adicional | Engine principal |
| Gol Asociativo | Attack | 2 | Rare | 10 dano. Consume Posesion de 2 en 2: repite el ataque (max 3 repeticiones) | Finisher combo |
| Ultimo Pase | Skill | 1 | Rare | `set_card_cost_temp`: elige 1 carta en mano y cuesta 0 este turno, roba 1 | Precision de turno |
| Camp Nou Sonoro | Power | 3 | Rare | Inicio turno: `gain_posesion(1)`. Primera skill del turno cuesta 0 | Motor late game |

## 7.3 Real Madrid (12 cartas nuevas)

| Carta | Tipo | Coste | Rareza | Efecto | Rol |
|---|---|---:|---|---|---|
| Salida Vertical | Attack | 1 | Common | 7 dano. Si enemigo intenta atacar, `gain_momentum(1)` | Setup ofensivo |
| Correr al Espacio | Skill | 1 | Common | 6 bloqueo, siguiente ataque cuesta 0, `gain_momentum(1)` | Tempo |
| Latigazo | Attack | 0 | Common | 5 dano. Si carta previa fue Skill, +5 dano | Burst barato |
| Cobertura Expres | Skill | 1 | Common | 7 bloqueo. Si tu HP es menor al del objetivo, +1 energia | Recuperacion ritmo |
| Transicion Relampago | Skill | 1 | Uncommon | +1 energia, roba 1, `gain_momentum(1)` | Motor de turno |
| Mordida del Area | Attack | 2 | Uncommon | 8x2 dano. Si objetivo <50% HP, +6 dano final | Ejecucion |
| Sangre Fria | Power | 1 | Uncommon | Primera vez por combate al bajar de 60% HP: +10 bloqueo y `gain_momentum(2)` | Seguridad |
| Verticalidad Total | Skill | 2 | Uncommon | Siguiente ataque se juega 2 veces y `gain_momentum(1)` | Setup burst |
| Noche Europea | Power | 2 | Rare | Si recibiste dano el turno anterior: inicio turno +1 energia y `gain_momentum(1)` | Engine clutch |
| Gol Minuto 90 | Attack | 3 | Rare | 20 dano. Si HP <= 50% o enemigo intenta atacar, se juega 2 veces | Finisher |
| Remontada Blanca | Skill | 2 | Rare | Si Momentum >= 3: +10 bloqueo, +2 Fuerza, roba 2. Si no: +7 bloqueo, roba 1 | Clutch flexible |
| Tridente Legendario | Attack | 2 | Rare | 8 dano aleatorio x3. Si solo queda 1 enemigo, +6 dano final | Boss killer |

## 7.4 Cartas comunes neutrales (12 cartas nuevas)

| Carta | Tipo | Coste | Rareza | Efecto | Rol |
|---|---|---:|---|---|---|
| Lectura de Partido | Skill | 1 | Common | 5 bloqueo. Si enemigo intenta atacar, roba 1 | Control universal |
| Cambio de Banda | Attack | 1 | Common | 6 dano. Si carta previa fue Skill, +4 dano | Glue de mazo |
| Pase Seguro | Skill | 0 | Common | 3 bloqueo y roba 1 | Consistencia |
| Orden Defensivo | Skill | 2 | Common | 11 bloqueo | Sustain |
| Remate de Rebote | Attack | 1 | Common | 7 dano. Si enemigo vulnerable, +5 dano | Cierre simple |
| Falta Tactica | Skill | 1 | Common | Aplica 1 Debil y 1 Vulnerable. Agota | Control puntual |
| Plan B | Skill | 1 | Uncommon | Agota 1 carta y roba 2 | Reciclaje |
| Ajuste Tactico | Skill | 1 | Uncommon | Reduce en 1 el coste de toda tu mano este turno | Tempo global |
| Medicina de Campo | Skill | 0 | Uncommon | Cura 4 HP, gana 4 bloqueo. Agota | Sustain run |
| Competir sin Balon | Power | 1 | Uncommon | Primera carta no-ataque por turno: +2 bloqueo | Engine defensivo |
| Tecnico Leyenda | Power | 3 | Rare | Cada 4 cartas jugadas en un turno: +1 energia | Engine combo |
| Todo o Nada | Attack | 2 | Rare | 18 dano y recibes 3 dano. Si mata, gana 2 energia | Riesgo/recompensa |

---

## 8. Nuevas reliquias (detalladas)

## 8.1 Reliquias de equipo (9)

| Reliquia | Equipo | Rareza | Efecto |
|---|---|---|---|
| Txapela de Hierro | Athletic | Uncommon | Primera carta de bloqueo por turno gana +3 bloqueo |
| Plan de Lezama | Athletic | Rare | Primera carta agotada por turno roba 1 |
| Catedral Rojiblanca | Athletic | Boss | +1 energia/turno. Al inicio del combate gana 2 Garra. Tradeoff: -1 slot de pocion |
| ADN Blaugrana | Barcelona | Uncommon | Inicio de combate con 2 Posesion |
| Pizarra del Mister | Barcelona | Rare | Cada 3 skills jugadas en un turno, gana 1 energia |
| Control de Montjuic | Barcelona | Boss | Umbral de Posesion conserva 3 stacks en vez de 2. Tradeoff: -1 opcion en recompensa de carta |
| Noche de Champions | Madrid | Uncommon | Primera vez por combate por debajo de 50% HP: +2 Fuerza |
| Banda Derecha | Madrid | Rare | Primer ataque tras jugar una skill cada turno gana +5 dano |
| Gen de Remontada | Madrid | Boss | Cuando ganes Momentum, gana +1 adicional (max 2 por evento). Tradeoff: empiezas combate con 1 Debil |

## 8.2 Reliquias neutrales comunes (6)

| Reliquia | Rareza | Efecto |
|---|---|---|
| Silbato Electronico | Common | Inicio combate: aplica 1 Debil a todos los enemigos |
| Chaleco GPS | Common | Primera carta de bloqueo del combate gana +4 bloqueo |
| Bidon Isotonico | Common | Primer efecto de energia del combate gana +1 energia extra |
| Libreta de Campo | Common | Primer efecto de robo del combate roba +1 adicional |
| Vendas Elasticas | Common | Al final de combate cura 3 HP |
| Microfono de Vestuario | Common | Primer turno de cada combate roba 1 carta |

## 8.3 Reliquias neutrales poco comunes (6)

| Reliquia | Rareza | Efecto |
|---|---|---|
| Cabina VAR | Uncommon | Cada 3 turnos aplica 1 Vulnerable a todos los enemigos |
| Staff de Analisis | Uncommon | Inicio de elite/boss: +1 Destreza |
| Botin de Carbono | Uncommon | Primer ataque de cada turno +3 dano |
| Rutina Invisible | Uncommon | Al jugar 3 skills en un turno: +1 energia |
| Banquillo Activo | Uncommon | Inicio combate: anade una skill comun aleatoria de coste 0 a la mano (agota) |
| Climatizador de Altura | Uncommon | Si HP < 50%, inicio turno gana +1 Fuerza (max 3 por combate) |

## 8.4 Reliquias neutrales raras (5)

| Reliquia | Rareza | Efecto |
|---|---|---|
| Archivo Historico | Rare | Primer power de cada combate cuesta 0 |
| Planificacion Semanal | Rare | Conserva hasta 1 energia al final del turno |
| Centro de Alto Rendimiento | Rare | En descanso: puedes curar y mejorar una carta en la misma sala |
| Premios UEFA | Rare | Primer elite de cada acto deja 1 recompensa adicional |
| Psicologia de Final | Rare | Si HP <= 40%, tus ataques hacen +30% dano |

## 8.5 Reliquias de jefe nuevas (4)

| Reliquia | Rareza | Efecto |
|---|---|---|
| Temporada Perfecta | Boss | +1 energia/turno. Tradeoff: recompensa de carta muestra 1 opcion menos |
| Gestion Total | Boss | +1 energia/turno. Tradeoff: no puedes comprar pociones |
| Apuesta Ofensiva | Boss | +1 energia/turno. Tradeoff: comienzas cada combate con 1 Debil |
| ADN Ganador | Boss | +1 energia/turno. Tradeoff: -10 HP max |

---

## 9. Ajustes de economia y recompensas para sostener la expansion

## 9.1 Recompensas por combate

| Tipo combate | Oro actual aproximado | Oro objetivo |
|---|---:|---:|
| Normal Acto 1 | 15-35 | 16-26 |
| Normal Acto 2 | 27-47 | 24-34 |
| Normal Acto 3 | 39-59 | 32-44 |
| Normal Acto 4 | 51-71 | 42-56 |
| Elite (extra) | variable | +22 fijo + reliquia |
| Boss (extra) | +100 aprox | +90 fijo + boss relic |

## 9.2 Tienda (objetivo)

| Item | Precio objetivo |
|---|---:|
| Carta common | 45 |
| Carta uncommon | 70 |
| Carta rare | 140 |
| Reliquia common | 95 |
| Reliquia uncommon | 145 |
| Reliquia rare | 245 |
| Pocion | 42 |
| Eliminar carta | 80 (sube +25 cada compra) |

**Nota:** con pool mas grande, subir ligeramente el valor de remover carta evita que todos los mazos converjan a ultra-thin deck.

---

## 10. Roadmap de implementacion (por fases)

## Fase 0 - Instrumentacion (2-3 dias)

1. Loggear resultados de run por equipo/ascension.
2. Loggear pickrate por carta y reliquia.
3. Loggear dano infligido/recibido por turno.
4. Guardar metadatos de build (tamano de mazo, cantidad de powers, etc).

## Fase 1 - Sistemas de equipo (4-6 dias)

1. Implementar contadores `garra`, `posesion`, `momentum` en `Player`.
2. Implementar nuevos effect types de la seccion 6.
3. Integrar hooks de inicio turno/fin turno/umbral en `gameStore`.
4. UI de counters en combate.

## Fase 2 - Cartas Wave 1 (6-8 dias)

1. Agregar las 48 cartas propuestas (seccion 7).
2. Ajustar pool de recompensas por equipo + neutrales.
3. Revisar upgrades para nuevos efectos.
4. Validacion funcional de interacciones.

## Fase 3 - Reliquias Wave 1 (4-6 dias)

1. Agregar 30 reliquias propuestas.
2. Separar pools por rareza y por equipo.
3. Garantizar tradeoffs en boss relics.
4. Revisar economia de tienda y drop tables.

## Fase 4 - Balance iterativo (2 ciclos de 1 semana)

1. 100 runs simuladas por equipo en A0, A10, A20.
2. Ajustes de numeros (no reworks) en ciclo 1.
3. Ajustes de diseño puntual (reworks de cartas/reliquias outlier) en ciclo 2.
4. Congelar balance para version estable.

---

## 11. Plan de testing exhaustivo

## 11.1 Matriz minima de pruebas manuales

- Athletic: build Garra, build exhaust, build muro.
- Barcelona: build Posesion-tempo, build control-debuff, build combo-finisher.
- Madrid: build Momentum-burst, build low HP clutch, build energy-loop.

Cada build debe probarse en:

1. Acto 1 boss.
2. Acto 3 elite.
3. Acto 4 boss.
4. A0 y A20.

## 11.2 Criterios de aceptacion

1. Ningun equipo supera 62% winrate en A0 ni cae por debajo de 54%.
2. Diferencia de winrate entre equipos <= 5 pp en cada ascension objetivo.
3. Ninguna carta common con pickrate > 45% sostenido.
4. Ninguna boss relic con pickrate > 55% sostenido.
5. Tiempo medio de combate por acto dentro de rango esperado:
- Acto 1: 4-6 turnos.
- Acto 2: 5-7 turnos.
- Acto 3: 6-8 turnos.
- Acto 4: 7-10 turnos.

---

## 12. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigacion |
|---|---|---|
| Power creep por expansion de cartas | Alto | Presupuesto de poder por rareza + caps por recurso |
| Loops infinitos de energia/robo | Alto | Hard caps por turno y efectos once-per-turn |
| Reliquias boss sin tradeoff real | Medio | Reglas de coste explicito en cada boss relic |
| Team identity difusa | Medio | Mantener mecanica unica por equipo con keywords propias |
| Exceso de complejidad para jugadores nuevos | Medio | Tooltips claros + desbloqueo gradual de cartas avanzadas |

---

## 13. Entregables finales de esta etapa de planificacion

1. Definicion completa de identidad + habilidad + mecanica para cada equipo.
2. Lista detallada de cartas nuevas por equipo y neutrales (48).
3. Lista detallada de reliquias nuevas (30).
4. Framework de metricas y reglas de balance profesional.
5. Roadmap tecnico y de playtesting para ejecutar sin ambiguedad.

---

## 14. Archivos a tocar cuando empiece implementacion

- `app/src/types/game.ts`
- `app/src/store/gameStore.ts`
- `app/src/data/cards.ts`
- `app/src/data/relics.ts`
- `app/src/lib/cardUpgrade.ts`
- `app/src/components/Combat.tsx`
- `app/src/components/PlayerStats.tsx`
- `app/src/components/Card.tsx`

Este plan queda listo para arrancar implementacion por fases sin rehacer la arquitectura actual.
