import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { createApp, h, Teleport, onMounted, type Ref, ref } from 'vue'
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview'
import SurfacePost from '@/components/SurfacePost.vue'
import { centerUnderPointer } from '@atlaskit/pragmatic-drag-and-drop/element/center-under-pointer'
import {
  attachClosestEdge,
  extractClosestEdge,
  type Edge
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import { createSharedComposable } from '@vueuse/core'

export const useDragIndicator = createSharedComposable(() => {
  const dragIndicatorEdge = ref<Edge | null>(null)
  const dragOverPostId = ref<string | null>(null)

  return { dragIndicatorEdge, dragOverPostId }
})

export const usePostDragAndDrop = ({ postEls }: { postEls: Ref<HTMLElement[]> }) => {
  const { dragIndicatorEdge, dragOverPostId } = useDragIndicator()

  const makePostsDraggable = () => {
    postEls.value.forEach((el) => {
      const postId = el.dataset.dndPostId
      draggable({
        element: el,
        onGenerateDragPreview: ({ nativeSetDragImage }) => {
          if (!postId) return
          setCustomNativeDragPreview({
            getOffset: centerUnderPointer,
            render: ({ container }) => {
              const app = createApp({
                render: () =>
                  h(Teleport, { to: container }, [
                    h(SurfacePost, { id: postId, mode: 'drag-preview' })
                  ])
              })
              app.mount(container)
              return () => app.unmount()
            },
            nativeSetDragImage
          })
        },
        onDragStart: (e) => {
          console.log('🚀 post drag start', e)
        },
        onDrop: (e) => {
          console.log('🚀 post drop', e)
        }
      })
    })
  }

  const setupDropTargets = () => {
    postEls.value.forEach((el) => {
      const postId = el.dataset.dndPostId
      dropTargetForElements({
        element: el,
        getData: ({ input }) => {
          return attachClosestEdge(
            { postId },
            {
              element: el,
              input,
              allowedEdges: ['top', 'bottom']
            }
          )
        },
        onDrag: ({ self, source }) => {
          const isSource = source.element === el
          if (isSource) {
            dragIndicatorEdge.value = null
            dragOverPostId.value = null
            return
          }
          const closestEdge = extractClosestEdge(self.data)
          dragIndicatorEdge.value = closestEdge
          dragOverPostId.value = self.data.postId as string
        },
        onDragLeave() {
          dragIndicatorEdge.value = null
          dragOverPostId.value = null
        },
        onDrop() {
          dragIndicatorEdge.value = null
          dragOverPostId.value = null
        }
      })
    })
  }

  onMounted(() => {
    makePostsDraggable()
    setupDropTargets()
  })
}
