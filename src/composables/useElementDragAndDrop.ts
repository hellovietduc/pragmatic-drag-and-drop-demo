import { autoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/element'
import {
  draggable,
  dropTargetForElements,
  type ElementDragPayload
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import type { CleanupFn, DropTargetRecord } from '@atlaskit/pragmatic-drag-and-drop/types'
import {
  createApp,
  h,
  Teleport,
  type Component,
  type Ref,
  ref,
  onMounted,
  onBeforeUnmount,
  computed
} from 'vue'
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview'
import { centerUnderPointer } from '@atlaskit/pragmatic-drag-and-drop/element/center-under-pointer'
import {
  attachClosestEdge,
  extractClosestEdge,
  type Edge
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import { keyBy } from 'lodash-es'

const isVerticalEdge = (edge: Edge): boolean => {
  return edge === 'top' || edge === 'bottom'
}

type DragData = Record<string | symbol, unknown>

/** Symbol to identify events made by Pragmatic DnD. */
const ITEM_KEY = Symbol('item')

type ItemData = DragData & {
  [ITEM_KEY]: true
  type: string
}

const isItemData = (data: DragData): data is ItemData => {
  return data[ITEM_KEY] === true
}

const extractItemData = (payload: ElementDragPayload | DropTargetRecord): ItemData => {
  return payload.data as ItemData
}

const makeItemData = <TItemData>(itemData: TItemData, type: ItemData['type']): ItemData => {
  return { ...itemData, [ITEM_KEY]: true, type }
}

const noOp = () => {}

type ItemState =
  | { type: 'idle' }
  | { type: 'preview'; container: HTMLElement }
  | { type: 'dragging' }
  | { type: 'is-over'; closestEdge: Edge | null }

const IDLE_STATE: ItemState = { type: 'idle' }
const DRAGGING_STATE: ItemState = { type: 'dragging' }

type ComponentProps = Record<string, unknown>

const renderDragPreview = <TProps extends ComponentProps>(
  container: HTMLElement,
  component: Component,
  props?: TProps
) => {
  const app = createApp({
    render: () => h(Teleport, { to: container }, [h(component, props)])
  })
  app.mount(container)
  return () => app.unmount()
}

/**
 * Makes an element draggable.
 */
const useDraggableElement = <
  TItemData extends DragData,
  TDragPreviewComponentProps extends ComponentProps
>({
  elementRef,
  type,
  itemData,
  dragHandleElementRef,
  dragPreviewComponent,
  dragPreviewComponentProps,
  onDragStart,
  onDrop
}: {
  /**
   * Element to be made draggable.
   */
  elementRef: Ref<HTMLElement | undefined>
  /**
   * Used to differentiate multiple types of drags on a page.
   */
  type: ItemData['type']
  /**
   * Data to attach with this draggable element.
   */
  itemData: Ref<TItemData>
  /**
   * Element to be used as a drag handle.
   * @default elementRef
   */
  dragHandleElementRef?: Ref<HTMLElement | undefined>
  /**
   * Component to be used as a drag preview.
   * @default elementRef
   */
  dragPreviewComponent?: Component<TDragPreviewComponentProps>
  /**
   * Props to be passed to the drag preview component.
   */
  dragPreviewComponentProps?: Ref<TDragPreviewComponentProps>
  /**
   * A drag operation has started.
   */
  onDragStart?: () => void
  /**
   * The current element has been dropped.
   */
  onDrop?: () => void
}) => {
  const itemState = ref<ItemState>(IDLE_STATE)

  const data = computed(() => makeItemData(itemData.value, type))

  const makeElementDraggable = () => {
    if (!elementRef.value) return noOp
    return draggable({
      element: elementRef.value,
      dragHandle: dragHandleElementRef?.value,
      getInitialData: () => data.value,
      onGenerateDragPreview: ({ nativeSetDragImage }) => {
        // Only render a custom drag preview if a component is provided.
        if (!dragPreviewComponent) return
        setCustomNativeDragPreview({
          nativeSetDragImage,
          getOffset: centerUnderPointer, // Center the drag preview under the pointer.
          render: ({ container }) => {
            return renderDragPreview<TDragPreviewComponentProps>(
              container,
              dragPreviewComponent,
              dragPreviewComponentProps?.value
            )
          }
        })
      },
      onDragStart: () => {
        itemState.value = DRAGGING_STATE
        onDragStart?.()
      },
      onDrop: () => {
        // `onDrop` may not fired if the element is destroyed in a virtualized list.
        // DO NOT handle reordering logic here.
        itemState.value = IDLE_STATE
        onDrop?.()
      }
    })
  }

  let cleanUp: CleanupFn

  onMounted(() => {
    cleanUp = makeElementDraggable()
  })

  onBeforeUnmount(() => {
    cleanUp?.()
  })

  return {
    itemState
  }
}

type OnDropPayload<TItemData extends DragData> = {
  sourceData: ItemData & TItemData
  targetData: ItemData & TItemData
}

/**
 * Makes an element a drop target for other draggable elements.
 */
const useDropTargetForElements = <TItemData extends DragData>({
  elementRef,
  types,
  itemData,
  ignoresInnerDrops = false,
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
      types.map(({ type }) => makeItemData(itemData.value, type)),
      'type'
    )
  )

  const setUpDropTarget = () => {
    if (!elementRef.value) return noOp
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

/**
 * Enables auto scrolling for the scroll container in a draggable list.
 */
const useDragAndDropAutoScroll = ({
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
    if (!scrollContainerElementRef.value) return noOp
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

export { isVerticalEdge, useDraggableElement, useDropTargetForElements, useDragAndDropAutoScroll }
export type { DragData, ItemState, ItemData, OnDropPayload }
