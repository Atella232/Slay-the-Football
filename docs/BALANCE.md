# Balance

El balance se mide con el simulador (`app/src/sim`) y se ajusta con las perillas de `app/src/engine/rules.ts` (Defensa, Ocasión y Ataque por tipo de partido y acto) y con los números de cada carta y rival.

## Herramientas
```bash
npm run sim -- --club athletic --runs 100 --bot heur --seed b1   # informe por acto y tipo de partido
npm run sim:smoke                                                 # 25 runs aleatorias + 5 greedy por club, falla con errores
```
Bots: `random` (fuzzing de invariantes), `greedy` (1 jugada), `heur` (completa el turno en simulación antes de decidir; aproxima a un jugador competente con criterio de mazo simple).

Invariantes comprobadas tras cada acción: cada carta en una sola pila, energía ≥ 0, Forma en rango, marcador ≤ meta, siempre hay acciones legales, serialización estable. Hay un test de replay que reproduce una partida desde la semilla y la lista de acciones.

## Objetivos (Exigencia 0, bot heur)
| Métrica | Objetivo |
|---|---|
| Temporadas ganadas por club | 40–50%, ≤ 6 pp de diferencia entre clubes |
| Llegar al acto 2 / 3 | 85% / 60% |
| Liga | 78–88% victorias, 5–6,5 turnos |
| Copa | 60–80% victorias, prórroga 10–20% |
| Final | acto 1 75–85%, acto 2 65–80%, acto 3 55–70% |
| Ninguna carta | > +6 pp de victoria al tenerla en el mazo |

## Estado actual (bot heur, 100 temporadas por club, semilla c4)
| Club | Campeón | Llega al acto 2 | Llega al acto 3 | Final de temporada más frecuente |
|---|---:|---:|---:|---|
| Athletic | 41% | 90% | 61% | sin Forma (29%) |
| Barça | 43% | 84% | 54% | eliminado en una Final (26%) |
| Real Madrid | 40% | 95% | 69% | sin Forma (40%): ataca mucho y se desgasta |

Victoria por partido (Liga / Copa / Final) y turnos medios de Liga:
| Club | Acto 1 | Acto 2 | Acto 3 | Turnos Liga |
|---|---|---|---|---|
| Athletic | 96 / 90 / 91% | 88 / 82 / 81% | 85 / 82 / 84% | 4,8 |
| Barça | 95 / 80 / 86% | 90 / 92 / 75% | 95 / 90 / 88% | 4,2–4,9 |
| Real Madrid | 97 / 94 / 95% | 89 / 85 / 87% | 89 / 81 / 76% | 3,7–4,3 |

Exigencia 15 (40 temporadas por club): 5–20% de campeón.

Pendiente de observar con partidas humanas: los partidos de Liga duran menos (4–5 turnos) que el objetivo de diseño (5,5–6,5) y casi nunca acaban en empate. Si se quiere más tensión con el reloj, subir `segMult.liga` en `rules.ts` y compensar con Forma de los clubes.

El impacto por carta se mide sobre el mazo con el que se empieza el acto 2 (para reducir el sesgo de supervivencia). Con 100 temporadas el ruido es de ±15 pp, así que sólo sirve para detectar valores extremos.
