import {
  extractItemData,
  isItemData,
  makeItemData,
  type DragData,
  type ItemData,
  type CanDropPayload,
  type OnDropPayload,
  extractRelativePositionToTarget
} from '@/pragmatic-drag-and-drop/helpers'
import {
  attachClosestEdge,
  extractClosestEdge,
  type Edge
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import type { CleanupFn } from '@atlaskit/pragmatic-drag-and-drop/types'
import { keyBy } from 'lodash-es'
import { computed, onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

/**
 * Makes an element a drop target for other draggable elements.
 */
export const useDropTargetForElements = <TData extends DragData>({
  elementRef,
  types,
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
   * Types of draggable elements that can be dropped on this target.
   */
  types: { type: ItemData['type']; axis: 'vertical' | 'horizontal' }[]
  /**
   * Data to attach with this drop target.
   */
  data: Ref<TData>
  /**
   * Whether to ignore drop events from nested drop targets.
   */
  ignoresNestedDrops?: boolean
  /**
   * Whether the draggable element can be dropped on the target.
   */
  canDrop?: (payload: CanDropPayload<TData>) => boolean
  /**
   * Finished a drag and drop operation.
   */
  onDrop?: (payload: OnDropPayload<TData>) => void
}) => {
  const isDraggingOver = ref(false)
  const dragIndicatorEdge = ref<Edge | null>(null)

  const allowedEdgesByType = keyBy(
    types.map(({ type, axis }) => {
      return {
        type,
        allowedEdges: axis === 'vertical' ? ['top', 'bottom'] : ['left', 'right']
      } as { type: string; allowedEdges: Edge[] }
    }),
    'type'
  )

  const itemDataByType = computed(() =>
    keyBy(
      types.map(({ type }) => makeItemData({ ...data.value, type })),
      'type'
    )
  )

  const makeElementDropTarget = () => {
    if (!elementRef.value) return () => {}
    return dropTargetForElements({
      element: elementRef.value,
      getData: ({ source, input }) => {
        const sourceType = extractItemData(source).type
        if (!elementRef.value) return itemDataByType.value[sourceType]
        // Attach the closest edge to the pointer on the drop target.
        return attachClosestEdge(itemDataByType.value[sourceType], {
          element: elementRef.value,
          input,
          allowedEdges: allowedEdgesByType[sourceType].allowedEdges
        })
      },
      getIsSticky: () => true, // Remembers last drop target even if the pointer already leaves it.
      canDrop: ({ source }) => {
        // Only allow dropping draggable elements of the specified types.
        const sourceType = extractItemData(source).type
        const isAllowedDragType = types.some(({ type }) => type === sourceType)
        return isAllowedDragType && canDrop
          ? canDrop({
              sourceData: extractItemData(source) as ItemData & TData,
              targetData: itemDataByType.value[sourceType] as ItemData & TData
            })
          : true
      },
      onDrag: ({ self }) => {
        isDraggingOver.value = true
        dragIndicatorEdge.value = extractClosestEdge(self.data)
      },
      onDragLeave() {
        isDraggingOver.value = false
        dragIndicatorEdge.value = null
      },
      onDrop({ self, source, location }) {
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

        const sourceData = extractItemData(source) as ItemData & TData
        const targetData = extractItemData(target) as ItemData & TData

        if (!isItemData(sourceData) || !isItemData(targetData)) {
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
