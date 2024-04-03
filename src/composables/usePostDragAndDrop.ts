import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { onMounted, type Ref } from 'vue'

export const usePostDragAndDrop = ({
  postEls,
  sectionEls
}: {
  postEls: Ref<HTMLElement[]>
  sectionEls: Ref<HTMLElement[]>
}) => {
  const makePostsDraggable = () => {
    postEls.value.forEach((el) => {
      draggable({
        element: el,
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
    sectionEls.value.forEach((el) => {
      const dropTarget = el.querySelector('[data-dnd-post-drop-target]')
      if (!dropTarget) return
      dropTargetForElements({
        element: dropTarget
      })
    })
  }

  onMounted(() => {
    makePostsDraggable()
    setupDropTargets()
  })
}
