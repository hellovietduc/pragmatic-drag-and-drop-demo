import { computed, onBeforeUnmount, onMounted, ref, type Ref } from 'vue'
import {
  extractExternalDragType,
  extractItemData,
  extractItemDataFromExternal,
  extractRelativePositionToTarget,
  isItemData,
  makeItemData,
  type CanDropPayload,
  type DragData,
  type DraggableSource,
  type ItemData,
  type OnDropPayload
} from '@/pragmatic-drag-and-drop/helpers'
import {
  attachClosestEdge,
  extractClosestEdge,
  type Edge
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import { dropTargetForExternal } from '@atlaskit/pragmatic-drag-and-drop/external/adapter'
import type { CleanupFn, ExternalDragType } from '@atlaskit/pragmatic-drag-and-drop/types'
import { mapValues } from 'lodash-es'
import type {
  DropTargetArgs,
  DropTargetEventPayloadMap
} from '@atlaskit/pragmatic-drag-and-drop/dist/types/internal-types'

type EventName = keyof DropTargetEventPayloadMap<ExternalDragType> | 'canDrop'
type DropTargetListener<T extends EventName> = NonNullable<DropTargetArgs<ExternalDragType>[T]>

/**
 * Makes an element a drop target for external sources.
 */
export const useDropTargetForExternal = <TTargetData extends DragData>({
  elementRef,
  type,
  data,
  ignoresNestedDrops = false
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
   * Data to attach with this drop target.
   */
  data: Ref<TTargetData>
  /**
   * Whether to ignore drop events from nested drop targets.
   */
  ignoresNestedDrops?: boolean
}) => {
  const draggableSourcesByType = ref<Record<ItemData['type'], DraggableSource>>({})
  const dropTargetListeners = ref<{ [K in EventName]?: DropTargetListener<K>[] }>({})

  const allowedEdgesByType = computed(() => {
    return mapValues(
      draggableSourcesByType.value,
      ({ axis }) => (axis === 'horizontal' ? ['left', 'right'] : ['top', 'bottom']) as Edge[]
    )
  })

  const addDropTargetListener = <T extends EventName>(
    event: T,
    listener: DropTargetListener<T>
  ) => {
    dropTargetListeners.value[event] ||= []
    // @ts-expect-error Not sure why TS is complaining here.
    dropTargetListeners.value[event]?.push(listener)
  }

  /**
   * Registers a draggable source that can be dropped on this target.
   */
  const addDraggableSource = <TSourceData>({
    type,
    axis,
    canDrop,
    onDrop
  }: DraggableSource & {
    /**
     * Whether the draggable element can be dropped on the target.
     */
    canDrop?: (payload: CanDropPayload<TSourceData, TTargetData>) => boolean
    /**
     * Finished a drag and drop operation.
     */
    onDrop?: (payload: OnDropPayload<TSourceData, TTargetData>) => void
  }) => {
    draggableSourcesByType.value[type] = { type, axis }

    addDropTargetListener('canDrop', ({ source }) => {
      // Only allow dropping draggable elements of the specified types.
      const sourceType = extractExternalDragType(source)
      if (sourceType !== type) return false
      if (canDrop) {
        // We enforce external drag sources to have data attached to them
        // so we can check if they can be dropped on the target.
        const sourceItem = extractItemDataFromExternal(source)
        if (!sourceItem) return false
        return canDrop({
          sourceItem: sourceItem as ItemData<TSourceData>,
          targetItem: itemData.value as ItemData<TTargetData>
        })
      }
      return true
    })

    addDropTargetListener('onDrop', ({ source, location }) => {
      const target = location.current.dropTargets[0]

      const sourceItem = extractItemDataFromExternal(source) as ItemData<TSourceData>
      const targetItem = extractItemData(target) as ItemData<TTargetData>

      if (!isItemData(sourceItem) || !isItemData(targetItem)) {
        return
      }

      const relativePositionToTarget = extractRelativePositionToTarget(targetItem)
      if (!relativePositionToTarget) {
        return
      }

      onDrop?.({ sourceItem, targetItem, relativePositionToTarget })
    })
  }

  const isDraggingOver = ref(false)
  const dragIndicatorEdge = ref<Edge | null>(null)

  const itemData = computed(() => makeItemData(data.value, type))

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
          allowedEdges: allowedEdgesByType.value[sourceType]
        })
      },
      getIsSticky: () => true, // Remembers last drop target even if the pointer already leaves it.
      canDrop: (e) => {
        // Allow dropping if any of the draggable sources wants to handle the drop.
        return dropTargetListeners.value.canDrop?.some((listener) => listener(e)) ?? false
      },
      onDrag: (e) => {
        isDraggingOver.value = true
        dragIndicatorEdge.value = extractClosestEdge(e.self.data)
      },
      onDragLeave: () => {
        isDraggingOver.value = false
        dragIndicatorEdge.value = null
      },
      onDrop: (e) => {
        isDraggingOver.value = false
        dragIndicatorEdge.value = null

        // If there are nested drop targets all of them will have
        // their `onDrop` callbacks executed.
        // Use `ignoresNestedDrops` to skip handling nested drops
        // from an outer drop target.
        const target = e.location.current.dropTargets[0]
        if (!target || (ignoresNestedDrops && e.self.element !== target.element)) {
          return
        }
        dropTargetListeners.value.onDrop?.forEach((listener) => listener(e))
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
    dragIndicatorEdge,
    addDraggableSource
  }
}
