import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview'
import { h, createApp, Teleport, onMounted, type Ref } from 'vue'
import SurfaceSection from '@/components/SurfaceSection.vue'

export const useSectionDragAndDrop = ({ sectionEls }: { sectionEls: Ref<HTMLElement[]> }) => {
  onMounted(() => {
    sectionEls.value.forEach((el) => {
      const sectionid = el.dataset.dndSectionId
      draggable({
        element: el,
        dragHandle: el.querySelector('[data-dnd-section-drag-handle]') ?? undefined,
        onGenerateDragPreview: ({ nativeSetDragImage }) => {
          if (!sectionid) return
          setCustomNativeDragPreview({
            render: ({ container }) => {
              const app = createApp({
                render: () =>
                  h(Teleport, { to: container }, [
                    h(SurfaceSection, { id: sectionid, mode: 'drag-preview' })
                  ])
              })
              app.mount(container)
              return () => app.unmount()
            },
            nativeSetDragImage
          })
        },
        onDragStart: (e) => {
          console.log('🚀 section drag start', e)
        },
        onDrop: (e) => {
          console.log('🚀 section drop', e)
        }
      })
    })
  })
}
