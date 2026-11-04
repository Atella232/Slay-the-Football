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

## Estado actual
Ver la sección de resultados del último commit de balance en el historial de git (`git log --grep balance`).
