import {
  type ItemData,
  extractItemData,
  extractExternalDragType
} from '@/pragmatic-drag-and-drop/helpers'
import { autoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/element'
import { autoScrollForExternal } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/external'
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import type { CleanupFn } from '@atlaskit/pragmatic-drag-and-drop/types'
import { onBeforeUnmount, onMounted, type Ref } from 'vue'

/**
 * Enables auto scrolling for the scroll container in a draggable list.
 */
export const useAutoScrollElement = ({
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
    return combine(
      autoScrollForElements({
        element: scrollContainerElementRef.value,
        canScroll: ({ source }) => {
          // Only auto scroll for draggable elements of the specified type.
          return extractItemData(source)?.type === type
        }
      }),
      autoScrollForExternal({
        element: scrollContainerElementRef.value,
        canScroll: ({ source }) => {
          // Only auto scroll for draggable elements of the specified type.
          return extractExternalDragType(source) === type
        }
      })
    )
  }

  let cleanUp: CleanupFn

  onMounted(() => {
    cleanUp = enableAutoScroll()
  })

  onBeforeUnmount(() => {
    cleanUp?.()
  })
}
