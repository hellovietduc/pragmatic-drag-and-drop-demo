import { type ItemData, extractItemData } from '@/pragmatic-drag-and-drop/helpers'
import { autoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/element'
import type { CleanupFn } from '@atlaskit/pragmatic-drag-and-drop/types'
import { onBeforeUnmount, onMounted, type Ref } from 'vue'

/**
 * Enables auto scrolling for the scroll container in a draggable list.
 */
export const useAutoScrollForElements = ({
  scrollContainerElementRef,
  type
}: {
  /**
   * Element to enable auto scrolling for.
   */
  scrollContainerElementRef: Ref<HTMLElement | undefined>
  /**
   * Only auto scroll when dragging an item of this type.
   */
  type: ItemData['type']
}) => {
  const enableAutoScroll = () => {
    if (!scrollContainerElementRef.value) return () => {}
    return autoScrollForElements({
      element: scrollContainerElementRef.value,
      canScroll: ({ source }) => {
        return extractItemData(source).type === type
      }
    })
  }

  let cleanUp: CleanupFn

  onMounted(() => {
    cleanUp = enableAutoScroll()
  })

  onBeforeUnmount(() => {
    cleanUp?.()
  })
}
