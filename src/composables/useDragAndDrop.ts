import { autoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/element'
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import {
  draggable,
  dropTargetForElements,
  type ElementDragPayload
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
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

type DragData = ElementDragPayload['data']
type ComponentProps = Record<string, unknown>

export type ItemState =
  | { type: 'idle' }
  | { type: 'preview'; container: HTMLElement }
  | { type: 'dragging' }
  | { type: 'is-over'; closestEdge: Edge | null }

const IDLE_STATE: ItemState = { type: 'idle' }
const DRAGGING_STATE: ItemState = { type: 'dragging' }

const noOp = () => {}

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

export const useDragAndDrop = <
  TItemData extends DragData,
  TDragPreviewComponentProps extends ComponentProps = ComponentProps
>({
  elementRef,
  itemData,
  axis,
  dragHandleElementRef,
  dragPreviewComponent,
  dragPreviewComponentProps,
  canDrop,
  scrollContainerElementRef
}: {
  elementRef: Ref<HTMLElement | undefined>
  itemData: TItemData
  axis: 'vertical' | 'horizontal'
  dragHandleElementRef?: Ref<HTMLElement | undefined>
  dragPreviewComponent?: Component<TDragPreviewComponentProps>
  dragPreviewComponentProps?: TDragPreviewComponentProps
  canDrop?: (data: DragData) => boolean
  scrollContainerElementRef?: Ref<HTMLElement | undefined>
}) => {
  const itemState = ref<ItemState>(IDLE_STATE)
  const dragIndicatorEdge = ref<Edge | null>(null)

  const allowedEdges = computed<Edge[]>(() => {
    return axis === 'vertical' ? ['top', 'bottom'] : ['left', 'right']
  })

  let cleanUp: () => void

  const getItemData = (source: ElementDragPayload): TItemData => {
    return source.data as TItemData
  }

  const makeElementDraggable = () => {
    if (!elementRef.value) return noOp
    return draggable({
      element: elementRef.value,
      dragHandle: dragHandleElementRef?.value,
      getInitialData: () => {
        return itemData
      },
      onGenerateDragPreview: ({ nativeSetDragImage }) => {
        if (!dragPreviewComponent) return
        setCustomNativeDragPreview({
          nativeSetDragImage,
          getOffset: centerUnderPointer,
          render: ({ container }) => {
            return renderDragPreview<TDragPreviewComponentProps>(
              container,
              dragPreviewComponent,
              dragPreviewComponentProps
            )
          }
        })
      },
      onDragStart: ({ source }) => {
        console.log('🚀 drag start', source.data)
        itemState.value = DRAGGING_STATE
      },
      onDrop: ({ source }) => {
        console.log('🚀 drop', source.data)
        itemState.value = IDLE_STATE
      }
    })
  }

  const setupDropTarget = () => {
    if (!elementRef.value) return noOp
    return combine(
      dropTargetForElements({
        element: elementRef.value,
        getData: ({ source, input }) => {
          if (!elementRef.value) return source.data
          return attachClosestEdge(itemData, {
            element: elementRef.value,
            input,
            allowedEdges: allowedEdges.value
          })
        },
        canDrop: ({ source }) => {
          return canDrop?.(getItemData(source)) ?? true
        },
        getIsSticky: () => true,
        onDrag: ({ self, source }) => {
          const isSource = source.element === elementRef.value
          if (isSource) {
            dragIndicatorEdge.value = null
            return
          }
          const closestEdge = extractClosestEdge(self.data)
          dragIndicatorEdge.value = closestEdge
        },
        onDragLeave() {
          dragIndicatorEdge.value = null
        },
        onDrop() {
          console.log(`🚀 drop to target`, itemData)
          itemState.value = IDLE_STATE
          dragIndicatorEdge.value = null
        }
      }),
      scrollContainerElementRef?.value
        ? autoScrollForElements({
            element: scrollContainerElementRef.value
          })
        : noOp
    )
  }

  onMounted(() => {
    cleanUp = combine(makeElementDraggable(), setupDropTarget())
  })

  onBeforeUnmount(() => {
    cleanUp?.()
  })

  return {
    itemState,
    dragIndicatorEdge
  }
}
