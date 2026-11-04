import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export const STAGE_H = 720
export const STAGE_MIN_W = 1280
export const STAGE_MAX_W = 1600

interface StageInfo {
  w: number
  h: number
  scale: number
  portrait: boolean
  touch: boolean
}

const StageCtx = createContext<StageInfo>({ w: STAGE_MIN_W, h: STAGE_H, scale: 1, portrait: false, touch: false })

export function useStage(): StageInfo {
  return useContext(StageCtx)
}

function measure(): StageInfo {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const aspect = vw / Math.max(1, vh)
  const w = Math.round(Math.min(STAGE_MAX_W, Math.max(STAGE_MIN_W, STAGE_H * aspect)))
  const scale = Math.min(vw / w, vh / STAGE_H)
  const touch = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)
  return { w, h: STAGE_H, scale, portrait: vh > vw * 1.05 && touch, touch }
}

export function Stage({ children }: { children: ReactNode }) {
  const [info, setInfo] = useState<StageInfo>(() => measure())
  useEffect(() => {
    const on = () => setInfo(measure())
    window.addEventListener('resize', on)
    window.addEventListener('orientationchange', on)
    return () => {
      window.removeEventListener('resize', on)
      window.removeEventListener('orientationchange', on)
    }
  }, [])
  return (
    <StageCtx.Provider value={info}>
      <div className="stage-viewport">
        <div
          className="stage"
          style={{ width: info.w, height: info.h, transform: `translate(-50%, -50%) scale(${info.scale})` }}
        >
          {children}
        </div>
        {info.portrait && (
          <div className="rotate-hint" role="alert">
            <div className="rotate-phone" aria-hidden />
            <p>Gira el móvil para jugar en horizontal</p>
          </div>
        )}
      </div>
    </StageCtx.Provider>
  )
}
