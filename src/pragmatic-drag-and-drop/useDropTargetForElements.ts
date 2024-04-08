import {
  extractItemData,
  isItemData,
  makeItemData,
  type DragData,
  type ItemData
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

type OnDropPayload<TItemData extends DragData> = {
  sourceData: ItemData & TItemData
  targetData: ItemData & TItemData
}

type OnDropFromExternalPayload<TItemData extends DragData> = {
  sourceData: DragData
  targetData: ItemData & TItemData
}

/**
 * Makes an element a drop target for other draggable elements.
 */
export const useDropTargetForElements = <TItemData extends DragData>({
  elementRef,
  types,
  itemData,
  ignoresInnerDrops = false,
  canDrop,
  onDrop,
  onDropFromExternal
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
  itemData: Ref<TItemData>
  /**
   * Whether to ignore drop events from inner drop targets.
   */
  ignoresInnerDrops?: boolean
  /**
   * Whether the item can be dropped on the target.
   */
  canDrop?: (payload: { sourceData: ItemData; targetData: ItemData }) => boolean
  /**
   * Finished a drag and drop operation.
   */
  onDrop?: (payload: OnDropPayload<TItemData>) => void
  onDropFromExternal?: (payload: OnDropFromExternalPayload<TItemData>) => void
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

  const dataByType = computed(() =>
    keyBy(
      types.map(({ type }) => makeItemData({ ...itemData.value, type })),
      'type'
    )
  )

  const setUpDropTarget = () => {
    if (!elementRef.value) return () => {}
    return dropTargetForElements({
      element: elementRef.value,
      getData: ({ source, input }) => {
        const sourceType = extractItemData(source).type
        if (!elementRef.value) return dataByType.value[sourceType]
        // Attach the closest edge to the pointer on the drop target.
        return attachClosestEdge(dataByType.value[sourceType], {
          element: elementRef.value,
          input,
          allowedEdges: allowedEdgesByType[sourceType].allowedEdges
        })
      },
      canDrop: ({ source }) => {
        // Only allow dropping items of the specified types.
        const sourceType = extractItemData(source).type
        const isAllowedDragType = types.some(({ type }) => type === sourceType)
        return isAllowedDragType && canDrop
          ? canDrop({
              sourceData: extractItemData(source),
              targetData: dataByType.value[sourceType]
            })
          : true
      },
      getIsSticky: () => true, // Remembers last drop target even if the pointer already leaves it.
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
        // Use `ignoresInnerDrops` to skip handling nested drops
        // from an outer drop target.
        const target = location.current.dropTargets[0]
        if (!target || (ignoresInnerDrops && self.element !== target.element)) {
          return
        }

        const sourceData = extractItemData(source) as ItemData & TItemData
        const targetData = extractItemData(target) as ItemData & TItemData

        if (!isItemData(sourceData) || !isItemData(targetData)) {
          return
        }

        onDrop?.({ sourceData, targetData })
      }
    })
  }

  let cleanUp: CleanupFn

  onMounted(() => {
    cleanUp = setUpDropTarget()
  })

  onBeforeUnmount(() => {
    cleanUp?.()
  })

  return {
    isDraggingOver,
    dragIndicatorEdge
  }
}
