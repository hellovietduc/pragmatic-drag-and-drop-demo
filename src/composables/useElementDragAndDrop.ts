import { autoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/element'
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
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

type DragData = Record<string | symbol, unknown>

/** Symbol to identify events made by Pragmatic DnD. */
const itemKey = Symbol('item')

type ItemData = DragData & {
  [itemKey]: true
  type: string
  instanceId: symbol
}

const isItemData = (data: DragData): data is ItemData => {
  return data[itemKey] === true
}

const getItemData = (payload: ElementDragPayload | DropTargetRecord): ItemData => {
  return payload.data as ItemData
}

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

const noOp = () => {}

type OnDropPayload = {
  sourceData: ItemData
  targetData: ItemData
  closestEdgeOfTarget: Edge
}

export const useElementDragAndDrop = <
  TItemData extends DragData,
  TDragPreviewComponentProps extends ComponentProps = ComponentProps
>({
  elementRef,
  type,
  axis,
  itemData,
  dragHandleElementRef,
  dragPreviewComponent,
  dragPreviewComponentProps,
  scrollContainerElementRef,
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
   * Drag direction.
   */
  axis: 'vertical' | 'horizontal'
  /**
   * Data to attach with this draggable element.
   */
  itemData: TItemData
  /**
   * Element to be used as a drag handle.
   * @default elementRef
   */
  dragHandleElementRef?: Ref<HTMLElement | undefined>
  /**
   * Element to be used as a drag preview.
   * @default elementRef
   */
  dragPreviewComponent?: Component<TDragPreviewComponentProps>
  /**
   * Props to be passed to the drag preview component.
   */
  dragPreviewComponentProps?: TDragPreviewComponentProps
  /**
   * Element to be enable auto-scrolling for.
   */
  scrollContainerElementRef?: Ref<HTMLElement | undefined>
  /**
   * Event handler for when a draggable element is dropped on a drop target.
   */
  onDrop?: (payload: OnDropPayload) => void
}) => {
  const itemState = ref<ItemState>(IDLE_STATE)
  const dragIndicatorEdge = ref<Edge | null>(null)

  /** Symbol to identify the current draggable instance. */
  const instanceId = Symbol('instanceId')

  const data: ItemData = { ...itemData, [itemKey]: true, type, instanceId }

  /**
   * Makes the element draggable.
   */
  const makeElementDraggable = () => {
    if (!elementRef.value) return noOp
    return draggable({
      element: elementRef.value,
      dragHandle: dragHandleElementRef?.value,
      getInitialData: () => data,
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
              dragPreviewComponentProps
            )
          }
        })
      },
      onDragStart: () => {
        itemState.value = DRAGGING_STATE
      },
      onDrop: () => {
        // `onDrop` may not fired if the element is destroyed in a virtualized list.
        // DO NOT handle reordering logic here.
        itemState.value = IDLE_STATE
      }
    })
  }

  const allowedEdges = computed<Edge[]>(() => {
    return axis === 'vertical' ? ['top', 'bottom'] : ['left', 'right']
  })

  /**
   * Also makes this element a drop target for other draggable elements.
   */
  const setUpDropTarget = () => {
    if (!elementRef.value) return noOp
    return dropTargetForElements({
      element: elementRef.value,
      getData: ({ input }) => {
        if (!elementRef.value) return data
        // Attach which is the closest edge to the pointer on the drop target.
        return attachClosestEdge(data, {
          element: elementRef.value,
          input,
          allowedEdges: allowedEdges.value
        })
      },
      canDrop: ({ source }) => {
        // Only allow dropping elements of the same type.
        return getItemData(source).type === type
      },
      getIsSticky: () => true, // Remembers last drop target even if the pointer already leaves it.
      onDrag: ({ self }) => {
        dragIndicatorEdge.value = extractClosestEdge(self.data)
      },
      onDragLeave() {
        dragIndicatorEdge.value = null
      },
      onDrop({ source, location }) {
        itemState.value = IDLE_STATE
        dragIndicatorEdge.value = null

        const target = location.current.dropTargets[0]
        if (!target) {
          return
        }

        const sourceData = getItemData(source)
        const targetData = getItemData(target)

        if (!isItemData(sourceData) || !isItemData(targetData)) {
          return
        }

        const closestEdgeOfTarget = extractClosestEdge(targetData)

        if (closestEdgeOfTarget) onDrop?.({ sourceData, targetData, closestEdgeOfTarget })
      }
    })
  }

  /**
   * Enables auto-scrolling for the scroll container.
   */
  const enableAutoScroll = () => {
    if (!scrollContainerElementRef?.value) return noOp
    return autoScrollForElements({
      element: scrollContainerElementRef.value
    })
  }

  let cleanUp: CleanupFn

  onMounted(() => {
    cleanUp = combine(makeElementDraggable(), setUpDropTarget(), enableAutoScroll())
  })

  onBeforeUnmount(() => {
    cleanUp?.()
  })

  return {
    itemState,
    dragIndicatorEdge
  }
}

export type { ItemState, OnDropPayload }
