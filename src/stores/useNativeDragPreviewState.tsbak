import { createSharedComposable, useLocalStorage } from '@vueuse/core'

export const useNativeDragPreviewState = createSharedComposable(() => {
  const useNativeDragPreview = useLocalStorage('useNativeDragPreview', true)
  return { useNativeDragPreview }
})
