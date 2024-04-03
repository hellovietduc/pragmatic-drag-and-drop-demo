import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview'
import { h, createApp, Teleport, onMounted, type Ref, ref } from 'vue'
import SurfaceSection from '@/components/SurfaceSection.vue'
import { centerUnderPointer } from '@atlaskit/pragmatic-drag-and-drop/element/center-under-pointer'
import {
  attachClosestEdge,
  extractClosestEdge,
  type Edge
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import { createSharedComposable } from '@vueuse/core'
import { isEmpty } from 'lodash-es'

export const useDragIndicator = createSharedComposable(() => {
  const dragIndicatorEdge = ref<Edge | null>(null)
  const dragOverSectionId = ref<string | null>(null)

  return { dragIndicatorEdge, dragOverSectionId }
})

export const useSectionDragAndDrop = ({ sectionEls }: { sectionEls: Ref<HTMLElement[]> }) => {
  const { dragIndicatorEdge, dragOverSectionId } = useDragIndicator()

  const makeSectionsDraggable = () => {
    sectionEls.value.forEach((el) => {
      const sectionId = el.dataset.dndSectionId
      draggable({
        element: el,
        dragHandle: el.querySelector('[data-dnd-section-drag-handle]') ?? undefined,
        getInitialData: () => {
          return { sectionId }
        },
        onGenerateDragPreview: ({ nativeSetDragImage }) => {
          if (!sectionId) return
          setCustomNativeDragPreview({
            getOffset: centerUnderPointer,
            render: ({ container }) => {
              const app = createApp({
                render: () =>
                  h(Teleport, { to: container }, [
                    h(SurfaceSection, { id: sectionId, mode: 'drag-preview' })
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
  }

  const setupDropTargets = () => {
    sectionEls.value.forEach((el) => {
      const sectionId = el.dataset.dndSectionId
      dropTargetForElements({
        element: el,
        getData: ({ input }) => {
          return attachClosestEdge(
            { sectionId },
            {
              element: el,
              input,
              allowedEdges: ['left', 'right']
            }
          )
        },
        canDrop: ({ source }) => {
          return !isEmpty(source.data.sectionId)
        },
        onDrag: ({ self, source }) => {
          const isSource = source.element === el
          if (isSource) {
            dragIndicatorEdge.value = null
            dragOverSectionId.value = null
            return
          }
          const closestEdge = extractClosestEdge(self.data)
          dragIndicatorEdge.value = closestEdge
          dragOverSectionId.value = self.data.sectionId as string
        },
        onDragLeave() {
          dragIndicatorEdge.value = null
          dragOverSectionId.value = null
        },
        onDrop() {
          dragIndicatorEdge.value = null
          dragOverSectionId.value = null
        }
      })
    })
  }

  onMounted(() => {
    makeSectionsDraggable()
    setupDropTargets()
  })
}
