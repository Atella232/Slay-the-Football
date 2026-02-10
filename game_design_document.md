# CLIMB THE LEAGUE - Documento de Diseño
## Un Roguelike de Cartas con Temática de Fútbol

---

## 1. RESUMEN EJECUTIVO

**Climb the League** es un roguelike de construcción de mazos (deck-building) con temática de fútbol, inspirado en Slay the Spire. Los jugadores ascienden a través de diferentes divisiones enfrentándose a equipos cada vez más difíciles, construyendo su mazo de jugadas tácticas y habilidades de equipo.

### Sistema de Desbloqueo Progresivo
- **Athletic Club** - Desbloqueado desde el inicio (Estilo: Fuerza y Defensa)
- **FC Barcelona** - Desbloquea tras completar con Athletic (Estilo: Posesión y Tiki-Taka)
- **Real Madrid** - Desbloquea tras completar con Barça (Estilo: Contraataque y Galácticos)

---

## 2. MECÁNICAS PRINCIPALES (Basadas en Slay the Spire)

### 2.1 Estructura del Combate

| Aspecto | Descripción |
|---------|-------------|
| **Turnos** | Por turnos - jugador primero, luego enemigos |
| **Energía** | 3 energía base por turno |
| **Robo** | 5 cartas al inicio de cada turno |
| **Mano** | Sin límite de cartas en mano |
| **Descarte** | Las cartas jugadas van al descarte (salvo que digan lo contrario) |

### 2.2 Recursos del Jugador

| Recurso | Descripción |
|---------|-------------|
| **HP (Moral del Equipo)** | Salud del equipo. Si llega a 0, pierdes la partida |
| **Energía** | Recurso para jugar cartas |
| **Dinero** | Para comprar en la tienda |
| **Victorias** | Progreso hacia el ascenso |

### 2.3 Tipos de Cartas

| Tipo | Descripción |
|------|-------------|
| **Ataque** | Cartas de ofensiva (disparos, pases al hueco, regates) |
| **Defensa** | Cartas defensivas (entradas, coberturas, despejes) |
| **Habilidad** | Efectos tácticos (cambios de sistema, presión, contraataque) |
| **Poder** | Efectos permanentes para toda la batalla (estilos de juego, ventajas tácticas) |

### 2.4 Palabras Clave de Cartas

| Palabra Clave | Efecto |
|---------------|--------|
| **Exhaust** | La carta se elimina del combate actual |
| **Retener** | No se descarta al final del turno |
| **Innata** | Comienza en la mano inicial |
| **Eterea** | Se exhausta si no se juega este turno |
| **Agotar** | No se añade al mazo de robo |

---

## 3. ESTRUCTURA DEL MAPA

### 3.1 Tipos de Salas

| Icono | Nombre | Descripción |
|-------|--------|-------------|
| ⚽ | **Partido Normal** | Enfrentamiento contra equipo estándar |
| 🔥 | **Partido Élite** | Enfrentamiento difícil contra equipo fuerte (recompensa: Trofeo) |
| 🏨 | **Hotel/Descanso** | Descansar (curar 30% HP) o Entrenar (mejorar carta) |
| ❓ | **Evento Desconocido** | Puede ser: evento, partido, tienda, o sala de trofeos |
| 🏆 | **Sala de Trofeos** | Obtienes un Trofeo aleatorio |
| 🛒 | **Tienda** | Comprar cartas, trofeos, objetos, o eliminar cartas |
| 👑 | **Partido Final** | Jefe del acto - equipo de la cima de la tabla |

### 3.2 Estructura de los Actos

| Acto | Nombre | Descripción |
|------|--------|-------------|
| **Acto 1** | Segunda División | 15-17 nodos, enemigos fáciles, 1 élite |
| **Acto 2** | Primera División | 15-17 nodos, enemigos medios, 2 élites |
| **Acto 3** | Liga de Campeones | 15-17 nodos, enemigos difíciles, 2-3 élites |
| **Acto 4** *(opcional)* | Mundial de Clubes | Solo disponible con claves especiales |

---

## 4. SISTEMA DE EQUIPOS

### 4.1 ATHLETIC CLUB (Desbloqueado)
*"Leones con corazón de hierro"*

**Estilo:** Fuerza bruta, defensa sólida, juego directo
**HP Inicial:** 85
**Reliquia Inicial:** *Sangre de León* - Al final de cada partido, cura 6 HP

#### Mazo Inicial (10 cartas)
- 4x **Golpeo** (Ataque) - 6 daño
- 4x **Cobertura** (Defensa) - 5 bloqueo
- 1x **Entrada Dura** (Ataque) - 8 daño, aplica 2 Vulnerable
- 1x **Muro Rojiblanco** (Habilidad) - 8 bloqueo, agota

#### Arquetipos de Build

| Build | Descripción | Cartas Clave |
|-------|-------------|--------------|
| **Muro Defensivo** | Acumular bloqueo y contraatacar | Muro, Refuerzo, Contraataque |
| **Fuerza Bruta** | Aumentar fuerza y golpear fuerte | Gimnasio, Golpeo Potente, Dominio |
| **Exhaustión** | Agotar cartas para beneficios | Cantera, Espíritu de Lucha, Último Aliento |

#### Cartas Únicas de Athletic

| Carta | Tipo | Coste | Efecto |
|-------|------|-------|--------|
| **San Mamés** | Poder | 3 | Al inicio del turno, gana 4 bloqueo |
| **Lezama** | Poder | 1 | Cuando agotas una carta, roba 1 carta |
| **Aupa Athletic** | Ataque | 2 | 12 daño. Si tienes más de 20 bloqueo, haz 8 daño adicional |
| **Garra Rojiblanca** | Ataque | 1 | 7 daño. Aplica 2 Vulnerable |
| **Orgullo Vasco** | Defensa | 2 | 10 bloqueo. Si el enemigo tiene Vulnerable, gana 5 bloqueo adicional |

---

### 4.2 FC BARCELONA (Desbloquea tras Athletic)
*"Més que un club"*

**Estilo:** Posesión, pases precisos, control total
**HP Inicial:** 75
**Reliquia Inicial:** *La Masia* - Al inicio de cada partido, roba 2 cartas adicionales

#### Mazo Inicial (10 cartas)
- 4x **Pase Corto** (Ataque) - 5 daño
- 4x **Posicionamiento** (Defensa) - 5 bloqueo
- 1x **Tiki-Taka** (Habilidad) - Roba 3 cartas, descarta 1
- 1x **Toque de Balón** (Habilidad) - 4 bloqueo, roba 1 carta

#### Arquetipos de Build

| Build | Descripción | Cartas Clave |
|-------|-------------|--------------|
| **Posesión Total** | Robar muchas cartas, ciclar el mazo | Tiki-Taka, Rondo, Toque de Balón |
| **Falso 9** | Debuffs y control del rival | Presión, Desmarque, Engaño |
| **MSN/Tridente** | Daño masivo con combos | Messi, Suárez, Neymar |

#### Cartas Únicas de Barcelona

| Carta | Tipo | Coste | Efecto |
|-------|------|-------|--------|
| **Camp Nou** | Poder | 3 | Al inicio del turno, roba 1 carta adicional |
| **La Masia** | Poder | 2 | Las cartas que cuestan 0 tienen +3 daño |
| **Tiki-Taka** | Habilidad | 1 | Roba 3 cartas. La siguiente carta cuesta 0 |
| **Messi** | Ataque | 3 | 20 daño. Si jugaste 3+ cartas este turno, haz 10 daño adicional |
| **Xavi-Iniesta** | Habilidad | 2 | Roba 2 cartas. Reduce su coste en 1 |
| **Pedri-Gavi** | Habilidad | 1 | 4 bloqueo. Roba 1 carta. La siguiente carta de defensa cuesta 0 |
| **Presión Alta** | Poder | 2 | Al inicio del turno, aplica 1 Débil a TODOS los enemigos |

---

### 4.3 REAL MADRID (Desbloquea tras Barça)
*"Hasta el final, vamos Real"*

**Estilo:** Contraataque letal, velocidad, estrellas galácticas
**HP Inicial:** 80
**Reliquia Inicial:** *Decimocuarta* - Al inicio de cada partido, canaliza 1 Rayo (daño al inicio del turno)

#### Mazo Inicial (10 cartas)
- 4x **Disparo** (Ataque) - 6 daño
- 4x **Marcaje** (Defensa) - 5 bloqueo
- 1x **Contraataque** (Habilidad) - 8 daño, gana energía si el enemigo atacó
- 1x **Galáctico** (Poder) - +2 Fuerza

#### Arquetipos de Build

| Build | Descripción | Cartas Clave |
|-------|-------------|--------------|
| **Contraataque** | Castigar ataques enemigos, velocidad | Contraataque, Transición Rápida, Carrera |
| **Galácticos** | Estrellas con efectos poderosos | Ronaldo, Zidane, Benzema |
| **Remontada** | Volverse más fuerte con poca vida | Espíritu Madridista, Hasta el Final, Corazón |

#### Cartas Únicas de Real Madrid

| Carta | Tipo | Coste | Efecto |
|-------|------|-------|--------|
| **Santiago Bernabéu** | Poder | 3 | Al inicio del turno, inflige 3 daño a TODOS los enemigos |
| **Decimocuarta** | Poder | 2 | +1 Energía al inicio de cada turno |
| **Ronaldo Nazario** | Ataque | 2 | 15 daño. Si el enemigo tiene >50% HP, haz 10 daño adicional |
| **Zidane** | Habilidad | 1 | Roba 2 cartas. La siguiente carta de ataque se juega dos veces |
| **Benzema** | Ataque | 2 | 10 daño. Si el enemigo tiene <50% HP, haz 8 daño adicional |
| **Modrić-Kroos** | Habilidad | 2 | Gana 1 energía. Roba 2 cartas |
| **Remontada Épica** | Poder | 3 | Si tu HP está por debajo de 50%, +5 Fuerza y +5 Destreza |

---

## 5. SISTEMA DE ENEMIGOS

### 5.1 Enemigos Normales (Acto 1)

| Enemigo | HP | Patrón | Recompensa |
|---------|-----|--------|------------|
| **Portero Novato** | 40 | Defiende, luego ataca | 10-15€, 1 carta |
| **Defensa Regional** | 50 | Alterna ataque/defensa | 10-15€, 1 carta |
| **Mediocentro Luchador** | 45 | Aplica débil, luego ataca | 10-15€, 1 carta |
| **Delantero Promesa** | 35 | Ataque fuerte pero predecible | 10-15€, 1 carta |

### 5.2 Élites (Acto 1-3)

| Élite | HP | Habilidad Especial | Recompensa |
|-------|-----|-------------------|------------|
| **Portero Estrella** | 90 | Reduce daño recibido en 50% | Trofeo + 25-35€ + carta |
| **Capitán del Equipo** | 100 | Aplica buffs a aliados | Trofeo + 25-35€ + carta |
| **Delantero Goleador** | 80 | Ataques críticos que ignoran bloqueo | Trofeo + 25-35€ + carta |

### 5.3 Jefes de Acto

| Jefe | Acto | HP | Mecánica Especial |
|------|------|-----|-------------------|
| **Campeón de Segunda** | 1 | 150 | Fases: defensiva → ofensiva |
| **Líder de Primera** | 2 | 200 | Invoca refuerzos |
| **Campeón de Europa** | 3 | 250 | Múltiples fases, mecánicas complejas |

---

## 6. SISTEMA DE TROFEOS (RELICS)

### 6.1 Trofeos Comunes

| Trofeo | Efecto |
|--------|--------|
| **Botas de Oro** | +1 Fuerza al inicio de cada partido |
| **Guante de Plata** | +1 Destreza al inicio de cada partido |
| **Balón Oficial** | Gana 1 energía el primer turno de cada partido |
| **Venda Mágica** | Al final de cada partido, cura 2 HP |
| **Pito del Árbitro** | Aplica 1 Vulnerable a TODOS los enemigos al inicio |

### 6.2 Trofeos Poco Comunes

| Trofeo | Efecto |
|--------|--------|
| **Medalla de Campeón** | Cada 3 turnos, gana 1 energía |
| **Botella de Agua** | Al entrar en Hotel, empieza el siguiente partido con 2 energía |
| **Cinta de Capitán** | Si no juegas ataques durante tu turno, gana 1 energía el siguiente turno |
| **Espinilleras** | Al inicio de cada partido, gana 3 Espinas (daño al ser atacado) |

### 6.3 Trofeos Raros

| Trofeo | Efecto |
|--------|--------|
| **Copa de Europa** | La energía se conserva entre turnos |
| **Bota de Oro Histórica** | Cada 10º ataque inflige daño doble |
| **Leyenda del Club** | Al agotar una carta, añade una carta aleatoria a tu mano |

### 6.4 Trofeos de Jefe

| Trofeo | Efecto |
|--------|--------|
| **Ascenso Directo** | Gana 1 energía al inicio de cada turno. En recompensas de cartas, tienes 2 opciones menos |
| **Título de Liga** | Gana 1 energía al inicio de cada turno. No puedes descansar en Hoteles |
| **Champions League** | Transforma todos los Golpeos y Coberturas en cartas mejoradas |

---

## 7. SISTEMA DE EVENTOS

### 7.1 Eventos Comunes

| Evento | Descripción | Opciones |
|--------|-------------|----------|
| **El Médico** | Encuentras al médico del equipo | [Curar 25% HP] [Eliminar carta] [Subir HP máximo +7] |
| **Entrenamiento** | Sesión de entrenamiento especial | [Mejorar carta] [Añadir carta aleatoria] [Salir] |
| **Fanático** | Un fan te ofrece algo | [Aceptar regalo (+cartas)] [Rechazar (+HP)] |
| **Prensa** | Rueda de prensa | [Presión (+fuerza)] [Calma (+destreza)] |

### 7.2 Eventos Especiales

| Evento | Descripción | Opciones |
|--------|-------------|----------|
| **El Clásico** | Partido amistoso contra rival histórico | [Jugar (riesgo/recompensa)] [Evitar] |
| **Fichaje Bomba** | Oportunidad de fichar | [Comprar carta rara] [Negociar (evento)] |
| **Lesión** | Un jugador está lesionado | [Curar (pierde oro)] [Jugar con lo que hay] |

---

## 8. OBJETOS (POTIONS)

| Objeto | Efecto |
|--------|--------|
| **Bebida Energética** | Gana 2 (4) energía |
| **Vendas** | Gana 12 (24) bloqueo |
| **Analgésicos** | Cura 20% (40%) de HP máximo |
| **Estrategia** | Añade 1 (2) copia de carta de ataque aleatoria, cuesta 0 |
| **Táctica** | Añade 1 (2) copia de carta de habilidad aleatoria, cuesta 0 |
| **Motivación** | Gana 2 (4) Fuerza |
| **Concentración** | Gana 2 (4) Destreza |
| **Suplente Mágico** | Cuando morirías, cura a 30% (60%) de HP máximo |

---

## 9. EFECTOS DE ESTADO

### 9.1 Buffs (Jugador)

| Buff | Efecto |
|------|--------|
| **Fuerza** | +X daño en ataques |
| **Destreza** | +X bloqueo de cartas de defensa |
| **Armadura de Placas** | Al final del turno, gana X bloqueo |
| **Metamorfosis** | Al final del turno, gana X bloqueo |
| **Espinas** | Al recibir daño de ataque, devuelve X daño |

### 9.2 Debuffs (Enemigos)

| Debuff | Efecto |
|--------|--------|
| **Vulnerable** | Recibe 50% más daño de ataques |
| **Débil** | Inflige 25% menos daño con ataques |
| **Veneno** | Al inicio del turno, pierde X HP. Reduce en 1 cada turno |
| **Marcado** | Recibe daño adicional de ciertas cartas |

### 9.3 Debuffs (Jugador)

| Debuff | Efecto |
|--------|--------|
| **Frágil** | Bloqueo de cartas de defensa reduce 25% |
| **Sin Robo** | No puedes robar cartas este turno |
| **Herido** | Cartas de herida en el mazo |

---

## 10. PROGRESIÓN Y DESBLOQUEO

### 10.1 Sistema de Desbloqueo

```
NUEVA PARTIDA
     ↓
┌─────────────────┐
│ ATHLETIC CLUB   │ ← Desbloqueado
│   (Fuerza)      │
└─────────────────┘
     ↓ (Completar Acto 3)
┌─────────────────┐
│  FC BARCELONA   │ ← Desbloqueado
│  (Posesión)     │
└─────────────────┘
     ↓ (Completar Acto 3)
┌─────────────────┐
│  REAL MADRID    │ ← Desbloqueado
│ (Contraataque)  │
└─────────────────┘
```

### 10.2 Sistema de Victorias

- **Victoria Normal:** Completar los 3 actos
- **Victoria Épica:** Completar con Acto 4 (requiere claves especiales)
- **Ascensión:** Modo de dificultad creciente (0-20)

### 10.3 Logros y Recompensas

| Logro | Recompensa |
|-------|------------|
| Primera victoria con Athletic | Desbloquea Barcelona |
| Primera victoria con Barcelona | Desbloquea Real Madrid |
| Victoria con los 3 equipos | Modo Ascensión completo |
| Victoria en Ascensión 20 | Título de "Leyenda" |

---

## 11. INTERFAZ DE USUARIO

### 11.1 Pantallas Principales

1. **Pantalla de Inicio** - Selección de equipo desbloqueado
2. **Mapa** - Visualización del camino con nodos
3. **Combate** - Mano, energía, HP, intenciones enemigas
4. **Tienda** - Compra de cartas, trofeos, objetos
5. **Hotel** - Descansar o Entrenar
6. **Recompensas** - Selección de cartas tras combate

### 11.2 Elementos Visuales

- **Paleta de colores:** Cada equipo tiene sus colores distintivos
  - Athletic: Rojo y blanco
  - Barcelona: Azulgrana
  - Real Madrid: Blanco

- **Estilo visual:** Minimalista, cartas con ilustraciones de jugadas tácticas

---

## 12. BALANCE Y ECONOMÍA

### 12.1 Precios de Tienda

| Item | Precio Base |
|------|-------------|
| Carta Común | 50€ |
| Carta Poco Común | 75€ |
| Carta Rara | 150€ |
| Trofeo Común | 100€ |
| Trofeo Poco Común | 150€ |
| Trofeo Raro | 250€ |
| Objeto | 40€ |
| Eliminar Carta | 75€ |

### 12.2 Recompensas de Combate

| Tipo | Oro | Cartas | Objetos |
|------|-----|--------|---------|
| Normal | 10-20€ | 3 opciones | 30% |
| Élite | 25-35€ | 3 opciones (+rareza) | 50% + Trofeo |
| Jefe | 95-105€ | 3 raras | 50% |

---

## 13. IMPLEMENTACIÓN TÉCNICA

### 13.1 Stack Tecnológico
- **Frontend:** React + TypeScript + Vite
- **Estilos:** Tailwind CSS
- **Componentes:** shadcn/ui
- **Estado:** React Context / Zustand
- **Animaciones:** Framer Motion

### 13.2 Estructura de Datos

```typescript
// Carta
interface Card {
  id: string;
  name: string;
  type: 'attack' | 'skill' | 'power';
  cost: number;
  description: string;
  effects: Effect[];
  rarity: 'common' | 'uncommon' | 'rare';
  team: 'athletic' | 'barcelona' | 'madrid' | 'neutral';
}

// Enemigo
interface Enemy {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  intents: Intent[];
  buffs: Buff[];
  debuffs: Debuff[];
}

// Trofeo
interface Relic {
  id: string;
  name: string;
  description: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'boss';
  effect: Effect;
}
```

---

## 14. ROADMAP DE DESARROLLO

### Fase 1: Core (Semana 1)
- [x] Sistema de cartas básico
- [x] Combate por turnos
- [x] Mazo inicial
- [x] Enemigos básicos

### Fase 2: Contenido (Semana 2)
- [x] Mapa procedural
- [x] Eventos
- [x] Tienda
- [x] Trofeos

### Fase 3: Equipos (Semana 3)
- [x] Athletic Club completo
- [x] Barcelona completo
- [x] Real Madrid completo
- [x] Sistema de desbloqueo

### Fase 4: Polish (Semana 4)
- [x] Balance
- [x] UI/UX
- [x] Animaciones
- [x] Sonido

---

*Documento de Diseño v1.0 - Climb the League*
