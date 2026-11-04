import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import type { RunState } from '../../engine/model/types'
import { C, cardDef, clubDef, consumibleDef, trofeoDef } from '../../engine/registry'
import { cardText } from '../../engine/text/cardText'
import { deckPickCandidates, optionAvailable, restHealAmount, upgradable } from '../../engine/run/run'
import { hasRunMod } from '../../engine/match/modifiers'
import { scoreBreakdown, xpToNext } from '../../engine/meta/profile'
import { CardView, ownColor } from '../components/Card'
import { Icon } from '../art/icons'
import { Diagram } from '../art/Diagram'
import { useGame } from '../store/game'
import { audio } from '../../platform/audio'

export function CardFor({ run, def, up, onClick, selected, dim }: { run: RunState; def: string; up: boolean; onClick?: () => void; selected?: boolean; dim?: boolean }) {
  const d = cardDef(def)
  return <CardView def={d} up={up} text={cardText(d, up)} cost={up && d.up.cost !== undefined ? d.up.cost : d.cost} selected={selected} dim={dim} own={ownColor(d.club, run.club)} onClick={onClick} tabIndex={0} />
}

// ───────────── Recompensas ─────────────

export function RewardScene({ run }: { run: RunState }) {
  const act = useGame(s => s.act)
  const [cardsOpen, setCardsOpen] = useState<number | null>(null)
  const [trofeoOpen, setTrofeoOpen] = useState<number | null>(null)
  if (run.screen.k !== 'reward') return null
  const r = run.screen.r
  const noSlots = !run.consumibles.includes(null)
  if (cardsOpen !== null) {
    const it = r.items[cardsOpen]
    return (
      <div className="scene">
        <div className="scene-title">Elige una carta</div>
        <div className="choice-cards">
          {it.cards!.map((c, i) => (
            <CardFor key={i} run={run} def={c.def} up={c.up} onClick={() => { audio.play('card'); act({ t: 'take', i: cardsOpen, choice: i }); setCardsOpen(null) }} />
          ))}
        </div>
        <button className="btn" onClick={() => setCardsOpen(null)}>
          Volver
        </button>
      </div>
    )
  }
  if (trofeoOpen !== null) {
    const it = r.items[trofeoOpen]
    return (
      <div className="scene">
        <div className="scene-title">Trofeo de campeón</div>
        <div className="scene-sub">Elige uno. Todos tienen un precio.</div>
        <div className="row" style={{ alignItems: 'stretch' }}>
          {it.trofeos!.map((id, i) => {
            const d = trofeoDef(id)
            return (
              <button key={id} className="reward-item" style={{ width: 300, flexDirection: 'column', alignItems: 'flex-start' }} onClick={() => { audio.play('buff'); act({ t: 'take', i: trofeoOpen, choice: i }); setTrofeoOpen(null) }}>
                <span className="ic" style={{ color: 'var(--purple)' }}>
                  <Icon name={d.icon} size={26} />
                </span>
                <span className="display" style={{ fontSize: 22 }}>
                  {d.name}
                </span>
                <small>{d.text}</small>
              </button>
            )
          })}
        </div>
        <button className="btn" onClick={() => setTrofeoOpen(null)}>
          Volver
        </button>
      </div>
    )
  }
  return (
    <div className="scene">
      <div className="scene-title">{r.title}</div>
      {r.items.length === 0 && <div className="scene-sub">Sin premio esta vez. Toca levantarse.</div>}
      <div className="reward-list">
        {r.items.map((it, i) => {
          if (it.kind === 'gold')
            return (
              <button key={i} className="reward-item" disabled={it.taken} onClick={() => { audio.play('coin'); act({ t: 'take', i }) }}>
                <span className="ic"><Icon name="oro" size={24} /></span>
                <span>{it.gold} de oro</span>
              </button>
            )
          if (it.kind === 'cards')
            return (
              <button key={i} className="reward-item" disabled={it.taken} onClick={() => setCardsOpen(i)}>
                <span className="ic"><Icon name="mazo" size={24} /></span>
                <span>
                  Añadir una carta al mazo
                  <small>Elige entre {it.cards!.length} opciones (o ninguna)</small>
                </span>
              </button>
            )
          if (it.kind === 'trofeo') {
            const d = trofeoDef(it.trofeo!)
            return (
              <button key={i} className="reward-item" disabled={it.taken} onClick={() => { audio.play('buff'); act({ t: 'take', i }) }}>
                <span className="ic"><Icon name={d.icon} size={24} /></span>
                <span>
                  {d.name}
                  <small>{d.text}</small>
                </span>
              </button>
            )
          }
          if (it.kind === 'trofeoChoice')
            return (
              <button key={i} className="reward-item" disabled={it.taken} onClick={() => setTrofeoOpen(i)}>
                <span className="ic" style={{ color: 'var(--purple)' }}><Icon name="copa" size={24} /></span>
                <span>
                  Trofeo de campeón
                  <small>Elige 1 de {it.trofeos!.length}</small>
                </span>
              </button>
            )
          const d = consumibleDef(it.consumible!)
          return (
            <button key={i} className="reward-item" disabled={it.taken || noSlots} onClick={() => act({ t: 'take', i })}>
              <span className="ic" style={{ color: 'var(--block)' }}><Icon name={d.icon} size={24} /></span>
              <span>
                {d.name}
                <small>{noSlots ? 'No tienes huecos libres' : d.text}</small>
              </span>
            </button>
          )
        })}
      </div>
      <button className="btn primary big" onClick={() => act({ t: 'proceed' })}>
        {r.after === 'actEnd' ? 'Celebrar el título' : 'Continuar'}
      </button>
    </div>
  )
}

// ───────────── Mercado ─────────────

export function ShopScene({ run }: { run: RunState }) {
  const act = useGame(s => s.act)
  if (run.screen.k !== 'shop') return null
  const s = run.screen.s
  const cards = s.items.map((it, i) => ({ it, i })).filter(x => x.it.kind === 'card')
  const others = s.items.map((it, i) => ({ it, i })).filter(x => x.it.kind !== 'card')
  const buy = (i: number) => {
    audio.play('coin')
    act({ t: 'buy', i })
  }
  return (
    <div className="scene" style={{ gap: 10, paddingTop: 12 }}>
      <div className="row" style={{ width: '100%', justifyContent: 'space-between' }}>
        <div className="scene-title" style={{ fontSize: 38 }}>Mercado de fichajes</div>
        <button className="btn primary" onClick={() => act({ t: 'proceed' })}>
          Salir del mercado
        </button>
      </div>
      <div className="row" style={{ gap: 12, alignItems: 'flex-start' }}>
        {cards.map(({ it, i }) => (
          <div key={i} className="col" style={{ alignItems: 'center', gap: 6, opacity: it.sold ? 0.25 : 1 }}>
            <CardFor run={run} def={it.id} up={!!it.up} onClick={() => !it.sold && run.gold >= it.price && buy(i)} dim={!it.sold && run.gold < it.price} />
            <span className="tag" style={{ color: run.gold >= it.price ? 'var(--gold)' : 'var(--bad)', fontSize: 18 }}>
              <Icon name="oro" size={16} /> {it.sold ? 'Vendida' : it.price}
            </span>
          </div>
        ))}
      </div>
      <div className="row" style={{ gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        {others.map(({ it, i }) => {
          const d = it.kind === 'trofeo' ? trofeoDef(it.id) : consumibleDef(it.id)
          const disabled = it.sold || run.gold < it.price || (it.kind === 'consumible' && !run.consumibles.includes(null))
          return (
            <button key={i} className="reward-item" style={{ width: 280 }} disabled={disabled} onClick={() => buy(i)}>
              <span className="ic" style={{ color: it.kind === 'trofeo' ? 'var(--gold)' : 'var(--block)' }}>
                <Icon name={d.icon} size={22} />
              </span>
              <span>
                {d.name} · <span style={{ color: 'var(--gold)' }}>{it.sold ? 'Vendido' : it.price}</span>
                <small>{d.text}</small>
              </span>
            </button>
          )
        })}
        <button className="reward-item" style={{ width: 280 }} disabled={s.removeUsed || run.gold < s.removePrice} onClick={() => act({ t: 'removeService' })}>
          <span className="ic" style={{ color: 'var(--bad)' }}>
            <Icon name="agotadas" size={22} />
          </span>
          <span>
            Dar de baja una carta · <span style={{ color: 'var(--gold)' }}>{s.removeUsed ? 'Usado' : s.removePrice}</span>
            <small>Elimina una carta de tu mazo para siempre.</small>
          </span>
        </button>
      </div>
    </div>
  )
}

// ───────────── Evento ─────────────

export function EventScene({ run }: { run: RunState }) {
  const act = useGame(s => s.act)
  if (run.screen.k !== 'event') return null
  const e = run.screen.e
  const ev = C().events[e.id]
  return (
    <div className="scene" style={{ flexDirection: 'row', justifyContent: 'center', gap: 36, alignItems: 'center' }}>
      <div className="card-art" style={{ width: 420, height: 260, margin: 0, borderRadius: 16 }}>
        <Diagram tpl={ev.art} seed={ev.id} own={clubDef(run.club).colors.primary} />
      </div>
      <div className="col" style={{ width: 620, gap: 16 }}>
        <div className="scene-title" style={{ textAlign: 'left' }}>{ev.title}</div>
        <p style={{ fontSize: 22, lineHeight: 1.25, margin: 0 }}>{e.done ? e.resultText : ev.text}</p>
        {!e.done ? (
          <div className="col">
            {ev.options.map((o, i) => {
              const ok = optionAvailable(run, ev, i)
              return (
                <button key={i} className="reward-item" disabled={!ok} onClick={() => act({ t: 'event', i })}>
                  <span className="ic"><Icon name="flecha" size={20} style={{ transform: 'rotate(90deg)' }} /></span>
                  <span>
                    {o.label}
                    <small>{describeOption(o.ops, o.requires)}</small>
                  </span>
                </button>
              )
            })}
          </div>
        ) : (
          <button className="btn primary big" style={{ alignSelf: 'flex-start' }} onClick={() => act({ t: 'proceed' })}>
            Continuar
          </button>
        )}
      </div>
    </div>
  )
}

function describeOption(ops: import('../../engine/model/types').RunOp[], req?: { gold?: number; forma?: number }): string {
  const parts: string[] = []
  for (const o of ops) {
    switch (o.op) {
      case 'gold': parts.push(o.n >= 0 ? `+${o.n} de oro` : `${o.n} de oro`); break
      case 'heal': parts.push(`+${o.n} de Forma`); break
      case 'healPct': parts.push(`recupera ${o.n}% de Forma`); break
      case 'loseForma': parts.push(`−${o.n} de Forma`); break
      case 'formaMax': parts.push(`${o.n > 0 ? '+' : ''}${o.n} de Forma máxima`); break
      case 'addCard': parts.push(`añade ${cardDef(o.def).name}`); break
      case 'addCardChoice': parts.push(`elige 1 de ${o.n} cartas`); break
      case 'deckPick': parts.push({ remove: 'elimina una carta', upgrade: 'mejora una carta', transform: 'transforma una carta', duplicate: 'duplica una carta' }[o.purpose]); break
      case 'trofeo': parts.push('un trofeo'); break
      case 'consumible': parts.push('un consumible'); break
      case 'startMatch': parts.push('juegas un partido'); break
      case 'random': parts.push('resultado incierto'); break
    }
  }
  if (req?.gold) parts.push(`requiere ${req.gold} de oro`)
  return parts.join(' · ') || 'Nada'
}

// ───────────── Concentración ─────────────

export function RestScene({ run }: { run: RunState }) {
  const act = useGame(s => s.act)
  if (run.screen.k !== 'rest') return null
  const done = run.screen.done
  const noRest = hasRunMod(run, 'noRest')
  const both = hasRunMod(run, 'restUpgradeAndHeal')
  return (
    <div className="scene" style={{ justifyContent: 'center' }}>
      <div className="scene-title">Concentración</div>
      <div className="scene-sub">Hotel de concentración la noche antes del partido. {both ? 'Gracias a tu centro de alto rendimiento, puedes hacer ambas cosas.' : 'Elige cómo aprovecharla.'}</div>
      {!done ? (
        <div className="row" style={{ gap: 20 }}>
          <button className="reward-item" style={{ width: 300, flexDirection: 'column', alignItems: 'flex-start' }} disabled={noRest} onClick={() => { audio.play('buff'); act({ t: 'rest', o: 'heal' }) }}>
            <span className="ic" style={{ color: 'var(--good)' }}><Icon name="descanso" size={26} /></span>
            <span className="display" style={{ fontSize: 24 }}>Descansar</span>
            <small>{noRest ? 'Tu Título de Liga no te deja descansar.' : `Recupera ${restHealAmount(run)} de Forma.`}</small>
          </button>
          <button className="reward-item" style={{ width: 300, flexDirection: 'column', alignItems: 'flex-start' }} disabled={upgradable(run).length === 0} onClick={() => act({ t: 'rest', o: 'entrenar' })}>
            <span className="ic"><Icon name="solidez" size={26} /></span>
            <span className="display" style={{ fontSize: 24 }}>Entrenar</span>
            <small>Mejora una carta de tu mazo para siempre.</small>
          </button>
        </div>
      ) : (
        <button className="btn primary big" onClick={() => act({ t: 'proceed' })}>Continuar</button>
      )}
    </div>
  )
}

// ───────────── Vitrina ─────────────

export function TreasureScene({ run }: { run: RunState }) {
  const act = useGame(s => s.act)
  if (run.screen.k !== 'treasure') return null
  const t = run.screen
  const d = t.trofeo ? trofeoDef(t.trofeo) : null
  return (
    <div className="scene" style={{ justifyContent: 'center' }}>
      <div className="scene-title">La vitrina del club</div>
      {!t.taken ? (
        <motion.button className="reward-item" style={{ width: 420, flexDirection: 'column', padding: 24 }} whileHover={{ scale: 1.03 }} onClick={() => { audio.play('buff'); act({ t: 'take', i: 0 }) }}>
          <span className="ic" style={{ width: 70, height: 70 }}><Icon name={d?.icon ?? 'copa'} size={44} /></span>
          <span className="display" style={{ fontSize: 26 }}>{d ? d.name : 'Vitrina vacía'}</span>
          <small>{d ? d.text : ''}</small>
          <small style={{ color: 'var(--gold)' }}>+{t.gold} de oro</small>
        </motion.button>
      ) : (
        <div className="scene-sub">Trofeo guardado en el vestuario.</div>
      )}
      <button className="btn primary big" onClick={() => act({ t: 'proceed' })}>Continuar</button>
    </div>
  )
}

// ───────────── Selección de mazo ─────────────

const PURPOSE: Record<string, { title: string; sub: string }> = {
  remove: { title: 'Dar de baja una carta', sub: 'Desaparece de tu mazo para siempre.' },
  upgrade: { title: 'Entrenar una carta', sub: 'Mejora la carta elegida para el resto de la temporada.' },
  transform: { title: 'Transformar una carta', sub: 'Se convierte en otra carta al azar.' },
  duplicate: { title: 'Duplicar una carta', sub: 'Añade una copia exacta a tu mazo.' },
}

export function DeckPickScene({ run }: { run: RunState }) {
  const act = useGame(s => s.act)
  const [sel, setSel] = useState<number | null>(null)
  const [preview, setPreview] = useState(false)
  if (run.screen.k !== 'deckPick') return null
  const p = run.screen.p
  const cands = deckPickCandidates(run, p.purpose)
  const info = PURPOSE[p.purpose]
  const selInst = cands.find(c => c.uid === sel)
  return (
    <div className="scene" style={{ gap: 10, paddingTop: 12 }}>
      <div className="scene-title" style={{ fontSize: 36 }}>{info.title}</div>
      <div className="scene-sub">{info.sub}</div>
      <div className="card-grid" style={{ maxHeight: 470, width: '100%' }}>
        {cands.map(c => (
          <CardFor key={c.uid} run={run} def={c.def} up={c.up || (preview && sel === c.uid && p.purpose === 'upgrade')} selected={sel === c.uid} onClick={() => setSel(c.uid)} />
        ))}
      </div>
      <div className="row">
        {p.purpose === 'upgrade' && selInst && (
          <button className="btn" onPointerDown={() => setPreview(true)} onPointerUp={() => setPreview(false)} onPointerLeave={() => setPreview(false)}>
            Mantén para ver la mejora
          </button>
        )}
        <button className="btn primary big" disabled={sel === null} onClick={() => sel !== null && act({ t: 'deckPick', uids: [sel] })}>
          Confirmar
        </button>
      </div>
    </div>
  )
}

export function CardChoiceScene({ run }: { run: RunState }) {
  const act = useGame(s => s.act)
  if (run.screen.k !== 'cardChoice') return null
  const c = run.screen.c
  return (
    <div className="scene" style={{ justifyContent: 'center' }}>
      <div className="scene-title">Elige una carta</div>
      <div className="choice-cards">
        {c.cards.map((x, i) => (
          <CardFor key={i} run={run} def={x.def} up={x.up} onClick={() => act({ t: 'cardChoice', i })} />
        ))}
      </div>
      <button className="btn" onClick={() => act({ t: 'cardChoice', i: -1 })}>Ninguna</button>
    </div>
  )
}

// ───────────── Fin de acto ─────────────

export function ActEndScene({ run }: { run: RunState }) {
  const act = useGame(s => s.act)
  useEffect(() => audio.play('victory'), [])
  if (run.screen.k !== 'actEnd') return null
  const next = ['', 'Primera División', 'la Liga de Campeones', ''][run.act]
  return (
    <div className="scene" style={{ justifyContent: 'center' }}>
      <motion.div className="title-logo" style={{ fontSize: 78 }} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        ¡<em>Ascenso</em>!
      </motion.div>
      <div className="scene-sub">
        Acto {run.act} superado. El vestuario descansa y recupera {run.screen.healed} de Forma. Próxima parada: {next}.
      </div>
      <button className="btn primary big" onClick={() => act({ t: 'proceed' })}>Empezar el acto {run.act + 1}</button>
    </div>
  )
}

// ───────────── Fin de temporada ─────────────

const OUTCOME: Record<string, { title: string; text: string }> = {
  campeon: { title: '¡Campeones de Europa!', text: 'De Segunda a la gloria. Esta temporada se recordará siempre.' },
  eliminado: { title: 'Eliminados en la Final', text: 'Tan cerca... La próxima temporada será la buena.' },
  lesionado: { title: 'Plantilla exhausta', text: 'El equipo se ha quedado sin Forma. Temporada terminada.' },
  destituido: { title: 'Destituido', text: 'Demasiadas derrotas: la directiva ha decidido cambiar de entrenador.' },
  abandono: { title: 'Temporada abandonada', text: 'Hay retos que es mejor dejar para otro momento.' },
}

export function RunEndScene({ run }: { run: RunState }) {
  const toTitle = useGame(s => s.toTitle)
  const startRun = useGame(s => s.startRun)
  const end = useGame(s => s.endResult)
  const profile = useGame(s => s.profile)
  if (run.screen.k !== 'ended') return null
  const o = OUTCOME[run.screen.outcome]
  const sb = scoreBreakdown(run)
  const xp = xpToNext(profile.clubXp[run.club])
  return (
    <div className="scene" style={{ justifyContent: 'center', flexDirection: 'row', gap: 40 }}>
      <div className="col" style={{ width: 520 }}>
        <motion.div className="title-logo" style={{ fontSize: 60, textAlign: 'left' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {run.screen.outcome === 'campeon' ? <em>{o.title}</em> : o.title}
        </motion.div>
        <p style={{ fontSize: 22, margin: 0 }}>{o.text}</p>
        <div className="muted" style={{ fontSize: 18 }}>
          {clubDef(run.club).name} · Acto {run.act} · {run.stats.wins}V {run.stats.draws}E {run.stats.losses}D · {run.stats.goalsFor} goles
        </div>
        {end?.unlocks.map(u => (
          <div key={u} className="tag" style={{ fontSize: 18, color: 'var(--gold)', alignSelf: 'flex-start' }}>
            <Icon name="estrella" size={16} /> {u}
          </div>
        ))}
        <div className="muted" style={{ fontSize: 17 }}>
          +{end?.xpGained ?? 0} XP · Nivel de club {xp.level}
          {xp.need ? ` (${xp.into}/${xp.need})` : ' (máximo)'}
        </div>
        <div className="row">
          <button className="btn primary big" onClick={() => startRun(run.club, run.exig)}>Otra temporada</button>
          <button className="btn big" onClick={toTitle}>Menú principal</button>
        </div>
      </div>
      <div className="box" style={{ width: 420 }}>
        <h4>Puntuación</h4>
        <table className="score-table">
          <tbody>
            {sb.parts.filter(p => p.pts !== 0).map(p => (
              <tr key={p.label}>
                <td>{p.label}</td>
                <td>{p.pts > 0 ? '+' : ''}{p.pts}</td>
              </tr>
            ))}
            <tr>
              <td className="display" style={{ fontSize: 22 }}>Total</td>
              <td style={{ fontSize: 26, color: 'var(--gold)' }}>{sb.total}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
