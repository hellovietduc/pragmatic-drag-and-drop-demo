import { raf } from '@/bits/raf'

export const flashElement = (element: HTMLElement, color: string, ms: number = 200) => {
  const borderRadius = window.getComputedStyle(element).borderRadius
  const originalPosition = window.getComputedStyle(element).position

  const overlay = document.createElement('div')
  overlay.style.position = 'absolute'
  overlay.style.inset = '0'
  overlay.style.zIndex = Number.MAX_SAFE_INTEGER.toString()
  overlay.style.borderRadius = borderRadius
  overlay.style.overflow = 'hidden'
  overlay.style.backgroundColor = color
  overlay.style.opacity = '1'
  overlay.style.transition = `opacity ${ms}ms`
  raf(async () => {
    element.style.position = 'relative'
    element.appendChild(overlay)
    raf(() => {
      overlay.style.opacity = '0'
      setTimeout(() => {
        overlay.remove()
        if (originalPosition !== 'static') element.style.position = originalPosition
        else element.style.removeProperty('position')
      }, ms)
    })
  })
}

export const scrollAndFlashElement = (
  selector: string,
  color: string = '#9466e8',
  ms: number = 500
) => {
  raf(async () => {
    const movedElement = document.querySelector<HTMLElement>(selector)
    if (!movedElement) return
    movedElement.scrollIntoView({
      block: 'center',
      inline: 'center'
    })
    flashElement(movedElement, color, ms)
  })
}
