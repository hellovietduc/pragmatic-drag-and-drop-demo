import { createSharedComposable } from '@vueuse/core'
import { ref } from 'vue'

export const useDraggingState = createSharedComposable(() => {
  const isDraggingPost = ref(false)
  return { isDraggingPost }
})
