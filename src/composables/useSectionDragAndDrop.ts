import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { onMounted, type Ref } from 'vue'

export const useSectionDragAndDrop = ({ sectionEls }: { sectionEls: Ref<HTMLElement[]> }) => {
  onMounted(() => {
    sectionEls.value.forEach((el) => {
      draggable({
        element: el,
        dragHandle: el.querySelector('[data-drag-handle]') ?? undefined,
        onDragStart: (e) => {
          console.log('🚀 section drag start', e)
        }
      })
    })
  })
}
