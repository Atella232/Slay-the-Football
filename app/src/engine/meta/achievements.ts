import type { RunState } from '../model/types'
import type { Profile } from './profile'
import { cardDef } from '../registry'

export interface AchievementDef {
  id: string
  name: string
  text: string
  check: (run: RunState, p: Profile) => boolean
}

const ended = (r: RunState) => (r.screen.k === 'ended' ? r.screen.outcome : null)
const champion = (r: RunState) => ended(r) === 'campeon'

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'primer_gol', name: 'Primer gol', text: 'Marca tu primer gol.', check: r => r.stats.goalsFor >= 1 },
  { id: 'ascenso', name: 'Ascenso', text: 'Gana la Final del acto 1.', check: r => r.act >= 2 || champion(r) },
  { id: 'primera', name: 'Asentado en Primera', text: 'Gana la Final del acto 2.', check: r => r.act >= 3 || champion(r) },
  { id: 'campeon', name: 'Campeón de Europa', text: 'Gana una temporada completa.', check: r => champion(r) },
  { id: 'campeon_ath', name: 'Leones de Europa', text: 'Gana una temporada con el Athletic.', check: r => champion(r) && r.club === 'athletic' },
  { id: 'campeon_bar', name: 'Triplete azulgrana', text: 'Gana una temporada con el Barça.', check: r => champion(r) && r.club === 'barcelona' },
  { id: 'campeon_mad', name: 'Rey de Europa', text: 'Gana una temporada con el Real Madrid.', check: r => champion(r) && r.club === 'madrid' },
  { id: 'tres_clubes', name: 'Gran Slam', text: 'Gana una temporada con los tres clubes.', check: (r, p) => ['athletic', 'barcelona', 'madrid'].every(c => p.history.some(h => h.club === c && h.outcome === 'campeon') || (champion(r) && r.club === c)) },
  { id: 'exig5', name: 'Exigente', text: 'Gana con Exigencia 5 o más.', check: r => champion(r) && r.exig >= 5 },
  { id: 'exig10', name: 'Muy exigente', text: 'Gana con Exigencia 10 o más.', check: r => champion(r) && r.exig >= 10 },
  { id: 'exig15', name: 'Leyenda del banquillo', text: 'Gana con Exigencia 15.', check: r => champion(r) && r.exig >= 15 },
  { id: 'goleador', name: 'Máquina de goles', text: 'Marca 50 goles en una temporada.', check: r => r.stats.goalsFor >= 50 },
  { id: 'muro', name: 'El muro', text: 'Consigue 10 porterías a cero en una temporada.', check: r => r.stats.cleanSheets >= 10 },
  { id: 'remontada', name: 'Remontada', text: 'Gana un partido después de ir perdiendo.', check: r => r.stats.comebacks >= 1 },
  { id: 'remontadas', name: 'Especialista en remontadas', text: 'Remonta 5 partidos en una temporada.', check: r => r.stats.comebacks >= 5 },
  { id: 'penaltis', name: 'Nervios de acero', text: 'Juega una tanda de penaltis.', check: r => r.stats.penaltiesPlayed >= 1 },
  { id: 'perfecto', name: 'Partido perfecto', text: 'Gana un partido sin encajar ni perder Forma.', check: r => r.stats.perfectMatches >= 1 },
  { id: 'invicto', name: 'Invicto', text: 'Gana una temporada sin perder ningún partido.', check: r => champion(r) && r.stats.losses === 0 },
  { id: 'mazo_corto', name: 'Plantilla corta', text: 'Gana una temporada con 15 cartas o menos.', check: r => champion(r) && r.deck.length <= 15 },
  { id: 'coleccionista', name: 'Vitrina llena', text: 'Termina una temporada con 12 trofeos o más.', check: r => r.trofeos.length >= 12 },
  { id: 'rico', name: 'Presupuesto de grande', text: 'Acumula 400 de oro a la vez.', check: r => r.gold >= 400 },
  { id: 'leyenda', name: 'Fichaje de leyenda', text: 'Termina una temporada con una Leyenda en el mazo.', check: r => r.deck.some(c => cardDef(c.def).rarity === 'leyenda') },
  { id: 'veterano', name: 'Veterano', text: 'Termina 10 temporadas.', check: (_r, p) => p.totals.runs >= 10 },
  { id: 'diario', name: 'Cita diaria', text: 'Completa un reto diario.', check: r => r.daily },
  { id: 'centenario', name: 'Centenario', text: 'Marca 100 goles entre todas tus temporadas.', check: (_r, p) => p.totals.goals >= 100 },
]

export function evaluateAchievements(run: RunState, p: Profile): string[] {
  return ACHIEVEMENTS.filter(a => !p.achievements.includes(a.id) && a.check(run, p)).map(a => a.id)
}
