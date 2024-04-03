import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { onMounted, type Ref } from 'vue'

export const usePostDragAndDrop = ({ postEls }: { postEls: Ref<HTMLElement[]> }) => {
  onMounted(() => {
    postEls.value.forEach((el) => {
      draggable({
        element: el,
        onDragStart: (e) => {
          console.log('🚀 post drag start', e)
        }
      })
    })
  })
}
