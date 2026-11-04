# Reglas del juego

## La temporada
- Tres actos: **Segunda División**, **Primera División** y **Liga de Campeones**. Cada acto es un mapa de 13 jornadas que termina en una **Final**.
- Nodos del mapa: Partido de Liga, Partido Grande (Copa), Concentración (descansar 35% de Forma o entrenar una carta), Mercado, Evento, Vitrina (trofeo + oro) y Final.
- Filas fijas: la primera jornada es un partido fácil, la 7ª una Vitrina y la 13ª una Concentración. Cada camino tiene al menos un Mercado, una Concentración y como mucho 3 Partidos Grandes.
- **Forma** es la vida del equipo durante toda la temporada. A 0, termina la temporada.
- **Avisos de la directiva**: perder en Liga o Copa cuesta el 10% de la Forma máxima, añade una carta *Crisis* al mazo (se va con la siguiente victoria) y suma un aviso. Con 3 avisos en el mismo acto (2 en Exigencia 10+), destitución. Los avisos se borran al ascender.
- Perder una Final termina la temporada. Ganarla da un trofeo de campeón (con coste) y una carta rara o Leyenda; al ascender se recupera el 60% de la Forma perdida.

## El partido
- 8 turnos (minutos 1' a 90'), descanso tras el 4º con una **charla** a elegir entre 3.
- Cada turno: 3 de Energía, robas 5 (mano máxima 10), el Bloqueo se pierde. **Cambios**: 3 por partido, descartas una carta y robas otra.
- Tus **Ataques** generan **Peligro**: primero rompe el **Repliegue** rival y luego su **Defensa**. Al vaciar la Defensa, **gol**; la Defensa se rellena con el siguiente segmento.
- **Saque de centro**: tras marcar, el Peligro sobrante de ese turno se pierde (salvo cartas con *Doblete*). Como mucho un gol por turno.
- El rival anuncia su intención: **Ocasión X** (si tu Bloqueo < X, gol rival; si lo paras, ganas *Contragolpe*), **Ataque X** (daño a tu Forma reducido por el Bloqueo), **Repliegue**, **Presión** (estados o cartas malas) y refuerzos. Orden: Repliegue/refuerzos → Ocasión → Ataque → Presión. Los números que se ven son los finales.
- **Meta**: gana quien llegue antes a 2 goles (Liga) o 3 (Copa y Final). Al 90' gana quien vaya por delante. En Liga se puede empatar; en Copa y Final hay **prórroga** de 2 turnos con gol de oro (el rival +25%, tú +1 Cambio) y después **penaltis** (elige dirección; el portero y el lanzador dan pistas que aciertan el 65% y 55% de las veces).
- **Asedio**: si el rival va perdiendo, gana +1 de Confianza cada turno y busca más Ocasiones. **Reacción**: al encajar, robas una carta más el turno siguiente.

## Estados (iguales para ambos bandos)
| Estado | Efecto |
|---|---|
| Confianza | +n a cada instancia de Peligro (o de Ocasión y Ataque del rival) |
| Solidez | +n a cada instancia de Bloqueo (o Repliegue) |
| Fatiga | −25% a lo que produce |
| Desorganizado | +50% de Peligro o daño recibido (no afecta a Ocasiones) |
| Desconcentrado | −25% de Bloqueo ganado |
| Amarilla | a la segunda, expulsión: el jugador roba 1 carta menos; el rival de Liga pierde un 25% de Defensa; en Copa/Final, bronca y pierde su siguiente Ocasión |

Los estados de duración bajan 1 al final del turno de quien los sufre (si se aplicaron en ese mismo turno, esperan uno más).

## Clubes
| Club | Recurso | Pasiva |
|---|---|---|
| Athletic | Garra (máx. 10) | +1 al agotar una carta, al ganar 8+ de Bloqueo de una vez y con cada Parada; en el tramo final, +1 por turno. Sus mejores cartas gastan Garra. |
| Barça | Posesión (máx. 8) | +1 por Táctica; al llegar a 6: +1 Energía, robas 1 y vuelves a 2 (una vez por turno). Con 4+, las Ocasiones rivales −2. |
| Real Madrid | Momentum (máx. 5) | +1 al marcar, al jugar Ataque tras Táctica (una vez por turno) y con golpes de 15+; si vas perdiendo o en el tramo final, +1 por turno. |

Cada club tiene 30 cartas (2 iniciales, 11 comunes, 9 poco comunes, raras y Leyendas), 3 trofeos propios y 10 cartas que se desbloquean subiendo el nivel del club.

## Progresión
- Barça se desbloquea ganando la Final del acto 1 con el Athletic; Madrid, ganándola con el Barça.
- XP de club por puntuación de temporada (niveles 1–10).
- **Exigencia 0–15** por club: se desbloquea ganando con el nivel anterior. Cada nivel añade una dificultad (ver `app/src/content/exigencia.ts`).
- **Reto diario**: misma semilla, club y dos condiciones para todo el mundo cada día.
- Álbum de cromos/trofeos/rivales, 25 logros e historial de las últimas 50 temporadas.
