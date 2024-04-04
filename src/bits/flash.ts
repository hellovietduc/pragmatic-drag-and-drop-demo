import { raf } from '@/bits/raf'

export const flashElement = (element: HTMLElement, color: string, ms: number = 200) => {
  const overlay = document.createElement('div')
  overlay.style.position = 'absolute'
  overlay.style.inset = '0'
  overlay.style.zIndex = Number.MAX_SAFE_INTEGER.toString()
  overlay.style.backgroundColor = color
  overlay.style.opacity = '1'
  overlay.style.transition = `opacity ${ms}ms`
  raf(async () => {
    element.appendChild(overlay)
    raf(() => {
      overlay.style.opacity = '0'
      setTimeout(() => {
        overlay.remove()
      }, ms)
    })
  })
}
