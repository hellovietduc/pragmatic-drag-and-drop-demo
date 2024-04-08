import {
  extractPointerPosition,
  makeItemData,
  makeItemDataForExternal,
  type DragData,
  type ItemData,
  type ItemDataForExternal
} from '@/pragmatic-drag-and-drop/helpers'
import {
  renderNativeDragPreview,
  useRenderCustomDragPreview,
  type ComponentProps
} from '@/pragmatic-drag-and-drop/renderers'
import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { centerUnderPointer } from '@atlaskit/pragmatic-drag-and-drop/element/center-under-pointer'
import { disableNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/disable-native-drag-preview'
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview'
import { preventUnhandled } from '@atlaskit/pragmatic-drag-and-drop/prevent-unhandled'
import type { CleanupFn } from '@atlaskit/pragmatic-drag-and-drop/types'
import { computed, onBeforeUnmount, onMounted, ref, type Component, type Ref } from 'vue'

/**
 * Makes an element draggable.
 */
export const useDraggableElement = <
  TItemData extends DragData,
  TDragPreviewComponentProps extends ComponentProps
>({
  elementRef,
  type,
  itemData,
  itemDataForExternal,
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
   * Data to attach with this draggable element when dropped on an external drop target.
   */
  itemDataForExternal?: Ref<ItemDataForExternal>
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
   *
   * Comparison between native and custom drag previews:
   *
   * Native drag preview:
   * - Is rendered in a separate layer than the browser window.
   * It doesn't affect the rendering performance of the page.
   * - Can be dragged outside the browser window to other applications.
   * - Has some caveats when rendering images inside the drag preview.
   *
   * Custom drag preview:
   * - Is rendered in the DOM of the page.
   * - Can't be dragged outside the browser window.
   *
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

  const internalData = computed(() => makeItemData({ ...itemData.value, type }))
  const externalData = computed(() =>
    itemDataForExternal ? makeItemDataForExternal({ ...itemDataForExternal.value, type }) : {}
  )

  const makeElementDraggable = () => {
    if (!elementRef.value) return () => {}
    return draggable({
      element: elementRef.value,
      dragHandle: dragHandleElementRef?.value,
      getInitialData: () => internalData.value,
      getInitialDataForExternal: () => externalData.value,
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
