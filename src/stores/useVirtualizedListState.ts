import { createSharedComposable, useSessionStorage } from '@vueuse/core'

export const useVirtualizedListState = createSharedComposable(() => {
  const isVirtualized = useSessionStorage('isVirtualized', false)

  return { isVirtualized }
})
