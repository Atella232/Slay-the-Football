import { Fragment } from 'react'

const KEYWORDS = ['Peligro', 'Bloqueo', 'Energía', 'Garra', 'Posesión', 'Momentum', 'Confianza', 'Solidez', 'Fatiga', 'Desorganizado', 'Desconcentrado', 'Amarilla', 'Contragolpe', 'Ocasión', 'Repliegue', 'Agotar', 'Retener', 'Inicial', 'Efímera', 'Injugable', 'Doblete', 'Forma', 'Cambio', 'Cambios', 'tramo final']
const KW_RE = new RegExp(`(⟦-?\\d+\\|[+=-]⟧|\\b(?:${KEYWORDS.join('|')})\\b)`, 'g')

/** Renderiza texto de carta: números vivos coloreados y palabras clave resaltadas. */
export function RichText({ text }: { text: string }) {
  const parts = text.split(KW_RE)
  return (
    <>
      {parts.map((p, i) => {
        if (!p) return null
        const m = /^⟦(-?\d+)\|([+=-])⟧$/.exec(p)
        if (m) {
          const cls = m[2] === '+' ? 'num up' : m[2] === '-' ? 'num down' : 'num'
          return (
            <span key={i} className={cls}>
              {m[1]}
            </span>
          )
        }
        if (KEYWORDS.includes(p)) {
          return (
            <span key={i} className="kw">
              {p}
            </span>
          )
        }
        return <Fragment key={i}>{p}</Fragment>
      })}
    </>
  )
}
