import { useEffect, useRef } from 'react'
import { prefersReducedMotion } from '../../lib/motion'

interface Star {
  x: number
  y: number
  r: number
  /** 0 = far, 1 = near. Near stars are larger, brighter and move more with the cursor. */
  depth: number
  phase: number
  speed: number
  tint: string
}

// Mostly white, a few cool and warm stars like a real sky.
const TINTS = ['#eef1fb', '#eef1fb', '#eef1fb', '#dfe7ff', '#cfe0ff', '#ffe9cf']

/** Deterministic PRNG so the same sky comes back after a resize or reload. */
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Full-bleed canvas starfield. Three depth layers, slow twinkle, and a few
 * pixels of parallax toward the cursor. Static when the OS asks for reduced motion.
 */
export function Starfield({ className = '' }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduced = prefersReducedMotion()
    let stars: Star[] = []
    let w = 0
    let h = 0
    let dpr = 1
    let raf = 0
    let running = true
    const mouse = { x: 0, y: 0 } // -0.5 .. 0.5
    const eased = { x: 0, y: 0 }

    function build() {
      w = canvas!.clientWidth
      h = canvas!.clientHeight
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas!.width = Math.round(w * dpr)
      canvas!.height = Math.round(h * dpr)
      const rand = mulberry32(20250730) // NISAR launch date, for luck
      const count = Math.round((w * h) / 1900)
      stars = Array.from({ length: count }, () => {
        const depth = rand() ** 2.2
        return {
          x: rand() * w,
          y: rand() * h,
          r: 0.35 + depth * 1.25,
          depth,
          phase: rand() * Math.PI * 2,
          speed: 0.5 + rand() * 1.3,
          tint: TINTS[Math.floor(rand() * TINTS.length)],
        }
      })
    }

    function draw(t: number) {
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx!.clearRect(0, 0, w, h)
      eased.x += (mouse.x - eased.x) * 0.04
      eased.y += (mouse.y - eased.y) * 0.04
      for (const s of stars) {
        const twinkle = reduced ? 0.85 : 0.6 + 0.4 * Math.sin(t * 0.0012 * s.speed + s.phase)
        const ox = reduced ? 0 : eased.x * s.depth * 18
        const oy = reduced ? 0 : eased.y * s.depth * 18
        const alpha = (0.3 + 0.7 * s.depth) * twinkle
        ctx!.fillStyle = s.tint
        if (s.depth > 0.82) {
          ctx!.globalAlpha = alpha * 0.18
          ctx!.beginPath()
          ctx!.arc(s.x + ox, s.y + oy, s.r * 3.2, 0, Math.PI * 2)
          ctx!.fill()
        }
        ctx!.globalAlpha = alpha
        ctx!.beginPath()
        ctx!.arc(s.x + ox, s.y + oy, s.r, 0, Math.PI * 2)
        ctx!.fill()
      }
      ctx!.globalAlpha = 1
    }

    function loop(t: number) {
      if (!running) return
      draw(t)
      raf = requestAnimationFrame(loop)
    }

    const ro = new ResizeObserver(() => {
      build()
      if (reduced) draw(0)
    })
    ro.observe(canvas)
    build()

    const onMove = (e: MouseEvent) => {
      mouse.x = e.clientX / window.innerWidth - 0.5
      mouse.y = e.clientY / window.innerHeight - 0.5
    }
    const onVisibility = () => {
      if (document.hidden) {
        running = false
        cancelAnimationFrame(raf)
      } else if (!reduced) {
        running = true
        raf = requestAnimationFrame(loop)
      }
    }

    if (reduced) {
      draw(0)
    } else {
      window.addEventListener('mousemove', onMove)
      document.addEventListener('visibilitychange', onVisibility)
      raf = requestAnimationFrame(loop)
    }

    return () => {
      running = false
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return <canvas ref={ref} className={`block h-full w-full ${className}`} aria-hidden />
}
