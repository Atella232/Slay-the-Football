import { useEffect, useRef, useState } from 'react'
import { useStage } from '../Stage'

/** Tooltip global por delegación: cualquier elemento con data-tip lo muestra. */
export function TooltipLayer({ root }: { root: React.RefObject<HTMLDivElement | null> }) {
  const { scale } = useStage()
  const [tip, setTip] = useState<{ html: string; x: number; y: number; below: boolean } | null>(null)
  const timer = useRef<number | null>(null)
  useEffect(() => {
    const el = root.current
    if (!el) return
    const show = (target: HTMLElement) => {
      const text = target.getAttribute('data-tip')
      if (!text) return setTip(null)
      const r = target.getBoundingClientRect()
      const sr = el.getBoundingClientRect()
      const x = (r.left + r.width / 2 - sr.left) / scale
      const yTop = (r.top - sr.top) / scale
      const yBot = (r.bottom - sr.top) / scale
      const below = yTop < 140
      setTip({ html: text, x, y: below ? yBot + 8 : yTop - 8, below })
    }
    const over = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      const t = (e.target as HTMLElement).closest('[data-tip]') as HTMLElement | null
      if (t) show(t)
      else setTip(null)
    }
    const down = (e: PointerEvent) => {
      if (e.pointerType !== 'touch') return
      const t = (e.target as HTMLElement).closest('[data-tip]') as HTMLElement | null
      if (!t) return setTip(null)
      show(t)
      if (timer.current) clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setTip(null), 2600)
    }
    el.addEventListener('pointerover', over)
    el.addEventListener('pointerdown', down)
    return () => {
      el.removeEventListener('pointerover', over)
      el.removeEventListener('pointerdown', down)
    }
  }, [root, scale])
  if (!tip) return null
  const [title, ...rest] = tip.html.split('|')
  return (
    <div
      className="tooltip"
      style={{ left: tip.x, top: tip.y, transform: `translate(-50%, ${tip.below ? '0' : '-100%'})` }}
      role="tooltip"
    >
      {rest.length ? (
        <>
          <b>{title}</b>
          <div>{rest.join('|')}</div>
        </>
      ) : (
        title
      )}
    </div>
  )
}
