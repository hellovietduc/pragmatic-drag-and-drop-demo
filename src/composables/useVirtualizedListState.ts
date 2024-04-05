import { createSharedComposable } from '@vueuse/core'
import { ref } from 'vue'

export const useVirtualizedListState = createSharedComposable(() => {
  const isVirtualized = ref(false)
  return { isVirtualized }
})
