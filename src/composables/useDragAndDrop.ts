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
  onBeforeUnmount
} from 'vue'
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview'
import { centerUnderPointer } from '@atlaskit/pragmatic-drag-and-drop/element/center-under-pointer'
import {
  attachClosestEdge,
  extractClosestEdge,
  type Edge
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'

const renderDragPreview = (
  container: HTMLElement,
  component: Component,
  props: Record<string, unknown>
) => {
  const app = createApp({
    render: () => h(Teleport, { to: container }, [h(component, props)])
  })
  app.mount(container)
  return () => app.unmount()
}

export const useDragAndDrop = <TItemData extends Record<string, unknown>>({
  elementRef,
  itemData,
  dragPreviewComponent,
  dragPreviewComponentProps,
  dropTargetEdges,
  dragHandleElementRef,
  canDrop
}: {
  elementRef: Ref<HTMLElement | undefined>
  itemData: TItemData
  dragPreviewComponent: Component
  dragPreviewComponentProps: Record<string, unknown>
  dropTargetEdges: Edge[]
  dragHandleElementRef?: Ref<HTMLElement | undefined>
  canDrop?: (data: TItemData) => boolean
}) => {
  const draggingItemData = ref<TItemData | null>(null) as Ref<TItemData | null>
  const dragIndicatorEdge = ref<Edge | null>(null)

  let cleanUpDraggable: () => void | undefined
  let cleanUpDropTarget: () => void | undefined

  const getItemData = (source: ElementDragPayload): TItemData => {
    return source.data as TItemData
  }

  const makeElementDraggable = () => {
    if (!elementRef.value) return
    cleanUpDraggable = draggable({
      element: elementRef.value,
      dragHandle: dragHandleElementRef?.value,
      getInitialData: () => {
        return itemData
      },
      onGenerateDragPreview: ({ nativeSetDragImage }) => {
        setCustomNativeDragPreview({
          getOffset: centerUnderPointer,
          render: ({ container }) => {
            return renderDragPreview(container, dragPreviewComponent, dragPreviewComponentProps)
          },
          nativeSetDragImage
        })
      },
      onDragStart: ({ source }) => {
        console.log('🚀 drag start', source.data)
        draggingItemData.value = getItemData(source)
      },
      onDrop: ({ source }) => {
        console.log('🚀 drop', source.data)
        draggingItemData.value = null
      }
    })
  }

  const setupDropTarget = () => {
    if (!elementRef.value) return
    cleanUpDropTarget = dropTargetForElements({
      element: elementRef.value,
      getData: ({ source, input }) => {
        if (!elementRef.value) return source.data
        return attachClosestEdge(itemData, {
          element: elementRef.value,
          input,
          allowedEdges: dropTargetEdges
        })
      },
      canDrop: ({ source }) => {
        return canDrop?.(getItemData(source)) ?? true
      },
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
        dragIndicatorEdge.value = null
      }
    })
  }

  onMounted(() => {
    makeElementDraggable()
    setupDropTarget()
  })

  onBeforeUnmount(() => {
    cleanUpDraggable?.()
    cleanUpDropTarget?.()
  })

  return {
    draggingItemData,
    dragIndicatorEdge
  }
}
