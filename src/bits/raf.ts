export const raf = (fn: () => void) => {
  if (typeof window['requestAnimationFrame'] === 'function') {
    window.requestAnimationFrame(fn)
  } else {
    setTimeout(fn, 0)
  }
}
