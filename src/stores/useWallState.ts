import { createSharedComposable } from '@vueuse/core'
import { ref } from 'vue'
import { nanoid } from 'nanoid'

export const useWallState = createSharedComposable(() => {
  const wallId = ref(nanoid(5))
  return { wallId }
})
