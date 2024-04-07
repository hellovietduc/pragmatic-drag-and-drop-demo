import { createSharedComposable, useLocalStorage } from '@vueuse/core'

export const useVirtualizedListState = createSharedComposable(() => {
  const isVirtualized = useLocalStorage('isVirtualized', false)

  return { isVirtualized }
})
