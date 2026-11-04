import { useEffect, useMemo, useRef } from 'react'
import type { MapNode, NodeType, RunState } from '../../engine/model/types'
import { reachableNodes } from '../../engine/run/run'
import { clubDef, rivalDef } from '../../engine/registry'
import { Icon } from '../art/icons'
import { Crest, Kit } from '../art/team'
import { useGame } from '../store/game'
import { audio } from '../../platform/audio'

const NODE_INFO: Record<NodeType, { name: string; icon: string; text: string }> = {
  partido: { name: 'Partido de Liga', icon: 'partido', text: 'Rival normal. Meta: 2 goles. Se puede empatar.' },
  grande: { name: 'Partido Grande', icon: 'grande', text: 'Eliminatoria de Copa: rival duro, meta 3 goles, prórroga y penaltis. Premio: un Trofeo.' },
  concentracion: { name: 'Concentración', icon: 'descanso', text: 'Descansa (recupera Forma) o entrena (mejora una carta).' },
  mercado: { name: 'Mercado', icon: 'tienda', text: 'Compra cartas, trofeos y consumibles, o da de baja una carta.' },
  evento: { name: 'Evento', icon: 'evento', text: 'Algo pasa fuera del campo. Decide bien.' },
  vitrina: { name: 'Vitrina', icon: 'vitrina', text: 'Un Trofeo y algo de oro te esperan.' },
  final: { name: 'Final', icon: 'final', text: 'El jefe del acto. Perder aquí termina la temporada.' },
}

const ACT_NAME = ['', 'Segunda División', 'Primera División', 'Liga de Campeones']
const COL_W = 92
const ROW_H = 74
const PAD = 60

export function MapScene({ run }: { run: RunState }) {
  const act = useGame(s => s.act)
  const busy = useGame(s => s.busy)
  const scroller = useRef<HTMLDivElement>(null)
  const reach = useMemo(() => new Set(reachableNodes(run)), [run])
  const nodes = run.map.nodes
  const maxRow = Math.max(...nodes.map(n => n.row))
  const height = PAD * 2 + maxRow * ROW_H + 40
  const width = COL_W * 7
  const pos = (n: MapNode): [number, number] => {
    if (n.type === 'final') return [width / 2, PAD]
    return [COL_W / 2 + n.col * COL_W, height - PAD - n.row * ROW_H]
  }
  const final = rivalDef(run.map.finalRival)
  const club = clubDef(run.club)

  const current = run.map.current
  useEffect(() => {
    audio.setMusic('map')
    const el = scroller.current
    if (!el) return
    const cur = nodes.find(n => n.id === current)
    const row = cur ? cur.row : 0
    const y = height - PAD - row * ROW_H
    el.scrollTo({ top: Math.max(0, y - el.clientHeight * 0.65), behavior: 'smooth' })
  }, [current, height, nodes])

  const choose = (id: string) => {
    if (busy || !reach.has(id)) return
    audio.play('click')
    act({ t: 'node', id })
  }

  useEffect(() => {
    const opts = nodes.filter(n => reach.has(n.id)).sort((a, b) => a.col - b.col)
    const onKey = (e: KeyboardEvent) => {
      if (useGame.getState().overlay) return
      const n = Number(e.key)
      if (n >= 1 && n <= opts.length) choose(opts[n - 1].id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const options = nodes.filter(n => reach.has(n.id)).sort((a, b) => a.col - b.col)

  return (
    <div className="map-scene">
      <div className="map-side">
        <div className="chalk-title" style={{ fontSize: 34 }}>
          Acto {run.act}
        </div>
        <div className="display" style={{ fontSize: 22 }}>
          {ACT_NAME[run.act]}
        </div>
        <div className="box">
          <h4>La Final del acto</h4>
          <div className="row">
            <Crest spec={final.kit} club={final.crest} short={final.crest ? undefined : final.short} size={56} />
            <div>
              <div className="display" style={{ fontSize: 20 }}>
                {final.name}
              </div>
              <div className="muted" style={{ fontSize: 15 }}>
                {final.trait.name}: {final.trait.text}
              </div>
            </div>
          </div>
        </div>
        <div className="box">
          <h4>Leyenda</h4>
          {(Object.keys(NODE_INFO) as NodeType[]).map(t => (
            <div key={t} className="legend-row" data-tip={`${NODE_INFO[t].name}|${NODE_INFO[t].text}`}>
              <Icon name={NODE_INFO[t].icon} size={18} /> {NODE_INFO[t].name}
            </div>
          ))}
        </div>
      </div>
      <div className="map-scroll chalkboard-lite" ref={scroller}>
        <div className="map-canvas" style={{ width, height }}>
          <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }} aria-hidden>
            {nodes.map(n =>
              n.next.map(nid => {
                const t = nodes.find(x => x.id === nid)
                if (!t) return null
                const [x1, y1] = pos(n)
                const [x2, y2] = pos(t)
                const visited = run.map.visited.includes(n.id) && run.map.visited.includes(nid)
                const fromCur = run.map.current === n.id || (run.map.current === null && n.row === 0)
                return (
                  <line
                    key={n.id + nid}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={visited ? 'rgba(242,193,78,.85)' : fromCur && reach.has(nid) ? 'rgba(242,193,78,.6)' : 'rgba(242,239,227,.22)'}
                    strokeWidth={visited ? 4 : 3}
                    strokeDasharray={visited ? undefined : '7 7'}
                    strokeLinecap="round"
                  />
                )
              }),
            )}
          </svg>
          {nodes.map(n => {
            const [x, y] = pos(n)
            const info = NODE_INFO[n.type]
            const visited = run.map.visited.includes(n.id)
            const cls = ['map-node', `n-${n.type}`, visited ? 'visited' : '', run.map.current === n.id ? 'current' : '', reach.has(n.id) && !busy ? 'reachable' : ''].join(' ')
            return (
              <button
                key={n.id}
                className={cls}
                style={{ left: x, top: y }}
                onClick={() => choose(n.id)}
                disabled={!reach.has(n.id)}
                data-tip={`${info.name}|${info.text}`}
                aria-label={info.name}
              >
                {n.type === 'final' ? <Crest spec={final.kit} club={final.crest} size={64} /> : <Icon name={info.icon} size={24} />}
              </button>
            )
          })}
        </div>
      </div>
      <div className="map-side">
        <div className="box">
          <h4>Siguiente jornada</h4>
          <div className="col">
            {options.map((n, i) => (
              <button key={n.id} className="reward-item" onClick={() => choose(n.id)} disabled={busy}>
                <span className="ic">
                  <Icon name={NODE_INFO[n.type].icon} size={22} />
                </span>
                <span>
                  {i + 1}. {NODE_INFO[n.type].name}
                  <small>{NODE_INFO[n.type].text}</small>
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="box">
          <h4>Tu equipo</h4>
          <div className="row">
            <Kit spec={{ primary: club.colors.primary, secondary: club.colors.secondary, pattern: club.id === 'madrid' ? 'liso' : 'rayas', crest: 'escudo', emblem: 0 }} size={54} />
            <div className="muted" style={{ fontSize: 16 }}>
              {run.deck.length} cartas · {run.trofeos.length} trofeos
              <br />
              Jornada {run.stats.floors} · {run.stats.wins}V {run.stats.draws}E {run.stats.losses}D
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
