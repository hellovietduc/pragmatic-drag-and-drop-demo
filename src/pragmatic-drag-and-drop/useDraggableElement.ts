import {
  makeItemData,
  makeItemDataForExternal,
  type DragData,
  type ItemData,
  type DragDataForExternal
} from '@/pragmatic-drag-and-drop/helpers'
import { renderNativeDragPreview, type ComponentProps } from '@/pragmatic-drag-and-drop/renderer'
import {
  draggable,
  type ElementEventPayloadMap
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { centerUnderPointer } from '@atlaskit/pragmatic-drag-and-drop/element/center-under-pointer'
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview'
import type { CleanupFn } from '@atlaskit/pragmatic-drag-and-drop/types'
import { computed, onBeforeUnmount, onMounted, ref, type Component, type Ref } from 'vue'

/**
 * Makes an element draggable.
 */
export const useDraggableElement = <
  TData extends DragData,
  TDragPreviewComponentProps extends ComponentProps
>({
  elementRef,
  type,
  data,
  dataForExternal,
  dragHandleElementRef,
  dragPreviewComponent,
  dragPreviewComponentProps,
  onDragStart,
  onDrag,
  onDrop
}: {
  /**
   * Element to be made draggable.
   */
  elementRef: Ref<HTMLElement | undefined>
  /**
   * Used to differentiate multiple types of drag sources on a page.
   */
  type: ItemData['type']
  /**
   * Data to attach with this draggable element.
   */
  data: Ref<TData>
  /**
   * Data to attach with this draggable element when dropped on an external drop target.
   */
  dataForExternal?: Ref<DragDataForExternal>
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
  onDragStart?: (e: ElementEventPayloadMap['onDragStart']) => void
  /**
   * A throttled update of where the the user is currently dragging.
   */
  onDrag?: (e: ElementEventPayloadMap['onDrag']) => void
  /**
   * The user has finished a drag and drop operation.
   */
  onDrop?: (e: ElementEventPayloadMap['onDrop']) => void
}) => {
  const isDragging = ref(false)

  const itemData = computed(() => makeItemData(data.value, type))
  const itemDataForExternal = computed(() =>
    dataForExternal ? makeItemDataForExternal(dataForExternal.value, type) : {}
  )

  const makeElementDraggable = () => {
    if (!elementRef.value) return () => {}
    return draggable({
      element: elementRef.value,
      dragHandle: dragHandleElementRef?.value,
      getInitialData: () => itemData.value,
      getInitialDataForExternal: () => itemDataForExternal.value,
      onGenerateDragPreview: ({ nativeSetDragImage }) => {
        if (!dragPreviewComponent) return
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
      },
      onDragStart: (e) => {
        isDragging.value = true
        onDragStart?.(e)
      },
      onDrag,
      onDrop: (e) => {
        // `onDrop` may not fired if the element is destroyed in a virtualized list.
        // DO NOT handle reordering logic here.
        isDragging.value = false
        onDrop?.(e)
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
