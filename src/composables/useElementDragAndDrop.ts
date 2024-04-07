import { autoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/element'
import {
  draggable,
  dropTargetForElements,
  type ElementDragPayload
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import type {
  CleanupFn,
  DragLocationHistory,
  DropTargetRecord,
  Position
} from '@atlaskit/pragmatic-drag-and-drop/types'
import {
  createApp,
  h,
  Teleport,
  type Component,
  type Ref,
  ref,
  onMounted,
  onBeforeUnmount,
  computed,
  type ComponentPublicInstance
} from 'vue'
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview'
import { centerUnderPointer } from '@atlaskit/pragmatic-drag-and-drop/element/center-under-pointer'
import { preventUnhandled } from '@atlaskit/pragmatic-drag-and-drop/prevent-unhandled'
import { disableNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/disable-native-drag-preview'
import {
  attachClosestEdge,
  extractClosestEdge,
  type Edge
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import { keyBy } from 'lodash-es'
import { createSharedComposable } from '@vueuse/core'

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

const makeItemData = <TItemData>(itemData: TItemData & { type: ItemData['type'] }): ItemData => {
  return { ...itemData, [ITEM_KEY]: true }
}

const extractPointerPosition = (location: DragLocationHistory): Position => {
  return {
    x: location.current.input.clientX,
    y: location.current.input.clientY
  }
}

const noOp = () => {}

type ComponentProps = Record<string, unknown>

const renderNativeDragPreview = <TProps extends ComponentProps>(
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

const renderCustomDragPreview = <TProps extends ComponentProps>(
  container: HTMLElement,
  position: Position,
  component: Component,
  props?: TProps
) => {
  const app = createApp({
    data() {
      return {
        x: position.x,
        y: position.y
      }
    },
    methods: {
      reposition(position: Position) {
        const previewEl = this.$refs.previewEl as HTMLElement
        const { x, y } = centerUnderPointer({ container: previewEl })
        this.x = position.x - x
        this.y = position.y - y
      }
    },
    expose: ['reposition'],
    render() {
      return h(Teleport, { to: 'body' }, [
        h(
          'div',
          {
            ref: 'previewEl',
            style: {
              position: 'fixed',
              zIndex: Number.MAX_SAFE_INTEGER,
              left: `${this.x}px`,
              top: `${this.y}px`,
              pointerEvents: 'none'
            }
          },
          [h(component, props)]
        )
      ])
    }
  })

  const child = document.createElement('div')
  container.appendChild(child)
  const vm = app.mount(child) as ComponentPublicInstance<{
    reposition: (position: Position) => void
  }>

  return {
    reposition: vm.reposition,
    unmount: app.unmount
  }
}

const useRenderCustomDragPreview = createSharedComposable(() => {
  type RepositionFn = ReturnType<typeof renderCustomDragPreview>['reposition']
  let repositionFn: RepositionFn = noOp
  let unmountFn: CleanupFn = noOp

  const render = <TProps extends ComponentProps>(
    container: HTMLElement,
    position: Position,
    component: Component,
    props?: TProps
  ) => {
    const ctx = renderCustomDragPreview<TProps>(container, position, component, props)
    unmountFn = ctx.unmount
    repositionFn = ctx.reposition
  }

  const reposition: RepositionFn = (position) => {
    repositionFn(position)
  }

  const unmount = () => {
    unmountFn()
  }

  return {
    render,
    reposition,
    unmount
  }
})

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
  useNativeDragPreview = true,
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
   * Whether to use a native drag preview or a custom one.
   * A custom drag preview is an HTML element that follows the pointer
   * while dragging and cannot be dragged outside the viewport.
   * @default true
   */
  useNativeDragPreview?: boolean
  /**
   * A drag operation has started.
   */
  onDragStart?: () => void
  /**
   * The current element has been dropped.
   */
  onDrop?: () => void
}) => {
  const isDragging = ref(false)

  const data = computed(() => makeItemData({ ...itemData.value, type }))

  const makeElementDraggable = () => {
    if (!elementRef.value) return noOp
    return draggable({
      element: elementRef.value,
      dragHandle: dragHandleElementRef?.value,
      getInitialData: () => data.value,
      onGenerateDragPreview: ({ nativeSetDragImage }) => {
        if (!dragPreviewComponent) return
        if (!useNativeDragPreview && elementRef.value) {
          disableNativeDragPreview({ nativeSetDragImage })
        } else {
          setCustomNativeDragPreview({
            nativeSetDragImage,
            getOffset: centerUnderPointer, // Center the drag preview under the pointer.
            render: ({ container }) => {
              return renderNativeDragPreview<TDragPreviewComponentProps>(
                container,
                dragPreviewComponent,
                dragPreviewComponentProps?.value
              )
            }
          })
        }
      },
      onDragStart: ({ location }) => {
        isDragging.value = true
        if (!useNativeDragPreview && dragPreviewComponent && elementRef.value) {
          useRenderCustomDragPreview().render(
            elementRef.value,
            extractPointerPosition(location),
            dragPreviewComponent,
            dragPreviewComponentProps?.value
          )
          // https://atlassian.design/components/pragmatic-drag-and-drop/core-package/adapters/element/drag-previews#non-native-custom-drag-previews
          preventUnhandled.start()
        }
        onDragStart?.()
      },
      onDrag: ({ location }) => {
        if (!useNativeDragPreview && dragPreviewComponent) {
          useRenderCustomDragPreview().reposition(extractPointerPosition(location))
        }
      },
      onDrop: () => {
        // `onDrop` may not fired if the element is destroyed in a virtualized list.
        // DO NOT handle reordering logic here.
        isDragging.value = false
        useRenderCustomDragPreview().unmount()
        preventUnhandled.stop()
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
    isDragging
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
      types.map(({ type }) => makeItemData({ ...itemData.value, type })),
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
export type { DragData, ItemData, OnDropPayload }
