import {
  extractExternalDragType,
  extractItemData,
  extractItemDataFromExternal,
  extractRelativePositionToTarget,
  isItemData,
  makeItemData,
  type CanDropExternalPayload,
  type DragData,
  type ItemData,
  type OnDropExternalPayload
} from '@/pragmatic-drag-and-drop/helpers'
import {
  attachClosestEdge,
  extractClosestEdge,
  type Edge
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import { dropTargetForExternal } from '@atlaskit/pragmatic-drag-and-drop/external/adapter'
import type { CleanupFn } from '@atlaskit/pragmatic-drag-and-drop/types'
import { keyBy } from 'lodash-es'
import { computed, onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

/**
 * Makes an element a drop target for external sources.
 */
export const useDropTargetForExternal = <TData extends DragData>({
  elementRef,
  type,
  acceptedDragTypes,
  data,
  ignoresNestedDrops = false,
  canDrop,
  onDrop
}: {
  /**
   * Element to be made drop target.
   */
  elementRef: Ref<HTMLElement | undefined>
  /**
   * Used to differentiate multiple types of drop targets on a page.
   */
  type: ItemData['type']
  /**
   * Types of draggable elements that can be dropped on this target.
   */
  acceptedDragTypes: { type: ItemData['type']; axis: 'vertical' | 'horizontal' }[]
  /**
   * Data to attach with this drop target.
   */
  data: Ref<TData>
  /**
   * Whether to ignore drop events from inner drop targets.
   */
  ignoresNestedDrops?: boolean
  /**
   * Whether the item can be dropped on the target.
   */
  canDrop?: (payload: CanDropExternalPayload<TData>) => boolean
  /**
   * Finished a drag and drop operation.
   */
  onDrop?: (payload: OnDropExternalPayload<TData>) => void
}) => {
  const isDraggingOver = ref(false)
  const dragIndicatorEdge = ref<Edge | null>(null)

  const itemData = computed(() => makeItemData({ ...data.value, type }))
  const allowedEdgesByType = keyBy(
    acceptedDragTypes.map(({ type, axis }) => {
      return {
        type,
        allowedEdges: axis === 'vertical' ? ['top', 'bottom'] : ['left', 'right']
      } as { type: string; allowedEdges: Edge[] }
    }),
    'type'
  )

  const makeElementDropTarget = () => {
    if (!elementRef.value) return () => {}
    return dropTargetForExternal({
      element: elementRef.value,
      getData: ({ source, input }) => {
        const sourceType = extractExternalDragType(source)
        // If we can't identify the type, it's not a drag source we should handle.
        // This will eventually be cancelled by the `canDrop` check.
        if (!sourceType) return {}
        if (!elementRef.value) return itemData.value
        // Attach the closest edge to the pointer on the drop target.
        return attachClosestEdge(itemData.value, {
          element: elementRef.value,
          input,
          allowedEdges: allowedEdgesByType[sourceType].allowedEdges
        })
      },
      getIsSticky: () => true, // Remembers last drop target even if the pointer already leaves it.
      canDrop: ({ source }) => {
        // Only allow dropping draggable elements of the specified types.
        const sourceType = extractExternalDragType(source)
        if (!sourceType) return false
        const isAllowedDragType = acceptedDragTypes.some(({ type }) => type === sourceType)
        if (!isAllowedDragType) return false
        if (canDrop) {
          // We enforce external drag sources to have data attached to them
          // so we can check if they can be dropped on the target.
          const sourceData = extractItemDataFromExternal(source)
          if (!sourceData) return false
          return canDrop({
            sourceData,
            targetData: itemData.value as ItemData & TData
          })
        }
        return true
      },
      onDrag: ({ self }) => {
        isDraggingOver.value = true
        dragIndicatorEdge.value = extractClosestEdge(self.data)
      },
      onDragLeave() {
        isDraggingOver.value = false
        dragIndicatorEdge.value = null
      },
      onDrop: ({ self, source, location }) => {
        isDraggingOver.value = false
        dragIndicatorEdge.value = null

        // If there are nested drop targets all of them will have
        // their `onDrop` callbacks executed.
        // Use `ignoresNestedDrops` to skip handling nested drops
        // from an outer drop target.
        const target = location.current.dropTargets[0]
        if (!target || (ignoresNestedDrops && self.element !== target.element)) {
          return
        }

        const sourceData = extractItemDataFromExternal(source)
        const targetData = extractItemData(target) as ItemData & TData

        if (!sourceData || !isItemData(sourceData) || !isItemData(targetData)) {
          return
        }

        const relativePositionToTarget = extractRelativePositionToTarget(targetData)
        if (!relativePositionToTarget) {
          return
        }

        onDrop?.({ sourceData, targetData, relativePositionToTarget })
      }
    })
  }

  let cleanUp: CleanupFn

  onMounted(() => {
    cleanUp = makeElementDropTarget()
  })

  onBeforeUnmount(() => {
    cleanUp?.()
  })

  return {
    isDraggingOver,
    dragIndicatorEdge
  }
}
