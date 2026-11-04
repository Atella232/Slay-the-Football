import type { RunState } from '../../engine/model/types'
import { clubDef } from '../../engine/registry'
import { useGame } from '../store/game'
import { motion, AnimatePresence } from 'framer-motion'

interface Tip {
  key: string
  title: string
  text: string
}

/** Consejos contextuales la primera vez que aparece cada concepto. */
function pickTip(run: RunState, seen: Record<string, boolean>): Tip | null {
  const scr = run.screen
  const tips: (Tip & { when: boolean })[] = []
  if (scr.k === 'map') {
    tips.push({ key: 'map', when: true, title: 'El mapa del acto', text: 'Elige tu camino jornada a jornada. Los Partidos Grandes dan trofeos pero son duros; la Concentración cura o mejora cartas. Arriba te espera la Final.' })
  }
  if (scr.k === 'match' && scr.m.phase === 'player') {
    const m = scr.m
    const club = clubDef(run.club)
    tips.push(
      { key: 'goles', when: m.turn === 1, title: 'Cómo se gana', text: `Tus Ataques generan Peligro contra la Defensa rival. Al vaciarla, ¡gol! Gana quien llegue antes a ${m.meta} goles; si se acaba el tiempo, quien vaya por delante.` },
      { key: 'ocasion', when: !!m.rival.intent?.parts.some(p => p.k === 'ocasion'), title: 'Ocasión rival', text: 'El rival va a intentar marcar. Si tu Bloqueo es menor que su Ocasión, encajas gol. El panel de tu portería te dice cuánto te falta.' },
      { key: 'repliegue', when: m.rival.repliegue > 0, title: 'Repliegue', text: 'La franja azul sobre la Defensa rival es su Repliegue: absorbe tu Peligro antes que la Defensa y desaparece en su turno.' },
      { key: 'saque', when: m.rival.kickoffLock, title: 'Saque de centro', text: 'Acabas de marcar: hasta tu próximo turno no puedes dañar la Defensa del siguiente gol. Aprovecha para defender.' },
      { key: 'estado', when: m.piles.hand.some(u => m.cards[u].def.startsWith('est.')), title: 'Cartas de Estado', text: 'Tienes un Estado en la mano: no se puede jugar. Usa un Cambio (botón o tecla S) para quitártelo y robar otra carta.' },
      { key: 'recurso', when: (m.player.res[club.res] ?? 0) > 0, title: club.resName, text: club.resText },
      { key: 'tramo', when: m.turn >= m.maxTurns - 1 && !m.prorroga, title: 'Tramo final', text: 'Quedan los últimos turnos. Si vas ganando, el rival se volcará con más Confianza. Si vas perdiendo... ¡a por todas!' },
      { key: 'prorroga', when: m.prorroga, title: 'Prórroga', text: 'Gol de oro: el primero que marque gana. El rival aprieta un 25% más, y tú tienes un Cambio extra.' },
    )
  }
  if (scr.k === 'reward') tips.push({ key: 'reward', when: true, title: 'Recompensas', text: 'Añadir cartas no siempre es mejor: un mazo corto roba tus mejores jugadas más a menudo. Puedes saltarte la carta.' })
  const t = tips.find(x => x.when && !seen[x.key])
  return t ? { key: t.key, title: t.title, text: t.text } : null
}

export function TutorialCoach() {
  const view = useGame(s => s.view)
  const busy = useGame(s => s.busy)
  const profile = useGame(s => s.profile)
  const mark = useGame(s => s.markTutorial)
  const tip = view && !busy ? pickTip(view, profile.tutorial) : null
  return (
    <AnimatePresence>
      {tip && (
        <motion.div
          key={tip.key}
          className="panel"
          role="note"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          style={{ position: 'absolute', left: 'calc(50% - 280px)', top: 70, width: 560, padding: '12px 16px', zIndex: 200, borderColor: 'rgba(242,193,78,.6)' }}
        >
          <div className="row" style={{ alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div className="display" style={{ color: 'var(--gold)', fontSize: 18 }}>{tip.title}</div>
              <div style={{ fontSize: 17, lineHeight: 1.2 }}>{tip.text}</div>
            </div>
            <button className="btn small" onClick={() => mark(tip.key)}>Entendido</button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
