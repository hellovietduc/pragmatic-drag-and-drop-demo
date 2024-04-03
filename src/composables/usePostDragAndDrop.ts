import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { createApp, h, Teleport, type Ref, ref, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview'
import SurfacePost from '@/components/SurfacePost.vue'
import { centerUnderPointer } from '@atlaskit/pragmatic-drag-and-drop/element/center-under-pointer'
import {
  attachClosestEdge,
  extractClosestEdge,
  type Edge
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import { isEmpty } from 'lodash-es'

const renderDragPreview = (container: HTMLElement, { postId }: { postId: string }) => {
  const app = createApp({
    render: () =>
      h(Teleport, { to: container }, [h(SurfacePost, { id: postId, mode: 'drag-preview' })])
  })
  app.mount(container)
  return () => app.unmount()
}

export const usePostDragAndDrop = ({
  postId,
  postEl
}: {
  postId: string
  postEl: Ref<HTMLElement | undefined>
}) => {
  const draggingPostId = ref<string | null>(null)
  const dragIndicatorEdge = ref<Edge | null>(null)

  let cleanUpDraggable: () => void | undefined
  let cleanUpDropTarget: () => void | undefined

  const makePostDraggable = () => {
    if (!postEl.value) return
    cleanUpDraggable = draggable({
      element: postEl.value,
      getInitialData: () => {
        return { postId }
      },
      onGenerateDragPreview: ({ nativeSetDragImage }) => {
        setCustomNativeDragPreview({
          getOffset: centerUnderPointer,
          render: ({ container }) => {
            return renderDragPreview(container, { postId })
          },
          nativeSetDragImage
        })
      },
      onDragStart: ({ source }) => {
        console.log('🚀 post drag start', source.data)
        draggingPostId.value = source.data.postId as string
      },
      onDrop: ({ source }) => {
        console.log('🚀 post drop', source.data)
        draggingPostId.value = null
      }
    })
  }

  const setupDropTarget = () => {
    if (!postEl.value) return
    cleanUpDropTarget = dropTargetForElements({
      element: postEl.value,
      getData: ({ source, input }) => {
        if (!postEl.value) return source.data
        return attachClosestEdge(
          { postId },
          {
            element: postEl.value,
            input,
            allowedEdges: ['top', 'bottom']
          }
        )
      },
      canDrop: ({ source }) => {
        return !isEmpty(source.data.postId)
      },
      onDrag: ({ self, source }) => {
        const isSource = source.element === postEl.value
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

  onMounted(async () => {
    await nextTick()
    makePostDraggable()
    setupDropTarget()
  })

  onBeforeUnmount(() => {
    cleanUpDraggable?.()
    cleanUpDropTarget?.()
  })

  return {
    draggingPostId,
    dragIndicatorEdge
  }
}
