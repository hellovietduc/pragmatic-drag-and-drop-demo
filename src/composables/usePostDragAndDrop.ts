import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { createApp, h, Teleport, onMounted, type Ref } from 'vue'
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview'
import SurfacePost from '@/components/SurfacePost.vue'
import { centerUnderPointer } from '@atlaskit/pragmatic-drag-and-drop/element/center-under-pointer'

export const usePostDragAndDrop = ({ postEls }: { postEls: Ref<HTMLElement[]> }) => {
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

  onMounted(() => {
    makePostsDraggable()
  })
}

export const usePostDragAndDropSetup = ({ sectionEls }: { sectionEls: Ref<HTMLElement[]> }) => {
  const setupDropTargets = () => {
    sectionEls.value.forEach((el) => {
      const dropTarget = el.querySelector('[data-dnd-post-drop-target]')
      if (!dropTarget) return
      dropTargetForElements({
        element: dropTarget
      })
    })
  }

  onMounted(() => {
    setupDropTargets()
  })
}
