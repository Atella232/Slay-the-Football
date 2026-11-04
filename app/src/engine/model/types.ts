import type { RngState } from '../core/rng'

// ───────────────────────── Identificadores básicos ─────────────────────────

export type ClubId = 'athletic' | 'barcelona' | 'madrid'
export type CardClub = ClubId | 'neutral'
export type CardType = 'ataque' | 'defensa' | 'tactica' | 'sistema' | 'estado'
export type Rarity = 'inicial' | 'comun' | 'poco' | 'rara' | 'leyenda' | 'especial'
export type Keyword = 'agotar' | 'retener' | 'inicial' | 'efimera' | 'injugable' | 'doblete'
export type ClubRes = 'garra' | 'posesion' | 'momentum'
export type Side = 'player' | 'rival'
export type Who = 'self' | 'rival'
export type Pile = 'draw' | 'hand' | 'discard' | 'agotadas' | 'sistemas'
export type StatusId =
  | 'confianza'
  | 'solidez'
  | 'fatiga'
  | 'desorganizado'
  | 'desconcentrado'
  | 'amarilla'
  | 'expulsion'
  | 'contragolpe'
  | 'reaccion'
export type Tier = 'liga' | 'copa' | 'final' | 'amistoso'
export type MatchPhaseName = 'primera' | 'segunda' | 'tramoFinal' | 'prorroga'
export type TrofeoTier = 'inicial' | 'comun' | 'poco' | 'rara' | 'jefe' | 'tienda' | 'club' | 'especial'
export type NodeType = 'partido' | 'grande' | 'concentracion' | 'mercado' | 'evento' | 'vitrina' | 'final'
export type Act = 1 | 2 | 3

// ───────────────────────── Valores y condiciones ─────────────────────────

export type V =
  | number
  | { k: 'res'; res: ClubRes }
  | { k: 'bound'; name: string }
  | { k: 'count'; pile: Pile; type?: CardType }
  | { k: 'turn' }
  | { k: 'scoreDiff' }
  | { k: 'goalsFor' }
  | { k: 'played'; type?: CardType }
  | { k: 'block' }
  | { k: 'status'; who: Who; id: StatusId }
  | { k: 'x' }
  | { k: 'add'; a: V; b: V }
  | { k: 'mul'; a: V; b: V }
  | { k: 'min'; a: V; b: V }
  | { k: 'max'; a: V; b: V }

export type CmpOp = '<' | '<=' | '=' | '>=' | '>'

export type Cond =
  | { k: 'phase'; is: MatchPhaseName }
  | { k: 'scoreDiff'; op: CmpOp; n: number }
  | { k: 'res'; res: ClubRes; op: CmpOp; n: number }
  | { k: 'intentHas'; part: IntentKind }
  | { k: 'lastPlayed'; type: CardType }
  | { k: 'prevPlayed'; type: CardType }
  | { k: 'status'; who: Who; id: StatusId; op: CmpOp; n: number }
  | { k: 'block'; op: CmpOp; n: number }
  | { k: 'formaPct'; op: CmpOp; n: number }
  | { k: 'played'; type?: CardType; op: CmpOp; n: number }
  | { k: 'handSize'; op: CmpOp; n: number }
  | { k: 'rivalSegmentPct'; op: CmpOp; n: number }
  | { k: 'firstTurn' }
  | { k: 'tier'; is: Tier }
  | { k: 'and'; c: Cond[] }
  | { k: 'or'; c: Cond[] }
  | { k: 'not'; c: Cond }

// ───────────────────────── Operaciones de efecto ─────────────────────────

export type CardFilter = { type?: CardType; notType?: CardType; club?: CardClub; maxCost?: number; upgraded?: boolean }

export type PickAct = 'exhaust' | 'discard' | 'toHand' | 'toDrawTop' | 'upgradeTmp' | 'freeTurn' | 'retain'

export type EffectOp =
  | { op: 'peligro'; n: V; hits?: V }
  | { op: 'bloqueo'; n: V }
  | { op: 'draw'; n: V }
  | { op: 'energy'; n: V }
  | { op: 'status'; who: Who; id: StatusId; n: V }
  | { op: 'res'; res: ClubRes; n: V }
  | { op: 'spendRes'; res: ClubRes; max: number | 'all'; then: EffectOp[] }
  | { op: 'pick'; from: 'hand' | 'draw' | 'discard'; min: number; max: number; f?: CardFilter; act: PickAct; then?: EffectOp[] }
  | { op: 'addCard'; def: string; to: 'hand' | 'draw' | 'discard'; n: V; upgraded?: boolean }
  | { op: 'freeNext'; type?: CardType; n?: number }
  | { op: 'handCost'; delta: number; type?: CardType }
  | { op: 'playTwice'; type: CardType }
  | { op: 'cancelOcasion' }
  | { op: 'reduceOcasion'; n: V }
  | { op: 'reduceAtaque'; n: V }
  | { op: 'clock'; n: number }
  | { op: 'repliegueRemove'; n: V | 'all' }
  | { op: 'heal'; n: V }
  | { op: 'loseForma'; n: V }
  | { op: 'gold'; n: V }
  | { op: 'cambios'; n: V }
  | { op: 'retainBlock'; n: V }
  | { op: 'exhaustSelf' }
  | { op: 'if'; c: Cond; then: EffectOp[]; else?: EffectOp[] }
  | { op: 'repeat'; n: V; ops: EffectOp[] }
  | { op: 'choose'; options: { label: string; ops: EffectOp[] }[] }
  | { op: 'custom'; h: string; args?: Record<string, number | string> }
  // internas del motor
  | { op: '_finishPlay'; uid: number }

export type RunOp =
  | { op: 'gold'; n: number }
  | { op: 'heal'; n: number }
  | { op: 'healPct'; n: number }
  | { op: 'loseForma'; n: number }
  | { op: 'formaMax'; n: number }
  | { op: 'addCard'; def: string; upgraded?: boolean }
  | { op: 'addCardChoice'; pool: CardPoolSpec; n: number }
  | { op: 'deckPick'; purpose: DeckPickPurpose; n: number }
  | { op: 'trofeo'; tier?: TrofeoTier; id?: string }
  | { op: 'consumible'; id?: string }
  | { op: 'startMatch'; tier: Tier; rival?: string }
  | { op: 'random'; options: { w: number; ops: RunOp[]; text: string }[] }

export type DeckPickPurpose = 'remove' | 'upgrade' | 'transform' | 'duplicate'

export interface CardPoolSpec {
  club?: 'own' | 'neutral' | 'any'
  rarity?: Rarity
  type?: CardType
}

// ───────────────────────── Hooks y modificadores ─────────────────────────

export type HookEvent =
  | 'matchStart'
  | 'turnStart'
  | 'turnEnd'
  | 'cardPlayed'
  | 'cardExhausted'
  | 'goalScored'
  | 'goalConceded'
  | 'parada'
  | 'halftime'
  | 'blockGained'
  | 'damageTaken'
  | 'rivalTurnStart'
  | 'rivalTurnEnd'
  | 'cambio'
  | 'resGained'
  | 'statusApplied'
  | 'matchEnd'
  | 'shuffle'
  | 'peligroDealt'

export interface EventFilter {
  type?: CardType
  res?: ClubRes
  minN?: number
  who?: Who
  status?: StatusId
}

export interface HookDef {
  on: HookEvent
  f?: EventFilter
  when?: Cond
  ops: EffectOp[]
  limit?: { per: 'turn' | 'match'; n: number }
}

export type ModStat =
  | 'peligro' // por instancia de peligro del jugador
  | 'bloqueo' // por instancia de bloqueo del jugador
  | 'ocasionIn' // valor de ocasión rival
  | 'ataqueIn' // daño de ataque rival
  | 'repliegueIn' // repliegue rival
  | 'drawPerTurn'
  | 'energyPerTurn'
  | 'cambios'
  | 'firstTurnDraw'
  | 'firstTurnEnergy'

export interface ModifierDef {
  stat: ModStat
  add?: V
  pct?: number
  when?: Cond
  type?: CardType // para peligro/bloqueo: sólo si la carta es de este tipo
}

export type RunModStat =
  | 'shopPct'
  | 'removeCostAdd'
  | 'goldPct'
  | 'restHealPct'
  | 'cardChoices'
  | 'consumibleSlots'
  | 'healAfterWin'
  | 'actHealPct'
  | 'noRest'
  | 'noConsumibleShop'
  | 'restUpgradeAndHeal'
  | 'rareChance'
  | 'segmentPct'
  | 'formaMax'

export interface RunModDef {
  stat: RunModStat
  n: number
}

// ───────────────────────── Definiciones de contenido ─────────────────────────

export type DiagramTpl =
  | 'disparo'
  | 'cabezazo'
  | 'paseLargo'
  | 'triangulo'
  | 'rondo'
  | 'regate'
  | 'contra'
  | 'presion'
  | 'lineaAlta'
  | 'muro'
  | 'despeje'
  | 'parada'
  | 'corner'
  | 'falta'
  | 'cambio'
  | 'banda'
  | 'desmarque'
  | 'autobus'
  | 'tiki'
  | 'remontada'
  | 'estado'
  | 'sistema'

export interface CardUp {
  cost?: number | 'X'
  ops?: EffectOp[]
  kw?: Keyword[]
  hooks?: HookDef[]
  mods?: ModifierDef[]
  name?: string
}

export interface CardDef {
  id: string
  name: string
  club: CardClub
  type: CardType
  rarity: Rarity
  cost: number | 'X'
  kw?: Keyword[]
  ops: EffectOp[]
  hooks?: HookDef[] // activos mientras el Sistema está en juego
  mods?: ModifierDef[] // activos mientras el Sistema está en juego
  inHand?: HookDef[] // activos mientras la carta está en la mano (estados)
  playIf?: Cond
  up: CardUp
  text?: string // anula el texto automático; admite {P} {B} {P2}
  upText?: string
  flavor?: string
  art: { tpl: DiagramTpl; seed?: number }
  tags?: string[]
  unlock?: number // nivel de club necesario
  legend?: { player: string; dorsal: number }
}

export interface CardInst {
  uid: number
  def: string
  up: boolean
  tmpCost?: number // delta hasta fin de turno
  free?: boolean // cuesta 0 hasta jugarse
  retain?: boolean // retener este turno
  tmpUp?: boolean // mejorada sólo en este partido
}

export interface TrofeoDef {
  id: string
  name: string
  tier: TrofeoTier
  club?: ClubId
  text: string
  flavor?: string
  icon: string
  hooks?: HookDef[]
  mods?: ModifierDef[]
  runMods?: RunModDef[]
  onPickup?: RunOp[]
  counter?: { every: number; on: HookEvent; f?: EventFilter; ops: EffectOp[] }
}

export interface ConsumibleDef {
  id: string
  name: string
  text: string
  icon: string
  rarity: 'comun' | 'poco' | 'rara'
  ops?: EffectOp[] // uso en partido
  runOps?: RunOp[] // uso en mapa
}

export type IntentKind = 'ocasion' | 'ataque' | 'repliegue' | 'presion' | 'buff' | 'especial'

export type IntentPart =
  | { k: 'ocasion'; n: number }
  | { k: 'ataque'; n: number; hits?: number }
  | { k: 'repliegue'; n: number }
  | { k: 'presion'; ops: EffectOp[]; text: string }
  | { k: 'buff'; ops: EffectOp[]; text: string }

export interface MoveDef {
  name: string
  parts: IntentPart[]
}

export interface RivalAiDef {
  moves: Record<string, MoveDef>
  opening?: string[]
  pick: { move: string; w: number; when?: Cond }[]
  maxRepeat?: number
}

export interface RivalPhaseDef {
  atGoalsConceded: number
  name: string
  ai: RivalAiDef
  onEnter?: EffectOp[]
}

export interface KitSpec {
  primary: string
  secondary: string
  pattern: 'liso' | 'rayas' | 'aros' | 'mitades' | 'banda' | 'chevron' | 'cuartos' | 'finas'
  crest: 'escudo' | 'circulo' | 'rombo' | 'estandarte'
  emblem: number
}

export interface RivalDef {
  id: string
  name: string
  short: string
  act: Act
  tier: 'liga' | 'copa' | 'final'
  easy?: boolean
  segments: number[]
  meta?: number
  startRepliegue?: number
  trait: { name: string; text: string }
  hooks?: HookDef[]
  mods?: ModifierDef[]
  ai: RivalAiDef
  phases?: RivalPhaseDef[]
  formation: string
  kit: KitSpec
  crest?: ClubId // finales contra clubes reales
  rivalStatuses?: { id: StatusId; n: number }[]
  pens?: { keeperTell: number; shooterTell: number }
}

export interface EventOption {
  label: string
  text: string
  requires?: { gold?: number; forma?: number; deckType?: CardType; club?: ClubId }
  ops: RunOp[]
}

export interface EventDef {
  id: string
  title: string
  text: string
  acts: Act[]
  options: EventOption[]
  art: DiagramTpl
}

export interface CharlaDef {
  id: string
  name: string
  text: string
  ops: EffectOp[]
}

export interface ClubDef {
  id: ClubId
  name: string
  short: string
  motto: string
  forma: number
  res: ClubRes
  resName: string
  resMax: number
  resText: string
  starter: string[]
  starterTrofeo: string
  passive: { name: string; text: string; hooks: HookDef[]; mods?: ModifierDef[] }
  colors: { primary: string; secondary: string; accent: string }
  unlock: string
}

export interface ExigenciaLevelDef {
  level: number
  text: string
}

// ───────────────────────── Estado de partido ─────────────────────────

export interface StatusInst {
  id: StatusId
  n: number
  fresh: boolean
}

export interface FreeNext {
  type?: CardType
  n: number
}

export interface PlayerMatch {
  block: number
  energy: number
  cambios: number
  st: StatusInst[]
  res: Record<ClubRes, number>
  freeNext: FreeNext[]
  playTwice: CardType[]
  retainBlock: number
  drawBonusNext: number
  energyBonusNext: number
}

export interface RivalMatch {
  def: string
  seg: number
  segs: number[]
  defensa: number
  repliegue: number
  st: StatusInst[]
  intent: MoveDef | null
  intentId: string | null
  history: string[]
  aiPhase: number
  kickoffLock: boolean
  cancelledOcasion: boolean
  ocasionMod: number
  ataqueMod: number
}

export interface TurnCounters {
  played: number
  byType: Record<CardType, number>
  last?: CardType
  prev?: CardType
  goals: number
  firstAttackDone: boolean
  energySpent: number
}

export interface MatchStats {
  turns: number
  goalsFor: number
  goalsAgainst: number
  paradas: number
  ocasionesRival: number
  formaLost: number
  cardsPlayed: number
  peligroTotal: number
  peligroLost: number
  energyUnused: number
  cambiosUsed: number
  maxDeficit: number
  bestTurnPeligro: number
}

export interface PenaltyKick {
  side: Side
  dir: 'L' | 'C' | 'R'
  dive: 'L' | 'C' | 'R'
  goal: boolean
}

export interface PenaltyState {
  kicks: PenaltyKick[]
  next: Side
  tell: 'L' | 'C' | 'R'
  done: boolean
}

export interface Pending {
  kind: 'pick' | 'choose'
  from?: 'hand' | 'draw' | 'discard'
  min: number
  max: number
  f?: CardFilter
  act?: PickAct
  options?: { label: string; ops: EffectOp[] }[]
  prompt: string
  src: Source
}

export interface Source {
  kind: 'card' | 'trofeo' | 'status' | 'rival' | 'club' | 'charla' | 'consumible' | 'exigencia' | 'engine'
  id: string
  uid?: number
}

export interface Task {
  ops: EffectOp[]
  i: number
  src: Source
  bind: Record<string, number>
  x?: number
}

export type MatchResult = 'victoria' | 'empate' | 'derrota'

export interface MatchState {
  rival: RivalMatch
  tier: Tier
  meta: number
  nodeId: string
  turn: number
  maxTurns: number
  added: number
  prorroga: boolean
  phase: 'player' | 'charla' | 'penalties' | 'ended'
  score: { f: number; a: number }
  player: PlayerMatch
  cards: Record<number, CardInst>
  piles: Record<Pile, number[]>
  limbo: number[]
  forceExhaust: number[]
  queue: Task[]
  pending: Pending | null
  turnCtr: TurnCounters
  hookUse: Record<string, number>
  rng: RngState
  pens: PenaltyState | null
  charlas: string[] | null
  result: MatchResult | null
  stats: MatchStats
  log: string[]
}

// ───────────────────────── Estado de run ─────────────────────────

export interface MapNode {
  id: string
  row: number
  col: number
  type: NodeType
  next: string[]
}

export interface MapState {
  act: Act
  nodes: MapNode[]
  current: string | null
  visited: string[]
  finalRival: string
}

export interface RewardItem {
  kind: 'gold' | 'cards' | 'trofeo' | 'consumible' | 'trofeoChoice'
  gold?: number
  cards?: { def: string; up: boolean }[]
  trofeo?: string
  trofeos?: string[]
  consumible?: string
  taken: boolean
}

export interface RewardState {
  title: string
  items: RewardItem[]
  after: 'map' | 'actEnd'
}

export interface ShopItem {
  kind: 'card' | 'trofeo' | 'consumible'
  id: string
  price: number
  sold: boolean
  up?: boolean
}

export interface ShopState {
  items: ShopItem[]
  removePrice: number
  removeUsed: boolean
}

export interface EventState {
  id: string
  done: boolean
  resultText?: string
}

export interface DeckPickState {
  purpose: DeckPickPurpose
  n: number
  back: Screen
  then?: RunOp[]
}

export interface CardChoiceState {
  cards: { def: string; up: boolean }[]
  back: Screen
  then?: RunOp[]
}

export type RunEnd = 'campeon' | 'eliminado' | 'lesionado' | 'destituido' | 'abandono'

export type Screen =
  | { k: 'map' }
  | { k: 'match'; m: MatchState }
  | { k: 'reward'; r: RewardState }
  | { k: 'shop'; s: ShopState }
  | { k: 'event'; e: EventState }
  | { k: 'rest'; done: boolean }
  | { k: 'treasure'; trofeo: string | null; gold: number; taken: boolean }
  | { k: 'deckPick'; p: DeckPickState }
  | { k: 'cardChoice'; c: CardChoiceState }
  | { k: 'actEnd'; healed: number }
  | { k: 'ended'; outcome: RunEnd }

export type RunStream =
  | 'map'
  | 'rivals'
  | 'rewards'
  | 'cardRewards'
  | 'shop'
  | 'events'
  | 'treasure'
  | 'charlas'
  | 'consumibles'
  | 'misc'

export interface RunStats {
  floors: number
  matches: number
  wins: number
  draws: number
  losses: number
  goalsFor: number
  goalsAgainst: number
  cleanSheets: number
  grandesWon: number
  finalsWon: number
  penaltiesPlayed: number
  comebacks: number
  goldEarned: number
  cardsPicked: string[]
  trofeosPicked: string[]
  maxDamageTurn: number
  perfectMatches: number
}

export interface RunState {
  v: number
  contentV: string
  seed: string
  club: ClubId
  exig: number
  daily: boolean
  clubLevel: number
  act: Act
  map: MapState
  forma: number
  formaMax: number
  gold: number
  deck: CardInst[]
  trofeos: { id: string; ctr: number }[]
  consumibles: (string | null)[]
  strikes: number
  nextUid: number
  removeCount: number
  rng: Record<RunStream, RngState>
  screen: Screen
  stats: RunStats
  seenRivals: string[]
  seenEvents: string[]
  lastRivals: string[]
  rareBonus: number
  log: string[]
}

// ───────────────────────── Acciones y eventos ─────────────────────────

export type Action =
  | { t: 'play'; uid: number }
  | { t: 'endTurn' }
  | { t: 'cambio'; uid: number }
  | { t: 'consumible'; slot: number }
  | { t: 'dropConsumible'; slot: number }
  | { t: 'resolve'; pick: number[] }
  | { t: 'charla'; i: number }
  | { t: 'penalty'; dir: 'L' | 'C' | 'R' }
  | { t: 'node'; id: string }
  | { t: 'take'; i: number; choice?: number }
  | { t: 'proceed' }
  | { t: 'buy'; i: number }
  | { t: 'removeService' }
  | { t: 'event'; i: number }
  | { t: 'rest'; o: 'heal' | 'entrenar' }
  | { t: 'deckPick'; uids: number[] }
  | { t: 'cardChoice'; i: number }
  | { t: 'abandon' }

export type GameEvent =
  | { e: 'draw'; uid: number }
  | { e: 'shuffle' }
  | { e: 'play'; uid: number; def: string }
  | { e: 'discard'; uid: number }
  | { e: 'exhaust'; uid: number }
  | { e: 'toSistemas'; uid: number }
  | { e: 'cardCreated'; uid: number; to: Pile }
  | { e: 'cambio'; uid: number }
  | { e: 'energy'; n: number }
  | { e: 'block'; side: Side; n: number }
  | { e: 'peligro'; n: number; toRepliegue: number; toDefensa: number; lost: number }
  | { e: 'goal'; side: Side; f: number; a: number }
  | { e: 'kickoffLock' }
  | { e: 'intent'; name: string }
  | { e: 'ocasion'; n: number; saved: boolean }
  | { e: 'ataque'; n: number; blocked: number; forma: number }
  | { e: 'status'; side: Side; id: StatusId; n: number }
  | { e: 'res'; res: ClubRes; n: number }
  | { e: 'clock'; turn: number; minute: number }
  | { e: 'halftime' }
  | { e: 'prorroga' }
  | { e: 'rivalPhase'; name: string }
  | { e: 'rivalMove'; name: string }
  | { e: 'trofeoProc'; id: string }
  | { e: 'penalty'; kick: PenaltyKick }
  | { e: 'matchEnd'; result: MatchResult }
  | { e: 'gold'; n: number }
  | { e: 'forma'; n: number }
  | { e: 'heal'; n: number }
  | { e: 'turnStart'; turn: number }
  | { e: 'rivalTurn' }
  | { e: 'cardAdded'; def: string }
  | { e: 'screen'; k: Screen['k'] }
  | { e: 'log'; text: string }
