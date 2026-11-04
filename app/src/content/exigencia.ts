import type { ExigenciaLevelDef } from '../engine/model/types'

/** Niveles de Exigencia (acumulativos). El motor los aplica por número de nivel. */
export const EXIGENCIA: ExigenciaLevelDef[] = [
  { level: 0, text: 'Temporada normal.' },
  { level: 1, text: 'Más Partidos Grandes en el mapa.' },
  { level: 2, text: 'Los rivales de Liga defienden un 10% más.' },
  { level: 3, text: 'Los rivales de Copa defienden un 10% más.' },
  { level: 4, text: 'Las Finales generan un 10% más de Ocasión y Ataque.' },
  { level: 5, text: 'Descansar cura menos y el paso de acto recupera menos.' },
  { level: 6, text: 'Empiezas la temporada con Nervios en el mazo.' },
  { level: 7, text: 'Los rivales de Liga empiezan con 1 de Confianza.' },
  { level: 8, text: 'Cada derrota también cuesta 3 de Forma máxima.' },
  { level: 9, text: 'Los rivales de Copa empiezan con 6 de Repliegue.' },
  { level: 10, text: 'La directiva te destituye a las 2 derrotas.' },
  { level: 11, text: 'Un hueco de consumible menos.' },
  { level: 12, text: 'El Mercado es un 10% más caro.' },
  { level: 13, text: 'Las Finales defienden un 10% más.' },
  { level: 14, text: '−5 de Forma máxima inicial.' },
  { level: 15, text: 'Exigencia máxima: todo lo anterior.' },
]
